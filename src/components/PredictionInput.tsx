'use client'
import React, { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    getPatternBasedNextWords,
    getContextualWords,
    getRandomWords,
    getRandomSkills,
    getUsedWords
} from '@/lib/prediction-engine';

// Constants to eliminate magic numbers
const SUGGESTION_CONFIG = {
    CURRENT_SUGGESTIONS_LIMIT: 30,
    MAX_PREVIOUS_SUGGESTIONS: 200,
    PATTERN_SUGGESTIONS_COUNT: 20,        // Reduced to make room for skills
    CONTEXTUAL_SUGGESTIONS_COUNT: 10,     // Reduced to make room for skills
    RANDOM_SUGGESTIONS_COUNT: 4,          // Keep same
    SKILL_SUGGESTIONS_COUNT: 6,           // New category
    GENERATION_DELAY: 500,
    SUGGESTION_GENERATION_DELAY: 1000,    // One second delay for suggestion generation
    MIN_WORD_COUNT_FOR_QUESTIONNAIRE: 7, // Minimum 7 words to show "Use this text" button
    MAX_WORD_COUNT_FOR_QUESTIONNAIRE: 40  // Maximum 40 words to show "Use this text" button
} as const;

const SKELETON_WIDTHS = [70, 85, 95, 75, 100, 80] as const;

export default function PredictionInput() {
    const router = useRouter();
    
    // State management
    const [inputText, setInputText] = useState<string>('I ');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [previousSuggestions, setPreviousSuggestions] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [hasInitialized, setHasInitialized] = useState<boolean>(false);
    
    // Refs
    const suggestionTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Helper function to count words in text
    const getWordCount = useCallback((text: string): number => {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }, []);

    // Helper function to combine and filter suggestions
    const combineAndFilterSuggestions = useCallback((
        patternSuggestions: string[],
        contextualWords: string[],
        randomWords: string[],
        skillWords: string[],
        wordsToAvoid: Set<string>
    ): string[] => {
        // Filter all suggestion types and take more than needed
        const filteredPatterns = patternSuggestions
            .filter((word: string) => !wordsToAvoid.has(word.toLowerCase()))
            .slice(0, SUGGESTION_CONFIG.PATTERN_SUGGESTIONS_COUNT);
            
        const filteredContextual = contextualWords
            .filter((word: string) => !wordsToAvoid.has(word.toLowerCase()))
            .slice(0, SUGGESTION_CONFIG.CONTEXTUAL_SUGGESTIONS_COUNT);
            
        const filteredRandom = randomWords
            .filter((word: string) => !wordsToAvoid.has(word.toLowerCase()))
            .slice(0, SUGGESTION_CONFIG.RANDOM_SUGGESTIONS_COUNT);

        const filteredSkills = skillWords
            .filter((word: string) => !wordsToAvoid.has(word.toLowerCase()))
            .slice(0, SUGGESTION_CONFIG.SKILL_SUGGESTIONS_COUNT);

        // Combine all suggestions
        const allSuggestions = [...filteredPatterns, ...filteredContextual, ...filteredRandom, ...filteredSkills];
        
        // Remove duplicates
        const uniqueSuggestions = allSuggestions
            .filter((word, index, arr) => arr.indexOf(word) === index);

        // If we have more suggestions than the limit, randomly select from them
        if (uniqueSuggestions.length > SUGGESTION_CONFIG.CURRENT_SUGGESTIONS_LIMIT) {
            // Shuffle the array and take the first CURRENT_SUGGESTIONS_LIMIT items
            const shuffled = [...uniqueSuggestions].sort(() => 0.5 - Math.random());
            return shuffled.slice(0, SUGGESTION_CONFIG.CURRENT_SUGGESTIONS_LIMIT);
        }
        
        // If we have fewer suggestions, return all of them
        return uniqueSuggestions;
    }, []);

    // Main prediction logic - simplified and using imported functions
    const generateSuggestions = useCallback((text: string, currentPreviousSuggestions: string[] = []) => {
        try {
            const trimmedText = text.trim();
            if (trimmedText.length < 1) {
                setSuggestions([]);
                return;
            }

            setIsGenerating(true);

            setTimeout(() => {
                try {
                    // Get words to avoid
                    const usedWords = getUsedWords(text);
                    const wordsToAvoid = new Set([
                        ...Array.from(usedWords),
                        ...currentPreviousSuggestions.map(w => w.toLowerCase())
                    ]);

                    // Get suggestions from imported functions
                    const patternSuggestions = getPatternBasedNextWords(text);
                    const contextualWords = getContextualWords(text);
                    const randomWords = getRandomWords();
                    const skillWords = getRandomSkills();

                    // Combine and filter suggestions
                    const uniqueSuggestions = combineAndFilterSuggestions(
                        patternSuggestions,
                        contextualWords,
                        randomWords,
                        skillWords,
                        wordsToAvoid
                    );

                    // Update state
                    setSuggestions(currentSuggestions => {
                        const newPreviousSuggestions = [...currentSuggestions, ...currentPreviousSuggestions]
                            .filter(word => !usedWords.has(word.toLowerCase()))
                            .filter((word, index, arr) => arr.indexOf(word) === index)
                            .slice(0, SUGGESTION_CONFIG.MAX_PREVIOUS_SUGGESTIONS);

                        setPreviousSuggestions(newPreviousSuggestions);
                        return uniqueSuggestions;
                    });

                    setIsGenerating(false);
                } catch (error) {
                    console.error('Error generating suggestions:', error);
                    setIsGenerating(false);
                }
            }, SUGGESTION_CONFIG.GENERATION_DELAY);
        } catch (error) {
            console.error('Error in generateSuggestions:', error);
            setIsGenerating(false);
        }
    }, [combineAndFilterSuggestions]);

    // Handle input changes with improved error handling
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        try {
            const newText = e.target.value;
            setInputText(newText);

            // Clear existing timer
            if (suggestionTimerRef.current) {
                clearTimeout(suggestionTimerRef.current);
            }

            // Generate suggestions after user stops typing for a second
            suggestionTimerRef.current = setTimeout(() => {
                if (newText.trim().length > 0) {
                    generateSuggestions(newText, previousSuggestions);
                }
            }, SUGGESTION_CONFIG.SUGGESTION_GENERATION_DELAY);

        } catch (error) {
            console.error('Error handling input change:', error);
        }
    }, [generateSuggestions, previousSuggestions]);

    // Handle applying a suggestion with improved error handling
    const applySuggestion = useCallback((word: string) => {
        try {
            const newText = inputText + (inputText.endsWith(' ') ? word : ' ' + word) + ' ';
            setInputText(newText);

            // Remove the clicked word from current suggestions immediately
            setSuggestions(current => current.filter(w => w !== word));

            // Remove the clicked word from previous suggestions as well
            setPreviousSuggestions(previous => previous.filter(w => w !== word));

            // Generate new suggestions based on the updated text
            generateSuggestions(newText, previousSuggestions);
        } catch (error) {
            console.error('Error applying suggestion:', error);
        }
    }, [inputText, generateSuggestions, previousSuggestions]);

    // Handle keyboard shortcuts
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        try {
            if (e.key === 'Tab' && suggestions.length > 0) {
                e.preventDefault();
                applySuggestion(suggestions[0]);
            }
        } catch (error) {
            console.error('Error handling key down:', error);
        }
    }, [suggestions, applySuggestion]);

    // Initialize with suggestions for the default "I " text
    React.useEffect(() => {
        if (!hasInitialized) {
            setHasInitialized(true);
            generateSuggestions(inputText, previousSuggestions);
        }
    }, [hasInitialized, inputText, generateSuggestions, previousSuggestions]);

    // Cleanup suggestion timer on unmount
    React.useEffect(() => {
        return () => {
            if (suggestionTimerRef.current) {
                clearTimeout(suggestionTimerRef.current);
            }
        };
    }, []);

    // Handle sending text to questionnaire
    const handleSendToQuestionnaire = useCallback(() => {
        try {
            const textToSend = inputText.trim();
            const wordCount = getWordCount(textToSend);
            if (wordCount >= SUGGESTION_CONFIG.MIN_WORD_COUNT_FOR_QUESTIONNAIRE) {
                const encodedText = encodeURIComponent(textToSend);
                router.push(`/questionnaire?prefill=${encodedText}`);
            } else {
                router.push('/questionnaire');
            }
        } catch (error) {
            console.error('Error sending to questionnaire:', error);
            router.push('/questionnaire'); // Fallback
        }
    }, [inputText, router, getWordCount]);

    return (
        <div className="p-5 w-full max-w-3xl mx-auto">
            <h2 className="text-xl font-bold mb-4">Start typing or use the helper bubbles if you are struggling to come up with what you want to work on.</h2>

            <div className="relative">
                <textarea
                    id="input-text"
                    rows={4}
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Start typing a sentence..."
                    className={`w-full text-lg mb-4 p-3 border rounded-md resize-y transition-all duration-200 ${isGenerating
                        ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-950'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900'
                        } text-gray-900 dark:text-gray-100`}
                    aria-label="Text input for therapeutic writing with suggestions"
                    aria-describedby="suggestions-container"
                />
                {isGenerating && (
                    <div className="absolute top-2 right-2 pointer-events-none" aria-hidden="true">
                        <div className="w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse opacity-60"></div>
                    </div>
                )}
            </div>

            {/* Word count and requirements display */}
            <div className="flex justify-between mt-2 text-sm text-gray-500 mb-4">
                <span>{getWordCount(inputText)} words</span>
                <span>
                    {(() => {
                        const wordCount = getWordCount(inputText);
                        if (wordCount < SUGGESTION_CONFIG.MIN_WORD_COUNT_FOR_QUESTIONNAIRE) {
                            return `Need ${SUGGESTION_CONFIG.MIN_WORD_COUNT_FOR_QUESTIONNAIRE - wordCount} more words to continue`;
                        } else if (wordCount > SUGGESTION_CONFIG.MAX_WORD_COUNT_FOR_QUESTIONNAIRE) {
                            return `${wordCount - SUGGESTION_CONFIG.MAX_WORD_COUNT_FOR_QUESTIONNAIRE} words over limit`;
                        } else {
                            return '✓ Ready for questionnaire';
                        }
                    })()}
                </span>
            </div>

            {/* Send to Questionnaire Button */}
            {(() => {
                const wordCount = getWordCount(inputText);
                return wordCount >= SUGGESTION_CONFIG.MIN_WORD_COUNT_FOR_QUESTIONNAIRE && 
                       wordCount <= SUGGESTION_CONFIG.MAX_WORD_COUNT_FOR_QUESTIONNAIRE;
            })() && (
                <div className="mb-4">
                    <button
                        onClick={handleSendToQuestionnaire}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                        aria-label="Use this text to start the questionnaire"
                    >
                        Use this text to start questionnaire →
                    </button>
                </div>
            )}

            <div id="suggestions-container" className="min-h-20 flex flex-wrap gap-2 items-start justify-start align-top" role="region" aria-label="Word suggestions">
                {/* Show loading skeleton when generating suggestions */}
                {isGenerating && (
                    <>
                        {SKELETON_WIDTHS.map((width, index) => (
                            <div
                                key={`skeleton-${index}`}
                                className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse self-start"
                                style={{ width: `${width}px` }}
                                aria-hidden="true"
                            />
                        ))}
                    </>
                )}

                {/* Show actual suggestions */}
                {!isGenerating && (
                    <>
                        {/* New suggestions */}
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={`new-${suggestion}-${index}`}
                                onClick={() => applySuggestion(suggestion)}
                                className="px-3 py-2 text-sm font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors border border-blue-200 dark:border-blue-700 self-start"
                                aria-label={`Add new word: ${suggestion}`}
                            >
                                {suggestion}
                            </button>
                        ))}

                        {/* Previous suggestions */}
                        {previousSuggestions.map((suggestion, index) => (
                            <button
                                key={`prev-${suggestion}-${index}`}
                                onClick={() => applySuggestion(suggestion)}
                                className="px-3 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700 self-start"
                                aria-label={`Add previous word: ${suggestion}`}
                            >
                                {suggestion}
                            </button>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}