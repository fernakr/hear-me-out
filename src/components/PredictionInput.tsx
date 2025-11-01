'use client'
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
// The 'transformers' import must be dynamic for Next.js to avoid SSR issues.
// We'll manage the import within useEffect.

// The model name we're using - back to DistilGPT-2 with different approach
const MODEL_NAME = 'Xenova/distilgpt2';

// Constants for better performance
const INITIAL_PREDICTION_DELAY = 100;

// Type for the transformers pipeline - use unknown to bypass type checking issues
type TextGenerationPipeline = unknown;

export default function PredictionInput() {
    // State to manage model loading
    const [isModelLoading, setIsModelLoading] = useState<boolean>(true);
    const [modelError, setModelError] = useState<string | null>(null);
    // State for the user's input text - start with "I " by default
    const [inputText, setInputText] = useState<string>('I ');
    // State for the generated suggestions - now with separation between new and previous
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [previousSuggestions, setPreviousSuggestions] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    // Track if this is the first interaction (for immediate suggestions)
    const [isFirstRun, setIsFirstRun] = useState<boolean>(true);

    // Use a ref to hold the generator pipeline object so it persists across renders
    const generatorRef = useRef<TextGenerationPipeline | null>(null);

    // Track if we're waiting for the delay to provide suggestions
    const [isWaitingForSuggestions, setIsWaitingForSuggestions] = useState<boolean>(false);

    // Track typing activity for "Take your time..." message
    const [showTakeYourTime, setShowTakeYourTime] = useState<boolean>(false);
    const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Flag to prevent overlapping predictions
    const [isPredicting, setIsPredicting] = useState<boolean>(false);

    // AbortController for cancelling predictions
    const abortControllerRef = useRef<AbortController | null>(null);

    // --- 1. Model Loading ---
    useEffect(() => {
        let isMounted = true;

        // Dynamic import of the pipeline function
        async function loadPipeline() {
            try {
                // This import ensures the heavy library code only runs in the browser
                const { pipeline, env } = await import('@xenova/transformers');

                // Configure the environment for browser usage
                env.allowRemoteModels = true;
                env.allowLocalModels = false;

                if (!isMounted) return;

                // Initialize the pipeline and store it in the ref
                generatorRef.current = (await pipeline('text-generation', MODEL_NAME, {
                    revision: 'main',
                    quantized: true,
                })) as TextGenerationPipeline;

                if (!isMounted) return;
                setIsModelLoading(false);
            } catch (error) {
                console.error('Error loading model:', error);
                if (!isMounted) return;
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                setModelError(errorMessage);
                setIsModelLoading(false);
            }
        }

        loadPipeline();

        // Cleanup function for the effect
        return () => {
            isMounted = false;
            const typingTimer = typingTimerRef.current;
            if (typingTimer) {
                clearTimeout(typingTimer);
            }
            // Cancel any ongoing predictions on unmount
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []); // Empty dependency array means this runs only once on mount

    // --- 2. Therapeutic & Introspective Words for Self-Reflection ---
    // Pre-defined word sets for better performance
    // Curated therapeutic word sets with intent-based categories
    const THERAPEUTIC_WORD_SETS = useMemo(() => ({
        // Emotional states and feelings
        emotions: ['feel', 'felt', 'feeling', 'emotional', 'overwhelmed', 'anxious', 'stressed', 'worried', 'sad', 'angry', 'frustrated', 'hopeful', 'grateful', 'calm', 'peaceful', 'excited', 'nervous', 'relieved', 'disappointed', 'proud'],

        // Challenges and difficulties
        struggles: ['struggle', 'struggling', 'difficult', 'challenging', 'hard', 'tough', 'overwhelming', 'stuck', 'lost', 'confused', 'uncertain', 'afraid', 'scared', 'troubled', 'bothered', 'stressed'],

        // Needs and desires
        needs: ['need', 'want', 'require', 'seek', 'hope', 'wish', 'desire', 'long', 'crave', 'yearn', 'miss', 'lack', 'require', 'deserve'],

        // Support and resources
        support: ['help', 'support', 'guidance', 'comfort', 'understanding', 'compassion', 'empathy', 'care', 'love', 'acceptance', 'validation', 'encouragement'],

        // Actions and behaviors
        actions: ['try', 'attempt', 'work', 'practice', 'learn', 'grow', 'change', 'improve', 'develop', 'progress', 'move', 'step', 'start', 'continue', 'stop'],

        // Thoughts and cognition
        thoughts: ['think', 'believe', 'wonder', 'question', 'doubt', 'know', 'understand', 'realize', 'recognize', 'remember', 'forget', 'imagine', 'consider'],

        // Relationships and social
        relationships: ['family', 'friends', 'partner', 'therapist', 'people', 'others', 'community', 'connections', 'relationships', 'loved', 'alone'],

        // Time and frequency
        time: ['today', 'yesterday', 'tomorrow', 'recently', 'lately', 'often', 'sometimes', 'always', 'never', 'usually', 'currently'],

        // Connective and transitional words
        connectors: ['and', 'but', 'or', 'so', 'because', 'although', 'however', 'therefore', 'meanwhile', 'also', 'too', 'even', 'still', 'yet', 'then']
    }), []);



    // Pattern-based next word prediction as fallback
    const getPatternBasedNextWords = useCallback((text: string): string[] => {
        const lowercaseText = text.toLowerCase();

        // Common therapeutic sentence completion patterns
        if (text.endsWith(' I')) {
            return ['feel', 'am', 'have', 'need', 'want', 'think'];
        }
        if (text.endsWith(' feel') || text.endsWith(' felt')) {
            return ['like', 'that', 'so', 'really', 'very', 'quite'];
        }
        if (text.endsWith(' am')) {
            return ['feeling', 'struggling', 'trying', 'going', 'having', 'experiencing'];
        }
        if (text.endsWith(' need')) {
            return ['to', 'help', 'support', 'someone', 'time', 'space'];
        }
        if (text.endsWith(' want')) {
            return ['to', 'help', 'someone', 'things', 'life', 'change'];
        }
        if (text.endsWith(' think')) {
            return ['about', 'that', 'I', 'maybe', 'sometimes', 'it'];
        }
        if (text.endsWith(' have')) {
            return ['been', 'trouble', 'difficulty', 'problems', 'feelings', 'thoughts'];
        }
        if (text.endsWith(' with')) {
            return ['my', 'this', 'these', 'people', 'family', 'work'];
        }
        if (text.endsWith(' my')) {
            return ['feelings', 'thoughts', 'family', 'relationship', 'work', 'life'];
        }
        if (text.endsWith(' to')) {
            return ['understand', 'feel', 'talk', 'work', 'help', 'change'];
        }
        if (text.endsWith(' about')) {
            return ['my', 'this', 'what', 'how', 'why', 'everything'];
        }
        if (text.endsWith(' like')) {
            return ['I', 'this', 'everything', 'nothing', 'something', 'someone'];
        }
        if (text.endsWith(' that')) {
            return ['I', 'this', 'everything', 'nothing', 'people', 'life'];
        }
        if (text.endsWith(' it')) {
            return ['feels', 'seems', 'makes', 'hurts', 'helps', 'matters'];
        }

        // Context-based suggestions for longer phrases
        if (/struggling|difficult|hard|tough/.test(lowercaseText)) {
            return ['with', 'to', 'because', 'and', 'but', 'when'];
        }
        if (/feel|feeling|felt|emotional/.test(lowercaseText)) {
            return ['like', 'that', 'so', 'when', 'because', 'about'];
        }
        if (/family|relationship|people|friend/.test(lowercaseText)) {
            return ['and', 'because', 'when', 'but', 'who', 'that'];
        }
        if (/help|support|guidance/.test(lowercaseText)) {
            return ['me', 'with', 'to', 'because', 'and', 'when'];
        }

        // Default therapeutic connectors and common next words
        return ['and', 'but', 'because', 'when', 'that', 'so'];
    }, []);

    // Random word generator for more creative suggestions
    const getRandomWords = useCallback((): string[] => {
        const randomWords = [
            // Creative/abstract words
            'wandering', 'floating', 'dancing', 'singing', 'painting', 'dreaming', 'flowing', 'glowing',
            // Nature words
            'ocean', 'mountain', 'forest', 'river', 'sunset', 'moonlight', 'breeze', 'storm',
            // Feelings/states
            'curious', 'playful', 'gentle', 'fierce', 'tender', 'bold', 'quiet', 'vibrant',
            // Actions
            'exploring', 'creating', 'discovering', 'building', 'nurturing', 'healing', 'growing', 'blooming',
            // Abstract concepts  
            'mystery', 'wonder', 'magic', 'journey', 'adventure', 'story', 'chapter', 'beginning',
            // Colors/textures
            'golden', 'silver', 'warm', 'cool', 'soft', 'bright', 'deep', 'light'
        ];

        // Shuffle and return 2-3 random words
        const shuffled = randomWords.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.floor(Math.random() * 2) + 2); // 2-3 words
    }, []);

    // Predict next words using LLM based on therapeutic context
    const predictNextWords = useCallback(async (text: string, abortSignal?: AbortSignal): Promise<string[]> => {
        if (!generatorRef.current) return [];

        try {
            const prompt = `Complete this therapeutic sentence with the most natural next word. Consider the emotional context and therapeutic flow.

Sentence: "${text}"

Provide 10 different natural next words that would therapeutically complete this sentence. Focus on:
- What would naturally come next in conversation
- Therapeutic vocabulary that helps expression
- Emotional continuity and support
- Common sentence patterns in therapy

Respond with just 10 words separated by commas:`;

            // Check if aborted before starting LLM call
            if (abortSignal?.aborted) {
                throw new Error('Prediction aborted');
            }

            // Add timeout to prevent hanging
            const timeoutPromise = new Promise<never>((_, reject) => {
                const timeoutId = setTimeout(() => reject(new Error('Prediction timeout')), 2000);
                abortSignal?.addEventListener('abort', () => {
                    clearTimeout(timeoutId);
                    reject(new Error('Prediction aborted'));
                });
            });

            const generator = generatorRef.current as {
                (prompt: string, options: Record<string, unknown>): Promise<Array<{ generated_text: string }>>;
                tokenizer?: { eos_token_id: number };
            };

            const predictionPromise = generator(prompt, {
                max_new_tokens: 20,
                temperature: 0.3,
                do_sample: true,
                pad_token_id: generator.tokenizer?.eos_token_id,
            });

            const output = await Promise.race([predictionPromise, timeoutPromise]);

            if (output && output.length > 0 && output[0].generated_text) {
                const response = output[0].generated_text.replace(prompt, '').trim();
                const words = response.split(',')
                    .map((w: string) => w.trim().toLowerCase())
                    .filter((w: string) => w && /^[a-z]+$/.test(w))
                    .slice(0, 10);

                if (words.length > 0) {
                    return words;
                }
            }
        } catch (error) {
            console.error('LLM next word prediction error:', error);
        }

        return [];
    }, []);

    // Smart next-word prediction based on therapeutic context and sentence completion
    const getContextualWords = useCallback(async (text: string, abortSignal?: AbortSignal): Promise<string[]> => {
        const trimmedText = text.trim();
        const lowercaseText = trimmedText.toLowerCase();

        // For "I" or empty, return initial therapeutic starters with more options
        if (!trimmedText || trimmedText === 'I' || lowercaseText === 'i') {
            return ['feel', 'am', 'have', 'need', 'want', 'think', 'see', 'know', 'believe', 'hope'];
        }

        // Analyze intent and predict next logical words
        try {
            const nextWords = await predictNextWords(trimmedText, abortSignal);
            if (nextWords && nextWords.length > 0) {
                return nextWords;
            }
        } catch (error) {
            console.log('Next word prediction failed, using context patterns:', error);
        }

        // Fallback to pattern-based next word prediction
        return getPatternBasedNextWords(trimmedText);
    }, [predictNextWords, getPatternBasedNextWords]);

    // --- 3. Prediction Logic (Memoized) ---
    const predictNext = useCallback(async (text: string) => {
        if (!generatorRef.current) {
            setSuggestions([]);
            return;
        }

        // Cancel any ongoing prediction
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Prevent overlapping predictions
        if (isPredicting) {
            console.log('Prediction already in progress, aborting previous...');
            setIsPredicting(false);
            setIsGenerating(false);
        }

        const trimmedText = text.trim();
        if (trimmedText.length < 1) {
            setSuggestions([]);
            return;
        }

        // Create new AbortController for this prediction
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        setIsPredicting(true);
        setIsGenerating(true);

        // Don't clear current suggestions yet - keep them visible during loading

        try {
            // Check if aborted before starting
            if (abortController.signal.aborted) {
                return;
            }

            // Wrap prediction in timeout to prevent page lockup
            const predictionTimeout = new Promise<string[]>((_, reject) => {
                const timeoutId = setTimeout(() => reject(new Error('Prediction timeout')), 1000);
                abortController.signal.addEventListener('abort', () => {
                    clearTimeout(timeoutId);
                    reject(new Error('Prediction aborted'));
                });
            });

            const predictionPromise = getContextualWords(text, abortController.signal);

            const contextualWords = await Promise.race([predictionPromise, predictionTimeout]);

            // Check if aborted after getting results
            if (abortController.signal.aborted) {
                return;
            }

            console.log('Intent-based suggestions:', contextualWords);

            // Check if aborted before processing results
            if (abortController.signal.aborted) {
                return;
            }

            // Add some random creative words to the mix
            const randomWords = getRandomWords();
            const allNewSuggestions = [...contextualWords, ...randomWords];

            // Remove duplicates and limit to 10 new suggestions
            const uniqueNewSuggestions = [...new Set(allNewSuggestions)].slice(0, 10);

            // Check if aborted before setting state
            if (abortController.signal.aborted) {
                return;
            }

            // Move current suggestions to previous, then set new suggestions
            setSuggestions(currentSuggestions => {
                // Add current suggestions to previous if they exist
                if (currentSuggestions.length > 0) {
                    setPreviousSuggestions(prev => {
                        const combined = [...currentSuggestions, ...prev];
                        const unique = [...new Set(combined)];
                        return unique.slice(0, 30);
                    });
                }

                // Return empty first, then we'll set the filtered suggestions after
                return [];
            });

            // Set new suggestions after moving current to previous
            setTimeout(() => {
                // Final abort check before setting results
                if (abortController.signal.aborted) {
                    return;
                }

                setPreviousSuggestions(prevSuggestions => {
                    const filteredSuggestions = uniqueNewSuggestions.filter(word => !prevSuggestions.includes(word));
                    setSuggestions(filteredSuggestions.slice(0, 10));
                    return prevSuggestions; // Don't change previous suggestions
                });
            }, 0);
        } catch (error) {
            // Don't show errors for aborted operations
            if (error instanceof Error && error.message === 'Prediction aborted') {
                console.log('Prediction was cancelled');
                return;
            }

            console.error('Error generating predictions:', error);

            // Check if aborted before setting fallback
            if (abortController.signal.aborted) {
                return;
            }

            // Fallback to basic therapeutic words plus random words
            const fallbackWords = [
                ...THERAPEUTIC_WORD_SETS.emotions.slice(0, 5),
                ...THERAPEUTIC_WORD_SETS.connectors.slice(0, 3),
                ...getRandomWords()
            ];
            // Move current suggestions to previous, then set fallback suggestions
            setSuggestions(currentSuggestions => {
                // Add current suggestions to previous if they exist
                if (currentSuggestions.length > 0) {
                    setPreviousSuggestions(prev => {
                        const combined = [...currentSuggestions, ...prev];
                        const unique = [...new Set(combined)];
                        return unique.slice(0, 30);
                    });
                }

                // Return empty first, then we'll set the filtered fallback after
                return [];
            });

            // Set fallback suggestions after moving current to previous
            setTimeout(() => {
                // Final abort check before setting fallback results
                if (abortController.signal.aborted) {
                    return;
                }

                setPreviousSuggestions(prevSuggestions => {
                    const filteredFallback = [...new Set(fallbackWords)]
                        .filter(word => !prevSuggestions.includes(word))
                        .slice(0, 10);
                    setSuggestions(filteredFallback);
                    return prevSuggestions; // Don't change previous suggestions
                });
            }, 0);
        } finally {
            // Only reset state if this is still the current controller
            if (abortControllerRef.current === abortController) {
                setIsPredicting(false);
                setIsGenerating(false);
                setIsWaitingForSuggestions(false);
                abortControllerRef.current = null;
            }
        }

    }, [getContextualWords, THERAPEUTIC_WORD_SETS, getRandomWords, isPredicting]); // Dependencies

    // Separate effect to trigger initial predictions when model is loaded
    useEffect(() => {
        console.log('Initial predictions effect - loading:', isModelLoading, 'generator:', !!generatorRef.current);
        if (generatorRef.current && !isModelLoading && !modelError) {
            console.log('Triggering initial predictions for "I "');
            // Trigger initial predictions for the default "I " text (with space)
            setTimeout(() => {
                console.log('Calling predictNext("I ")');
                predictNext('I ');
            }, INITIAL_PREDICTION_DELAY);
        }
    }, [isModelLoading, modelError, predictNext]); // Trigger when loading completes

    // --- 3. Input Change Handler (Only predicts after space/word completion) ---
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        const previousValue = inputText;

        setInputText(value);

        // Handle typing activity for "Take your time..." message
        setShowTakeYourTime(true);

        // Immediately abort any ongoing prediction
        if (abortControllerRef.current) {
            console.log('Aborting prediction due to new input');
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        // Clear previous timers and stop any ongoing predictions
        if (typingTimerRef.current) {
            clearTimeout(typingTimerRef.current);
        }
        setIsWaitingForSuggestions(false);

        // Reset prediction state when typing to prevent lockups
        setIsPredicting(false);
        setIsGenerating(false);

        // Clear suggestions while typing (but don't affect previous suggestions)
        setSuggestions([]);

        // Only trigger prediction logic if:
        // 1. A space was just added (word completed)
        // 2. Or if text ends with space and we're typing after it
        // 3. Or if we're at the start of input (empty or sentence ending)
        const justAddedSpace = value.length > previousValue.length && value.endsWith(' ') && !previousValue.endsWith(' ');
        const isStartingNew = value.trim() === '' || value.match(/[.!?]\s*$/);
        const shouldPredict = justAddedSpace || isStartingNew;

        if (shouldPredict) {
            // Set timer for "Take your time..." message (0.75 seconds)
            // After 0.75 seconds: hide message, start loading predictions
            typingTimerRef.current = setTimeout(() => {
                setShowTakeYourTime(false);
                setIsWaitingForSuggestions(true);

                // Start prediction after showing loading state
                predictNext(value);

                // Mark that we've had our first interaction
                if (isFirstRun) {
                    setIsFirstRun(false);
                }
            }, 750);
        } else {
            // For non-prediction triggering typing, just hide "Take your time..." after 0.75 seconds
            typingTimerRef.current = setTimeout(() => {
                setShowTakeYourTime(false);
            }, 750);
        }
    };

    // --- 4. Suggestion Click Handler ---
    const applySuggestion = useCallback((suggestion: string) => {
        // Allow suggestions to be clicked even during generation

        // Append the suggestion and a space to the input text
        setInputText(currentText => {
            const newText = currentText + (currentText.endsWith(' ') ? '' : ' ') + suggestion + ' ';

            // Move current suggestions to previous and clear current
            setSuggestions(currentSuggestions => {
                if (currentSuggestions.length > 0) {
                    setPreviousSuggestions(prevSuggestions => {
                        const combined = [...currentSuggestions, ...prevSuggestions];
                        const unique = [...new Set(combined)];
                        return unique.slice(0, 30);
                    });
                }
                return []; // Clear current suggestions
            });

            // Use setTimeout to ensure the state update happens first, then generate new predictions
            setTimeout(() => {
                predictNext(newText);
                // When user clicks a suggestion, they're actively engaging, so reset to immediate mode
                setIsFirstRun(true);
            }, 50); // Small delay to ensure clean state

            return newText;
        });
    }, [predictNext]);

    // --- 5. Keyboard Navigation Handler ---
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab' && suggestions.length > 0) {
            e.preventDefault();
            applySuggestion(suggestions[0]); // Apply first suggestion on Tab
        }
    }, [suggestions, applySuggestion]);

    // Show loading state while model is initializing
    if (isModelLoading) {
        return (
            <div className="p-5 w-full max-w-3xl mx-auto">
                <h2 className="text-xl font-bold mb-4">LLM Text Anticipation Demo</h2>
                <div className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400">
                    <div className="w-4 h-4 border-2 border-blue-200 dark:border-blue-600 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
                    <span className="font-medium">Loading intelligent predictions...</span>
                </div>

                <div className="relative">
                    {/* Loading skeleton for textarea */}
                    <div className="w-full h-24 mb-4 p-3 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 animate-pulse">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-2"></div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/6"></div>
                    </div>
                </div>

                <div className="min-h-[80px] flex flex-wrap gap-2">
                    {/* Loading skeleton for suggestions */}
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 rounded-full animate-pulse h-7 w-16"></div>
                    ))}
                </div>
            </div>
        );
    }

    // Show error state if model failed to load
    if (modelError) {
        return (
            <div className="p-5 w-full max-w-3xl mx-auto">
                <h2 className="text-xl font-bold mb-4">LLM Text Anticipation Demo</h2>
                <div className="flex items-center gap-2 mb-4 text-red-600 dark:text-red-400">
                    <div className="w-4 h-4 bg-red-600 dark:bg-red-400 rounded-full"></div>
                    <span className="font-medium">Unable to load predictions. Please refresh and try again.</span>
                </div>

                <div className="relative">
                    <textarea
                        id="input-text"
                        rows={4}
                        value={inputText}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        disabled={true}
                        placeholder="Predictions unavailable - please refresh"
                        className="w-full text-lg mb-4 p-3 border border-red-300 dark:border-red-600 rounded-md resize-y opacity-50 cursor-not-allowed"
                        aria-label="Text input (predictions unavailable)"
                    />
                </div>

                <div className="min-h-[80px] flex items-center justify-center">
                    <div className="text-gray-500 dark:text-gray-400 text-sm">
                        Predictions are temporarily unavailable
                    </div>
                </div>
            </div>
        );
    }

    // Normal loaded state (no status message)
    return (
        <div className="p-5 w-full max-w-3xl mx-auto">
            <h2 className="text-xl font-bold mb-4">Either type or use the helper bubbles</h2>
            <div className="relative">
                <textarea
                    id="input-text"
                    rows={4}
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    disabled={!generatorRef.current}
                    placeholder={generatorRef.current ? "Start typing a sentence..." : "Waiting for model to load..."}
                    className={`w-full text-lg mb-4 p-3 border rounded-md resize-y transition-all duration-200 ${isGenerating
                        ? 'border-blue-500 dark:border-blue-400 shadow-[0_0_0_1px_rgba(59,130,246,0.3)] dark:shadow-[0_0_0_1px_rgba(96,165,250,0.3)]'
                        : 'border-blue-600 dark:border-yellow-600'
                        } ${!generatorRef.current ? 'opacity-50 cursor-not-allowed' : ''}`}
                    aria-label="Text input for therapeutic writing with AI suggestions"
                    aria-describedby="suggestions-container"
                />
                {isGenerating && (
                    <div className="absolute top-2 right-2 pointer-events-none" aria-hidden="true">
                        <div className="w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse opacity-60"></div>
                    </div>
                )}
            </div>

            <div id="suggestions-container" className="min-h-[80px] flex flex-wrap gap-2" role="region" aria-label="Word suggestions">
                {/* Show "Take your time..." message at the beginning when waiting */}
                {showTakeYourTime && !isWaitingForSuggestions && (
                    <div className="flex items-center gap-2 px-4 py-3 text-blue-600 dark:text-blue-400 text-base font-medium bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/30" aria-live="polite">
                        <div className="w-5 h-5 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse mr-1"></div>
                        <span>Take your time...</span>
                    </div>
                )}

                {/* Show loading skeleton when generating new suggestions */}
                {(isGenerating || isWaitingForSuggestions) && !showTakeYourTime && (
                    <>
                        {/* Loading skeleton for new suggestions */}
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                            <div key={i} className="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 rounded-full animate-pulse h-7" style={{ width: `${Math.random() * 40 + 60}px` }}></div>
                        ))}
                    </>
                )}

                {/* New suggestions with highlighted styling */}
                {!isGenerating && !isWaitingForSuggestions && !showTakeYourTime && suggestions.filter(s => s !== 'Thinking...').map((suggestion, index) => (
                    <button
                        key={`new-${suggestion}-${index}`}
                        onClick={() => applySuggestion(suggestion)}
                        disabled={!generatorRef.current}
                        className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 whitespace-nowrap max-w-[150px] overflow-hidden text-ellipsis border-2 bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-50 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 hover:-translate-y-0.5 active:translate-y-0 shadow-sm ${!generatorRef.current ? 'opacity-60 cursor-not-allowed' : ''}`}
                        aria-label={`Add new word: ${suggestion}`}
                    >
                        {suggestion}
                    </button>
                ))}

                {/* Previous suggestions with muted styling - always show when available */}
                {previousSuggestions.map((suggestion, index) => (
                    <button
                        key={`prev-${suggestion}-${index}`}
                        onClick={() => applySuggestion(suggestion)}
                        disabled={!generatorRef.current}
                        className={`inline-flex items-center gap-2 px-2.5 py-1 text-xs font-normal rounded-full transition-all duration-200 whitespace-nowrap max-w-[120px] overflow-hidden text-ellipsis bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 ${!generatorRef.current ? 'opacity-40 cursor-not-allowed' : ''}`}
                        aria-label={`Add previous word: ${suggestion}`}
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
        </div>
    );
}