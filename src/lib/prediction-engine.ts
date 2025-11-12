import { THERAPEUTIC_WORD_SETS, THERAPEUTIC_GROWTH_WORDS } from './therapeutic-words';

// Core pattern-based prediction logic
export const getPatternBasedNextWords = (text: string): string[] => {
    const trimmedText = text.trim();
    if (!trimmedText) return ['and', 'but', 'because'];

    // Split on spaces and get the last word for cleaner pattern matching
    const words = trimmedText.split(' ');
    const lastWord = words[words.length - 1]?.toLowerCase() || '';

    // Handle "I" as the last word (either standalone or after other words)
    if (lastWord === 'i') {
        return ['feel', 'am', 'need', 'want', 'have', 'can', 'believe', 'hope', 'think', 'know'];
    }

    // Handle specific verb patterns
    if (lastWord === 'feel' || lastWord === 'felt') {
        return ['like', 'that', 'really', 'so', 'very', 'deeply', 'truly', 'completely', 'overwhelmed', 'peaceful', 'grateful', 'anxious', 'calm', 'strong'];
    }
    if (lastWord === 'need' || lastWord === 'want') {
        return ['to', 'help', 'support', 'understanding', 'healing', 'peace', 'growth', 'love', 'acceptance', 'validation'];
    }
    if (lastWord === 'am' || lastWord === 'was') {
        return ['feeling', 'being', 'learning', 'growing', 'healing', 'grateful', 'peaceful', 'anxious', 'overwhelmed', 'strong', 'tired', 'hopeful'];
    }
    if (lastWord === 'very' || lastWord === 'really' || lastWord === 'extremely') {
        return ['grateful', 'peaceful', 'hopeful', 'confident', 'aware', 'present', 'calm', 'strong', 'tired', 'overwhelmed', 'anxious', 'stressed', 'proud', 'happy'];
    }
    if (lastWord === 'have' || lastWord === 'had') {
        return ['been', 'felt', 'experienced', 'learned', 'grown', 'struggled', 'overcome', 'difficulty', 'support', 'love', 'peace'];
    }
    if (lastWord === 'can') {
        return ['feel', 'be', 'do', 'learn', 'grow', 'heal', 'change', 'overcome', 'understand', 'accept', 'forgive'];
    }
    if (lastWord === 'believe' || lastWord === 'think' || lastWord === 'know') {
        return ['that', 'I', 'this', 'it', 'deeply', 'truly', 'strongly'];
    }
    if (lastWord === 'hope') {
        return ['that', 'to', 'for', 'I', 'this', 'things', 'life'];
    }

    // Default essential connectors
    return ['and', 'but', 'because'];
};

// Contextual word selection based on semantic meaning
export const getContextualWords = (text: string): string[] => {
    const lowercaseText = text.toLowerCase();
    const contextualWords: string[] = [];

    // Detect emotional context
    if (lowercaseText.includes('feel') || lowercaseText.includes('emotion') || lowercaseText.includes('mood')) {
        const shuffledEmotions = [...THERAPEUTIC_WORD_SETS.emotions].sort(() => 0.5 - Math.random());
        contextualWords.push(...shuffledEmotions.slice(0, 18));
    }

    // Detect struggle context
    if (lowercaseText.includes('struggle') || lowercaseText.includes('difficult') || lowercaseText.includes('hard')) {
        const shuffledStruggles = [...THERAPEUTIC_WORD_SETS.struggles].sort(() => 0.5 - Math.random());
        contextualWords.push(...shuffledStruggles.slice(0, 18));
    }

    // Detect need context
    if (lowercaseText.includes('need') || lowercaseText.includes('want') || lowercaseText.includes('hope')) {
        const shuffledNeeds = [...THERAPEUTIC_WORD_SETS.needs].sort(() => 0.5 - Math.random());
        contextualWords.push(...shuffledNeeds.slice(0, 18));
    }

    // Detect support context
    if (lowercaseText.includes('help') || lowercaseText.includes('support')) {
        const shuffledSupport = [...THERAPEUTIC_WORD_SETS.support].sort(() => 0.5 - Math.random());
        contextualWords.push(...shuffledSupport.slice(0, 18));
    }

    // Detect relationship context
    if (lowercaseText.includes('family') || lowercaseText.includes('friend') || lowercaseText.includes('relationship')) {
        const shuffledRelationships = [...THERAPEUTIC_WORD_SETS.relationships].sort(() => 0.5 - Math.random());
        contextualWords.push(...shuffledRelationships.slice(0, 18));
    }

    // Detect action context
    if (lowercaseText.includes('try') || lowercaseText.includes('work') || lowercaseText.includes('change')) {
        const shuffledActions = [...THERAPEUTIC_WORD_SETS.actions].sort(() => 0.5 - Math.random());
        contextualWords.push(...shuffledActions.slice(0, 18));
    }

    // If we have context matches, add some varied connectors for flow
    if (contextualWords.length > 0) {
        const shuffledConnectors = [...THERAPEUTIC_WORD_SETS.connectors].sort(() => 0.5 - Math.random());
        contextualWords.push(...shuffledConnectors.slice(0, 12));
    }

    // If no specific context detected, provide a balanced mix
    if (contextualWords.length === 0) {
        const shuffledEmotions = [...THERAPEUTIC_WORD_SETS.emotions].sort(() => 0.5 - Math.random());
        const shuffledActions = [...THERAPEUTIC_WORD_SETS.actions].sort(() => 0.5 - Math.random());
        const shuffledSupport = [...THERAPEUTIC_WORD_SETS.support].sort(() => 0.5 - Math.random());
        const shuffledConnectors = [...THERAPEUTIC_WORD_SETS.connectors].sort(() => 0.5 - Math.random());

        contextualWords.push(
            ...shuffledEmotions.slice(0, 12),
            ...shuffledActions.slice(0, 12),
            ...shuffledSupport.slice(0, 12),
            ...shuffledConnectors.slice(0, 8)
        );
    }

    return [...new Set(contextualWords)]; // Remove duplicates
};

// Generate random therapeutic growth words
export const getRandomWords = (): string[] => {
    const shuffled = [...THERAPEUTIC_GROWTH_WORDS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.floor(Math.random() * 11) + 15); // 15-25 words
};

// Extract recently used words for filtering
export const getUsedWords = (text: string): Set<string> => {
    const allWords = text
        .toLowerCase()
        .split(/\s+/)
        .map(word => word.replace(/[^a-z]/g, ''))
        .filter(word => word.length > 0);

    // Only filter out the last 5 words to allow reuse of earlier words
    const recentWords = allWords.slice(-5);
    return new Set(recentWords);
};

// Part-of-Speech prediction patterns
export const POS_PATTERNS: Record<string, string[]> = {
    'NOUN': ['beautiful', 'challenging', 'important', 'meaningful', 'is', 'was', 'feels', 'seems', 'helps', 'in', 'on', 'with'],
    'ADJ': ['person', 'situation', 'experience', 'feeling', 'moment', 'very', 'really', 'quite', 'deeply'],
    'VERB': ['deeply', 'gently', 'carefully', 'mindfully', 'myself', 'others', 'growth', 'with', 'through', 'about'],
    'ADV': ['grateful', 'peaceful', 'hopeful', 'confident', 'calm', 'strong', 'feel', 'become', 'grow'],
    'PRON': ['am', 'feel', 'need', 'want', 'have', 'can', 'deserve', 'understand', 'believe', 'hope'],
    'ADP': ['the', 'my', 'this', 'difficult', 'challenging', 'peaceful', 'healing', 'support', 'time', 'people'],
    'DET': ['difficult', 'beautiful', 'meaningful', 'important', 'moment', 'experience', 'feeling', 'person'],
    'CCONJ': ['I', 'life', 'growth', 'healing', 'love', 'peace', 'understanding', 'acceptance']
};

// Intensifier patterns for better predictions
export const INTENSIFIER_WORDS = ['very', 'really', 'extremely', 'deeply', 'truly'] as const;

export const getIntensifierSuggestions = (): string[] => [
    'grateful', 'peaceful', 'hopeful', 'confident', 'aware', 'calm', 'strong',
    'tired', 'overwhelmed', 'anxious', 'stressed', 'proud', 'happy'
];