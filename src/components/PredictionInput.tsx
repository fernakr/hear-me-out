'use client'
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
// The 'transformers' import must be dynamic for Next.js to avoid SSR issues.
// We'll manage the import within useEffect.

// The model name we're using - back to DistilGPT-2 with different approach
const MODEL_NAME = 'Xenova/distilgpt2';

// Constants for better performance
const PREDICTION_DEBOUNCE_DELAY = 200;
const SUBSEQUENT_PREDICTION_DELAY = 1000; // 1 second delay for subsequent predictions
const INITIAL_PREDICTION_DELAY = 100;

// Type for the transformers pipeline
type GenerationOptions = {
    max_new_tokens?: number;
    num_return_sequences?: number;
    do_sample?: boolean;
    temperature?: number;
    top_k?: number;
    top_p?: number;
};

type TextGenerationPipeline = {
    (text: string, options?: GenerationOptions): Promise<Array<{ generated_text: string }>>;
};

export default function PredictionInput() {
    // State to manage model loading
    const [isModelLoading, setIsModelLoading] = useState<boolean>(true);
    const [modelError, setModelError] = useState<string | null>(null);
    // State for the user's input text - start with "I " by default
    const [inputText, setInputText] = useState<string>('I ');
    // State for the generated suggestions
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    // Track if this is the first interaction (for immediate suggestions)
    const [isFirstRun, setIsFirstRun] = useState<boolean>(true);

    // Use a ref to hold the generator pipeline object so it persists across renders
    const generatorRef = useRef<TextGenerationPipeline | null>(null);

    // Debounce timer ref to limit how often we call the prediction function
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Ref to track the previous input value to detect when a space is added
    const previousInputRef = useRef<string>('');

    // Track if we're waiting for the delay to provide suggestions
    const [isWaitingForSuggestions, setIsWaitingForSuggestions] = useState<boolean>(false);

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
                generatorRef.current = await pipeline('text-generation', MODEL_NAME, {
                    revision: 'main',
                    quantized: true,
                });

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
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
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

    // Predict next words using LLM based on therapeutic context
    const predictNextWords = useCallback(async (text: string): Promise<string[]> => {
        if (!generatorRef.current) return [];

        try {
            const prompt = `Complete this therapeutic sentence with the most natural next word. Consider the emotional context and therapeutic flow.

Sentence: "${text}"

Provide 6 different natural next words that would therapeutically complete this sentence. Focus on:
- What would naturally come next in conversation
- Therapeutic vocabulary that helps expression
- Emotional continuity and support
- Common sentence patterns in therapy

Respond with just 6 words separated by commas:`;

            const output = await generatorRef.current(prompt, {
                max_new_tokens: 20,
                temperature: 0.3,
                do_sample: true,
                pad_token_id: generatorRef.current.tokenizer.eos_token_id,
            });

            if (output && output.length > 0 && output[0].generated_text) {
                const response = output[0].generated_text.replace(prompt, '').trim();
                const words = response.split(',')
                    .map(w => w.trim().toLowerCase())
                    .filter(w => w && /^[a-z]+$/.test(w))
                    .slice(0, 6);

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
    const getContextualWords = useCallback(async (text: string): Promise<string[]> => {
        const trimmedText = text.trim();
        const lowercaseText = trimmedText.toLowerCase();

        // For "I" or empty, return initial therapeutic starters
        if (!trimmedText || trimmedText === 'I' || lowercaseText === 'i') {
            return ['feel', 'am', 'have', 'need', 'want', 'think'];
        }

        // Analyze intent and predict next logical words
        try {
            const nextWords = await predictNextWords(trimmedText);
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

        const trimmedText = text.trim();
        if (trimmedText.length < 1) {
            setSuggestions([]);
            return;
        }

        setIsGenerating(true);
        setSuggestions(['Thinking...']); // Temporary state while generating

        try {
            // Use intent-based contextual word selection
            const contextualWords = await getContextualWords(text);
            console.log('Intent-based suggestions:', contextualWords);
            setSuggestions(contextualWords);
        } catch (error) {
            console.error('Error generating predictions:', error);
            // Fallback to basic therapeutic words
            const fallbackWords = [
                ...THERAPEUTIC_WORD_SETS.emotions.slice(0, 3),
                ...THERAPEUTIC_WORD_SETS.connectors.slice(0, 3)
            ];
            setSuggestions(fallbackWords);
        } finally {
            setIsGenerating(false);
        }

    }, [getContextualWords, THERAPEUTIC_WORD_SETS]); // Dependencies

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
        const previousValue = previousInputRef.current;

        setInputText(value);

        // Update the previous value ref
        previousInputRef.current = value;

        // Clear the previous debounce timer and waiting state
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            setIsWaitingForSuggestions(false);
        }

        // Only trigger prediction if:
        // 1. A space was just added (word completed)
        // 2. Or if text ends with space and we're typing after it
        // 3. Or if we're at the start of input (empty or sentence ending)
        const justAddedSpace = value.length > previousValue.length && value.endsWith(' ') && !previousValue.endsWith(' ');
        const isStartingNew = value.trim() === '' || value.match(/[.!?]\s*$/);
        const shouldPredict = justAddedSpace || isStartingNew;

        if (shouldPredict) {
            // Use different delays: immediate for first run, longer delay for subsequent runs
            const delay = isFirstRun ? PREDICTION_DEBOUNCE_DELAY : SUBSEQUENT_PREDICTION_DELAY;

            // Show waiting state for longer delays
            if (!isFirstRun) {
                setIsWaitingForSuggestions(true);
            }

            // Set a timer to call predictNext after appropriate delay
            debounceTimerRef.current = setTimeout(() => {
                setIsWaitingForSuggestions(false);
                predictNext(value);
                // Mark that we've had our first interaction
                if (isFirstRun) {
                    setIsFirstRun(false);
                }
            }, delay);
        } else {
            // Clear suggestions if we're in the middle of typing a word
            setSuggestions([]);
            setIsWaitingForSuggestions(false);
        }
    };

    // --- 4. Suggestion Click Handler ---
    const applySuggestion = useCallback((suggestion: string) => {
        if (suggestion === 'Thinking...' || isGenerating) return;

        // Append the suggestion and a space to the input text
        const newText = inputText + (inputText.endsWith(' ') ? '' : ' ') + suggestion + ' ';
        setInputText(newText);

        // Clear existing suggestions first
        setSuggestions([]);

        // Use setTimeout to ensure the state update happens first, then generate new predictions
        setTimeout(() => {
            predictNext(newText);
            // When user clicks a suggestion, they're actively engaging, so reset to immediate mode
            setIsFirstRun(true);
        }, 50); // Small delay to ensure clean state
    }, [inputText, isGenerating, predictNext]);

    // --- 5. Keyboard Navigation Handler ---
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab' && suggestions.length > 0 && suggestions[0] !== 'Thinking...') {
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
                {isGenerating && suggestions.length === 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 text-gray-500 dark:text-gray-400 text-sm" aria-live="polite">
                        <div className="w-4 h-4 border-2 border-gray-200 dark:border-gray-600 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin"></div>
                        <span>Generating suggestions...</span>
                    </div>
                )}
                {isWaitingForSuggestions && !isGenerating && suggestions.length === 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 text-gray-400 dark:text-gray-500 text-sm opacity-80" aria-live="polite">
                        <div className="w-4 h-4 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse opacity-60 mr-1.5"></div>
                        <span>Take your time...</span>
                    </div>
                )}
                {suggestions.map((suggestion, index) => (
                    <button
                        key={`${suggestion}-${index}`}
                        onClick={() => applySuggestion(suggestion)}
                        disabled={suggestion === 'Thinking...' || isGenerating}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 whitespace-nowrap max-w-[150px] overflow-hidden text-ellipsis ${suggestion === 'Thinking...' || isGenerating
                            ? 'bg-gray-300 dark:bg-gray-500 text-gray-600 dark:text-gray-300 cursor-not-allowed opacity-70'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-50 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 hover:-translate-y-0.5 active:translate-y-0'
                            } ${!generatorRef.current ? 'opacity-60 cursor-not-allowed' : ''}`}
                        aria-label={`Add word: ${suggestion}`}
                    >
                        {suggestion === 'Thinking...' ? (
                            <>
                                <div className="w-3 h-3 border border-gray-400/20 dark:border-white/10 border-t-current rounded-full animate-spin"></div>
                                Thinking...
                            </>
                        ) : (
                            suggestion
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}