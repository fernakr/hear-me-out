'use client'
import React, { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AutoResizeTextarea from './AutoResizeTextarea';
import P5SuggestionBackground from './P5SuggestionBackground';
import StartOverButton from './StartOverButton';
import {
    getPatternBasedNextWords,
    getContextualWords,
    getRandomWords,
    getRandomSkills,
    getUsedWords
} from '@/lib/prediction-engine';

// Constants for configuration
const SUGGESTION_CONFIG = {
    CURRENT_SUGGESTIONS_LIMIT: 30,
    MAX_PREVIOUS_SUGGESTIONS: 200,
    PATTERN_SUGGESTIONS_COUNT: 20,
    CONTEXTUAL_SUGGESTIONS_COUNT: 10,
    RANDOM_SUGGESTIONS_COUNT: 4,
    SKILL_SUGGESTIONS_COUNT: 6,
    GENERATION_DELAY: 500,
    SUGGESTION_GENERATION_DELAY: 1000,
    MIN_WORD_COUNT_FOR_QUESTIONNAIRE: 7, // Increased by 2 to account for "I [connector]"
    MAX_WORD_COUNT_FOR_QUESTIONNAIRE: 40
} as const;

// Connector words that follow "I" in therapeutic contexts
const CONNECTOR_WORDS = [
    'feel',
    'am',
    'need',
    'want',
    'have',
    'can',
    'believe',
    'hope',
    'think',
    'know',
    'struggle',
    'wish',
    'understand',
    'realize',
    'remember',
    'notice',
    'experience',
    'appreciate',
    'value',
    'love'
] as const;

// Helpful tip prompts to inspire users
const HELPFUL_TIPS = [
    "Think about a recent emotion you experienced. What was it like?",
    "Consider a challenge you're facing right now. How does it make you feel?",
    "Reflect on something you're grateful for today.",
    "What's one thing you wish others understood about you?",
    "Think about a moment when you felt truly heard or seen.",
    "Consider a goal or dream that's important to you.",
    "Reflect on a relationship that brings you joy or concern.",
    "What's something you've learned about yourself recently?",
    "Think about a fear or worry that's been on your mind.",
    "Consider a strength or quality you appreciate about yourself.",
    "Reflect on a time when you overcame something difficult.",
    "What's one thing you need more of in your life right now?",
    "Think about a memory that still brings you comfort.",
    "Consider something you're curious or excited about.",
    "Reflect on a value or belief that guides your decisions."
] as const;

export default function ThreePartInput() {
    const router = useRouter();

    // State management
    const [selectedConnector, setSelectedConnector] = useState<string>('feel');
    const [textareaContent, setTextareaContent] = useState<string>('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [previousSuggestions, setPreviousSuggestions] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [hasInitialized, setHasInitialized] = useState<boolean>(false);
    const [showTip, setShowTip] = useState<boolean>(false);
    const [currentTip, setCurrentTip] = useState<string>('');
    const [tipIndex, setTipIndex] = useState<number>(0);

    // Refs
    const suggestionTimerRef = useRef<NodeJS.Timeout | null>(null);
    const tipTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Get the full combined text
    const getFullText = useCallback((): string => {
        return `I ${selectedConnector} ${textareaContent}`.trim();
    }, [selectedConnector, textareaContent]);

    // Helper function to count words in full text
    const getWordCount = useCallback((): number => {
        const fullText = getFullText();
        return fullText.trim().split(/\s+/).filter(word => word.length > 0).length;
    }, [getFullText]);

    // Helper function to combine and filter suggestions
    const combineAndFilterSuggestions = useCallback((
        patternSuggestions: string[],
        contextualWords: string[],
        randomWords: string[],
        skillWords: string[],
        wordsToAvoid: Set<string>
    ): string[] => {
        // Filter all suggestion types
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
            const shuffled = [...uniqueSuggestions].sort(() => 0.5 - Math.random());
            return shuffled.slice(0, SUGGESTION_CONFIG.CURRENT_SUGGESTIONS_LIMIT);
        }

        return uniqueSuggestions;
    }, []);

    // Main prediction logic
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

    // Handle connector word change
    const handleConnectorChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const newConnector = e.target.value;
        setSelectedConnector(newConnector);

        // Generate new suggestions based on the new connector word
        const newFullText = `I ${newConnector} ${textareaContent}`.trim();
        if (newFullText.length > 2) {
            generateSuggestions(newFullText, previousSuggestions);
        }
    }, [textareaContent, generateSuggestions, previousSuggestions]);

    // Handle textarea changes
    const handleTextareaChange = useCallback((value: string) => {
        setTextareaContent(value);

        // Clear existing timer
        if (suggestionTimerRef.current) {
            clearTimeout(suggestionTimerRef.current);
        }

        // Generate suggestions after user stops typing
        suggestionTimerRef.current = setTimeout(() => {
            const fullText = `I ${selectedConnector} ${value}`.trim();
            if (fullText.length > 2) {
                generateSuggestions(fullText, previousSuggestions);
            }
        }, SUGGESTION_CONFIG.SUGGESTION_GENERATION_DELAY);
    }, [selectedConnector, generateSuggestions, previousSuggestions]);

    // Handle applying a suggestion
    const applySuggestion = useCallback((word: string) => {
        try {
            const newTextareaContent = textareaContent + (textareaContent.endsWith(' ') ? word : ' ' + word) + ' ';
            setTextareaContent(newTextareaContent);

            // Remove the clicked word from current suggestions immediately
            setSuggestions(current => current.filter(w => w !== word));

            // Remove the clicked word from previous suggestions as well
            const updatedPreviousSuggestions = previousSuggestions.filter(w => w !== word);
            setPreviousSuggestions(updatedPreviousSuggestions);

            // Generate new suggestions based on the updated text
            const newFullText = `I ${selectedConnector} ${newTextareaContent}`.trim();
            generateSuggestions(newFullText, updatedPreviousSuggestions);
        } catch (error) {
            console.error('Error applying suggestion:', error);
        }
    }, [textareaContent, selectedConnector, generateSuggestions, previousSuggestions]);

    // Show a helpful tip
    const showHelpfulTip = useCallback(() => {
        const nextIndex = tipIndex % HELPFUL_TIPS.length;
        setCurrentTip(HELPFUL_TIPS[nextIndex]);
        setTipIndex(prevIndex => prevIndex + 1);
        setShowTip(true);

        // Auto-hide after 8 seconds to match animation duration
        setTimeout(() => {
            setShowTip(false);
        }, 8000);
    }, [tipIndex]);

    // Dismiss tip manually
    const dismissTip = useCallback(() => {
        setShowTip(false);
    }, []);

    // Initialize with suggestions for the default text
    React.useEffect(() => {
        if (!hasInitialized) {
            setHasInitialized(true);
            const initialText = `I ${selectedConnector}`;
            generateSuggestions(initialText, []);
        }
    }, [hasInitialized, selectedConnector, generateSuggestions]);

    // Setup tip timer - show tips every minute
    React.useEffect(() => {
        // Use shorter interval in development for testing
        const tipInterval = process.env.NODE_ENV === 'development' ? 10000 : 60000; // 10s in dev, 60s in prod

        // Start timer after component is initialized and first tip after interval
        tipTimerRef.current = setTimeout(() => {
            showHelpfulTip();

            // Then show tips every interval
            tipTimerRef.current = setInterval(() => {
                showHelpfulTip();
            }, tipInterval);
        }, tipInterval);

        return () => {
            if (tipTimerRef.current) {
                clearTimeout(tipTimerRef.current);
                clearInterval(tipTimerRef.current);
            }
        };
    }, [showHelpfulTip]);

    // Cleanup suggestion timer on unmount
    React.useEffect(() => {
        return () => {
            if (suggestionTimerRef.current) {
                clearTimeout(suggestionTimerRef.current);
            }
            if (tipTimerRef.current) {
                clearTimeout(tipTimerRef.current);
                clearInterval(tipTimerRef.current);
            }
        };
    }, []);

    // Handle sending text to questionnaire
    const handleSendToQuestionnaire = useCallback(() => {
        try {
            const fullText = getFullText();
            const wordCount = getWordCount();
            if (wordCount >= SUGGESTION_CONFIG.MIN_WORD_COUNT_FOR_QUESTIONNAIRE) {
                const encodedText = encodeURIComponent(fullText);
                router.push(`/questionnaire?prefill=${encodedText}`);
            } else {
                router.push('/questionnaire');
            }
        } catch (error) {
            console.error('Error sending to questionnaire:', error);
            router.push('/questionnaire'); // Fallback
        }
    }, [getFullText, getWordCount, router]);

    return (
        <>
            {/* Floating text suggestions layer on top */}
            <P5SuggestionBackground
                suggestions={suggestions}
                previousSuggestions={previousSuggestions}
                onSuggestionClick={applySuggestion}
            />

            {/* Helpful tip cloud - non-blocking */}
            {showTip && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 px-4">
                    {/* Cloud-like tip bubble */}
                    <div className="relative bg-purple-50 rounded-2xl shadow-lg border border-purple-200 p-4 animate-fade-in-out max-w-lg">
                        {/* Cloud tail */}
                        <div className="absolute -bottom-2 left-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-purple-50"></div>

                        {/* Close button */}
                        <button
                            onClick={dismissTip}
                            className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 transition-colors p-1 rounded-full hover:bg-purple-100"
                            aria-label="Close tip"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Tip content */}
                        <div className="pr-6">
                            <div className="flex items-start">
                                <span className="text-base mr-2 mt-0.5">💡</span>
                                <p className="text-gray-800 text-sm leading-relaxed font-medium">
                                    {currentTip}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-8 w-full max-w-3xl mx-auto content-container flex flex-col items-center text-center">
                {/* Back button */}
                <div className="w-full flex justify-end mb-8">
                    <StartOverButton text="Back to Home" />
                </div>

                <label htmlFor="three-part-input" className="block mb-4 text-xl font-bold mb-4">
                    Start building your phrase by selecting a word and completing the thought. <br />Use the other floating words for inspiration.
                </label>

                {/* Three-part flex container */}
                <div
                    id="three-part-input"
                    className="flex flex-col md:flex-row md:items-start gap-3 w-full mb-4 p-4 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 input-interaction-zone"
                >
                    {/* Part 1 & 2: "I" + Connector dropdown (always together) */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            I
                        </div>

                        <select
                            value={selectedConnector}
                            onChange={handleConnectorChange}
                            className="text-lg p-2 border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            aria-label="Select connector word"
                        >
                            {CONNECTOR_WORDS.map((word) => (
                                <option key={word} value={word}>
                                    {word}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Part 3: Auto-resize textarea */}
                    <div className="flex-1 relative w-full md:w-auto">
                        <AutoResizeTextarea
                            value={textareaContent}
                            onChange={handleTextareaChange}
                            placeholder="the rest of your thought..."
                            className={`w-full text-lg p-2 border-none resize-none outline-none bg-transparent transition-all duration-200 ${isGenerating
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-gray-900 dark:text-gray-100'
                                }`}
                            aria-label="Complete your thought"
                        />
                        {isGenerating && (
                            <div className="absolute top-2 right-2 pointer-events-none" aria-hidden="true">
                                <div className="w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse opacity-60"></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Word count and requirements display */}
                <div className="flex justify-between items-stretch gap-8 text-sm text-gray-500 w-full mb-4">
                    <span>{getWordCount()} words</span>
                    <span>
                        {(() => {
                            const wordCount = getWordCount();
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
                    const wordCount = getWordCount();
                    return wordCount >= SUGGESTION_CONFIG.MIN_WORD_COUNT_FOR_QUESTIONNAIRE &&
                        wordCount <= SUGGESTION_CONFIG.MAX_WORD_COUNT_FOR_QUESTIONNAIRE;
                })() && (
                        <div className="flex justify-center">
                            <button
                                onClick={handleSendToQuestionnaire}
                                className="mt-5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                                aria-label="Use this text to start the questionnaire"
                            >
                                Use this text to start questionnaire →
                            </button>
                        </div>
                    )}

                {/* Instructions for the floating suggestions */}
                {/* <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
                    Click on the floating words around the screen for inspiration, or type freely in the text area.
                </div> */}
            </div>
        </>
    );
}