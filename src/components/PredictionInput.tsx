'use client'
import React, { useState, useCallback, useRef, useMemo } from 'react';

export default function PredictionInput() {
    // State for the user's input text - start with "I " by default
    const [inputText, setInputText] = useState<string>('I ');
    // State for the generated suggestions - now with separation between new and previous
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [previousSuggestions, setPreviousSuggestions] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);

    // Track typing activity for "Take your time..." message
    const [showTakeYourTime, setShowTakeYourTime] = useState<boolean>(false);
    const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Track initial load for immediate suggestions
    const [hasInitialized, setHasInitialized] = useState<boolean>(false);

    // --- Therapeutic Word Sets ---
    // Expanded therapeutic word sets with intent-based categories for maximum variety
    const THERAPEUTIC_WORD_SETS = useMemo(() => ({
        // Emotional states and feelings - expanded
        emotions: ['feel', 'felt', 'feeling', 'emotional', 'overwhelmed', 'anxious', 'stressed', 'worried', 'sad', 'angry', 'frustrated', 'hopeful', 'grateful', 'calm', 'peaceful', 'excited', 'nervous', 'relieved', 'disappointed', 'proud', 'joyful', 'content', 'satisfied', 'fulfilled', 'empty', 'numb', 'hurt', 'pain', 'aching', 'tender', 'vulnerable', 'raw', 'sensitive', 'fragile', 'strong', 'powerful', 'confident', 'insecure', 'jealous', 'envious', 'guilty', 'ashamed', 'embarrassed', 'humiliated', 'rejected', 'abandoned', 'lonely', 'isolated', 'connected', 'loved', 'cherished', 'valued', 'appreciated', 'supported', 'understood', 'heard', 'seen', 'validated', 'accepted', 'welcomed', 'embraced'],

        // Challenges and difficulties - expanded  
        struggles: ['struggle', 'struggling', 'difficult', 'challenging', 'hard', 'tough', 'overwhelming', 'stuck', 'lost', 'confused', 'uncertain', 'afraid', 'scared', 'troubled', 'bothered', 'stressed', 'pressured', 'burdened', 'weighed', 'heavy', 'exhausted', 'drained', 'depleted', 'burnt', 'tired', 'fatigued', 'worn', 'beaten', 'defeated', 'hopeless', 'helpless', 'powerless', 'weak', 'fragile', 'broken', 'shattered', 'damaged', 'wounded', 'injured', 'traumatized', 'triggered', 'activated', 'dysregulated', 'imbalanced', 'unstable', 'chaotic', 'messy', 'complicated', 'complex', 'tangled', 'knotted', 'twisted', 'distorted', 'warped', 'skewed', 'biased', 'prejudiced', 'judgmental', 'critical', 'harsh', 'severe'],

        // Needs and desires - expanded
        needs: ['need', 'want', 'require', 'seek', 'hope', 'wish', 'desire', 'long', 'crave', 'yearn', 'miss', 'lack', 'require', 'deserve', 'demand', 'request', 'ask', 'plead', 'beg', 'pray', 'dream', 'fantasize', 'imagine', 'envision', 'picture', 'see', 'visualize', 'anticipate', 'expect', 'await', 'look', 'search', 'hunt', 'pursue', 'chase', 'follow', 'track', 'trace', 'find', 'discover', 'uncover', 'reveal', 'expose', 'show', 'demonstrate', 'prove', 'establish', 'create', 'build', 'construct', 'develop', 'generate', 'produce', 'make', 'craft', 'design', 'plan', 'organize', 'arrange', 'structure'],

        // Support and resources - expanded
        support: ['help', 'support', 'guidance', 'comfort', 'understanding', 'compassion', 'empathy', 'care', 'love', 'acceptance', 'validation', 'encouragement', 'assistance', 'aid', 'relief', 'rescue', 'salvation', 'healing', 'recovery', 'restoration', 'renewal', 'revival', 'resurrection', 'transformation', 'change', 'growth', 'development', 'progress', 'advancement', 'improvement', 'enhancement', 'enrichment', 'nourishment', 'nurturing', 'cultivation', 'fostering', 'promoting', 'encouraging', 'inspiring', 'motivating', 'empowering', 'strengthening', 'fortifying', 'reinforcing', 'backing', 'endorsing', 'advocating', 'championing', 'defending', 'protecting', 'safeguarding', 'securing', 'ensuring', 'guaranteeing', 'promising', 'assuring', 'confirming', 'affirming', 'validating'],

        // Actions and behaviors - expanded
        actions: ['try', 'attempt', 'work', 'practice', 'learn', 'grow', 'change', 'improve', 'develop', 'progress', 'move', 'step', 'start', 'continue', 'stop', 'begin', 'initiate', 'commence', 'launch', 'embark', 'undertake', 'pursue', 'engage', 'participate', 'involve', 'contribute', 'collaborate', 'cooperate', 'coordinate', 'organize', 'plan', 'prepare', 'arrange', 'schedule', 'prioritize', 'focus', 'concentrate', 'dedicate', 'commit', 'devote', 'invest', 'spend', 'allocate', 'distribute', 'share', 'give', 'offer', 'provide', 'supply', 'deliver', 'present', 'show', 'demonstrate', 'exhibit', 'display', 'express', 'communicate', 'convey', 'transmit', 'send', 'receive', 'accept', 'embrace', 'welcome', 'invite', 'include', 'incorporate', 'integrate', 'combine', 'merge', 'blend', 'mix', 'unite', 'join', 'connect'],

        // Thoughts and cognition - expanded
        thoughts: ['think', 'believe', 'wonder', 'question', 'doubt', 'know', 'understand', 'realize', 'recognize', 'remember', 'forget', 'imagine', 'consider', 'contemplate', 'ponder', 'reflect', 'meditate', 'analyze', 'examine', 'study', 'investigate', 'explore', 'discover', 'uncover', 'reveal', 'expose', 'identify', 'detect', 'notice', 'observe', 'perceive', 'sense', 'feel', 'experience', 'encounter', 'meet', 'face', 'confront', 'challenge', 'question', 'query', 'inquire', 'ask', 'wonder', 'speculate', 'hypothesize', 'theorize', 'assume', 'presume', 'suppose', 'guess', 'estimate', 'calculate', 'measure', 'evaluate', 'assess', 'judge', 'critique', 'review', 'examine', 'inspect', 'check', 'verify', 'confirm', 'validate', 'prove', 'demonstrate', 'show', 'illustrate', 'explain', 'clarify', 'illuminate', 'enlighten'],

        // Relationships and social - expanded
        relationships: ['family', 'friends', 'partner', 'therapist', 'people', 'others', 'community', 'connections', 'relationships', 'loved', 'alone', 'parents', 'children', 'siblings', 'relatives', 'colleagues', 'coworkers', 'teammates', 'classmates', 'neighbors', 'acquaintances', 'strangers', 'enemies', 'rivals', 'competitors', 'allies', 'supporters', 'advocates', 'mentors', 'guides', 'teachers', 'students', 'learners', 'followers', 'leaders', 'bosses', 'employees', 'customers', 'clients', 'patients', 'doctors', 'nurses', 'counselors', 'coaches', 'advisors', 'consultants', 'experts', 'professionals', 'specialists', 'authorities', 'figures', 'role-models', 'heroes', 'inspirations', 'influences', 'impacts', 'effects', 'consequences', 'results', 'outcomes', 'achievements', 'successes', 'failures', 'mistakes', 'errors', 'lessons', 'experiences', 'memories', 'moments', 'times', 'periods', 'phases', 'stages', 'chapters'],

        // Time and frequency - expanded
        time: ['today', 'yesterday', 'tomorrow', 'recently', 'lately', 'often', 'sometimes', 'always', 'never', 'usually', 'currently', 'now', 'then', 'soon', 'later', 'before', 'after', 'during', 'while', 'when', 'whenever', 'until', 'since', 'from', 'through', 'throughout', 'within', 'beyond', 'past', 'present', 'future', 'permanent', 'temporary', 'brief', 'short', 'long', 'extended', 'prolonged', 'continuous', 'constant', 'regular', 'irregular', 'frequent', 'infrequent', 'rare', 'occasional', 'periodic', 'cyclical', 'seasonal', 'annual', 'monthly', 'weekly', 'daily', 'hourly', 'momentary', 'instant', 'immediate', 'delayed', 'postponed', 'scheduled', 'planned', 'unexpected', 'sudden', 'gradual', 'slow', 'fast', 'quick', 'rapid', 'swift', 'hasty', 'rushed', 'calm', 'patient', 'steady', 'consistent', 'persistent'],

        // Connective and transitional words - expanded
        connectors: ['and', 'but', 'or', 'so', 'because', 'although', 'however', 'therefore', 'meanwhile', 'also', 'too', 'even', 'still', 'yet', 'then', 'thus', 'hence', 'consequently', 'accordingly', 'furthermore', 'moreover', 'additionally', 'besides', 'likewise', 'similarly', 'conversely', 'alternatively', 'otherwise', 'instead', 'rather', 'nonetheless', 'nevertheless', 'regardless', 'despite', 'though', 'whereas', 'while', 'since', 'unless', 'until', 'before', 'after', 'when', 'whenever', 'where', 'wherever', 'why', 'how', 'what', 'which', 'who', 'whom', 'whose', 'that', 'this', 'these', 'those', 'such', 'same', 'different', 'other', 'another', 'each', 'every', 'all', 'some', 'any', 'no', 'none', 'both', 'either', 'neither', 'first', 'second', 'third', 'last', 'final', 'initial', 'previous', 'next', 'following', 'subsequent', 'prior', 'former', 'latter'],

        // Adverbs for emotional expression and intensity
        adverbs: ['deeply', 'truly', 'really', 'very', 'extremely', 'incredibly', 'amazingly', 'surprisingly', 'suddenly', 'gradually', 'slowly', 'quickly', 'gently', 'softly', 'harshly', 'strongly', 'powerfully', 'weakly', 'barely', 'completely', 'partially', 'fully', 'entirely', 'totally', 'absolutely', 'definitely', 'probably', 'possibly', 'maybe', 'perhaps', 'clearly', 'obviously', 'apparently', 'seemingly', 'genuinely', 'honestly', 'sincerely', 'carefully', 'thoughtfully', 'mindfully', 'consciously', 'unconsciously', 'naturally', 'easily', 'hardly', 'frequently', 'rarely', 'constantly', 'continuously', 'intermittently', 'temporarily', 'permanently', 'immediately', 'eventually', 'finally', 'initially', 'recently', 'currently', 'presently'],

        // Descriptive adjectives for feelings and experiences  
        adjectives: ['overwhelming', 'challenging', 'difficult', 'easy', 'simple', 'complex', 'complicated', 'confusing', 'clear', 'unclear', 'bright', 'dark', 'heavy', 'light', 'intense', 'mild', 'severe', 'gentle', 'harsh', 'soft', 'hard', 'smooth', 'rough', 'calm', 'chaotic', 'peaceful', 'turbulent', 'stable', 'unstable', 'consistent', 'inconsistent', 'reliable', 'unreliable', 'predictable', 'unpredictable', 'familiar', 'unfamiliar', 'comfortable', 'uncomfortable', 'safe', 'unsafe', 'secure', 'insecure', 'confident', 'uncertain', 'positive', 'negative', 'optimistic', 'pessimistic', 'hopeful', 'hopeless', 'meaningful', 'meaningless', 'valuable', 'worthless', 'important', 'unimportant', 'significant', 'insignificant', 'relevant', 'irrelevant', 'useful', 'useless', 'helpful', 'harmful', 'beneficial', 'detrimental', 'healthy', 'unhealthy', 'toxic', 'nourishing'],

        // Specific life areas and skills people work on
        lifeAreas: ['music', 'art', 'creativity', 'writing', 'drawing', 'painting', 'singing', 'dancing', 'cooking', 'fitness', 'exercise', 'running', 'yoga', 'meditation', 'mindfulness', 'reading', 'learning', 'studying', 'education', 'career', 'work', 'job', 'business', 'leadership', 'management', 'communication', 'public-speaking', 'social-skills', 'relationships', 'dating', 'marriage', 'parenting', 'friendship', 'networking', 'finances', 'budgeting', 'saving', 'investing', 'organization', 'productivity', 'time-management', 'planning', 'goal-setting', 'habit-building', 'self-discipline', 'motivation', 'confidence', 'self-esteem', 'anxiety', 'depression', 'stress-management', 'anger-management', 'grief', 'trauma', 'healing', 'therapy', 'counseling', 'mental-health', 'physical-health', 'nutrition', 'sleep', 'recovery', 'addiction', 'sobriety', 'boundaries', 'assertiveness', 'conflict-resolution', 'forgiveness', 'letting-go', 'acceptance', 'change', 'transition', 'growth', 'development', 'spirituality', 'faith', 'purpose', 'meaning', 'identity', 'authenticity', 'vulnerability', 'intimacy', 'trust', 'communication', 'listening', 'empathy', 'compassion', 'kindness', 'patience', 'understanding', 'support', 'encouragement']
    }), []);



    // Simplified pattern-based next word prediction - focus on most essential patterns only
    const getPatternBasedNextWords = useCallback((text: string): string[] => {
        // Only keep the most fundamental sentence starters and essential connectors
        if (text.endsWith(' I')) {
            return ['feel', 'am', 'need', 'want'];
        }
        if (text.endsWith(' feel') || text.endsWith(' felt')) {
            return ['like', 'that', 'really'];
        }
        if (text.endsWith(' need') || text.endsWith(' want')) {
            return ['to', 'help', 'support'];
        }

        // Default essential connectors only
        return ['and', 'but', 'because'];
    }, []);

    // Expanded therapeutic growth words for psychological/emotional development
    const getRandomWords = useCallback((): string[] => {
        const therapeuticGrowthWords = [
            // Emotional intelligence & regulation - expanded
            'mindfulness', 'awareness', 'boundaries', 'patience', 'compassion', 'forgiveness', 'acceptance', 'resilience', 'regulation', 'self-control', 'discipline', 'moderation', 'temperance', 'restraint', 'containment', 'management', 'mastery', 'expertise', 'skill', 'ability', 'capacity', 'capability', 'competence', 'proficiency', 'talent', 'gift', 'strength', 'power', 'force', 'energy', 'vitality', 'vigor', 'intensity', 'passion', 'enthusiasm', 'excitement', 'motivation', 'inspiration', 'aspiration', 'ambition', 'drive', 'determination', 'persistence', 'perseverance', 'tenacity', 'grit', 'resolve', 'commitment', 'dedication', 'devotion',

            // Communication & relationships - expanded
            'listening', 'vulnerability', 'intimacy', 'trust', 'empathy', 'connection', 'honesty', 'respect', 'openness', 'transparency', 'authenticity', 'sincerity', 'genuineness', 'truthfulness', 'reliability', 'dependability', 'consistency', 'stability', 'security', 'safety', 'protection', 'shelter', 'refuge', 'sanctuary', 'haven', 'comfort', 'solace', 'peace', 'tranquility', 'serenity', 'calmness', 'stillness', 'quietude', 'silence', 'space', 'freedom', 'liberation', 'independence', 'autonomy', 'self-determination', 'choice', 'option', 'alternative', 'possibility', 'opportunity', 'potential', 'promise', 'hope', 'faith', 'belief', 'confidence',

            // Personal development - expanded
            'confidence', 'courage', 'authenticity', 'self-worth', 'purpose', 'meaning', 'clarity', 'wisdom', 'insight', 'understanding', 'comprehension', 'knowledge', 'education', 'learning', 'growth', 'development', 'evolution', 'transformation', 'metamorphosis', 'change', 'transition', 'shift', 'movement', 'progress', 'advancement', 'improvement', 'enhancement', 'enrichment', 'expansion', 'extension', 'amplification', 'magnification', 'intensification', 'deepening', 'broadening', 'widening', 'stretching', 'reaching', 'striving', 'achieving', 'accomplishing', 'succeeding', 'winning', 'triumph', 'victory', 'conquest', 'mastery', 'excellence', 'perfection',

            // Coping & healing - expanded
            'therapy', 'meditation', 'journaling', 'breathing', 'grounding', 'processing', 'release', 'recovery', 'healing', 'restoration', 'renewal', 'regeneration', 'rejuvenation', 'revitalization', 'rehabilitation', 'reconstruction', 'rebuilding', 'repair', 'mending', 'fixing', 'solving', 'resolving', 'addressing', 'tackling', 'handling', 'managing', 'coping', 'dealing', 'facing', 'confronting', 'meeting', 'encountering', 'experiencing', 'living', 'existing', 'being', 'becoming', 'emerging', 'arising', 'appearing', 'manifesting', 'expressing', 'showing', 'revealing', 'displaying', 'demonstrating', 'proving', 'establishing', 'creating', 'generating', 'producing',

            // Growth mindset - expanded
            'learning', 'curiosity', 'flexibility', 'adaptation', 'perseverance', 'progress', 'improvement', 'development', 'exploration', 'discovery', 'investigation', 'research', 'study', 'analysis', 'examination', 'observation', 'experimentation', 'testing', 'trying', 'attempting', 'practicing', 'rehearsing', 'training', 'exercising', 'conditioning', 'preparing', 'planning', 'organizing', 'structuring', 'arranging', 'coordinating', 'managing', 'directing', 'leading', 'guiding', 'mentoring', 'coaching', 'teaching', 'instructing', 'educating', 'informing', 'enlightening', 'illuminating', 'clarifying', 'explaining', 'interpreting', 'translating', 'communicating', 'conveying', 'transmitting',

            // Wellness & balance - expanded
            'balance', 'harmony', 'peace', 'calm', 'energy', 'vitality', 'rest', 'renewal', 'equilibrium', 'stability', 'steadiness', 'consistency', 'regularity', 'rhythm', 'flow', 'movement', 'circulation', 'distribution', 'allocation', 'division', 'separation', 'distinction', 'differentiation', 'discrimination', 'selection', 'choice', 'decision', 'judgment', 'evaluation', 'assessment', 'appraisal', 'estimation', 'calculation', 'measurement', 'quantification', 'qualification', 'certification', 'validation', 'verification', 'confirmation', 'affirmation', 'endorsement', 'approval', 'acceptance', 'acknowledgment', 'recognition', 'appreciation', 'gratitude', 'thankfulness', 'blessing',

            // Skills & capabilities - expanded
            'communication', 'leadership', 'creativity', 'problem-solving', 'decision-making', 'time-management', 'organization', 'focus', 'concentration', 'attention', 'mindfulness', 'presence', 'awareness', 'consciousness', 'vigilance', 'alertness', 'responsiveness', 'sensitivity', 'perception', 'intuition', 'instinct', 'gut-feeling', 'sense', 'feeling', 'emotion', 'sentiment', 'mood', 'state', 'condition', 'situation', 'circumstance', 'context', 'environment', 'setting', 'atmosphere', 'climate', 'culture', 'society', 'community', 'group', 'team', 'collective', 'unity', 'solidarity', 'cooperation', 'collaboration', 'partnership', 'alliance', 'union', 'connection', 'relationship', 'bond'
        ];

        // Shuffle and return 15-25 therapeutic words for maximum variety
        const shuffled = therapeuticGrowthWords.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.floor(Math.random() * 11) + 15); // 15-25 words
    }, []);

    // Enhanced contextual words based on semantic meaning rather than rigid patterns
    const getContextualWords = useCallback((text: string): string[] => {
        const lowercaseText = text.toLowerCase();

        // Emotional context - enhanced
        if (/feel|emotion|mood|happy|sad|angry|frustrated|anxious|depressed|joyful|peaceful|stressed|worried/.test(lowercaseText)) {
            return [
                ...THERAPEUTIC_WORD_SETS.emotions,
                ...THERAPEUTIC_WORD_SETS.support,
                ...THERAPEUTIC_WORD_SETS.actions,
                ...THERAPEUTIC_WORD_SETS.thoughts,
                ...THERAPEUTIC_WORD_SETS.adverbs,
                ...THERAPEUTIC_WORD_SETS.adjectives,
                ...THERAPEUTIC_WORD_SETS.lifeAreas
            ];
        }

        // Struggle/challenge context - enhanced
        if (/struggle|difficult|problem|issue|challenge|hard|tough|overwhelming|stuck|lost|confused|broken|hurt/.test(lowercaseText)) {
            return [
                ...THERAPEUTIC_WORD_SETS.struggles,
                ...THERAPEUTIC_WORD_SETS.actions,
                ...THERAPEUTIC_WORD_SETS.support,
                ...THERAPEUTIC_WORD_SETS.emotions,
                ...THERAPEUTIC_WORD_SETS.lifeAreas,
                ...THERAPEUTIC_WORD_SETS.adjectives,
                ...THERAPEUTIC_WORD_SETS.adverbs
            ];
        }

        // Needs/wants context - enhanced
        if (/need|want|hope|wish|require|seek|desire|long|crave|yearn|miss|deserve/.test(lowercaseText)) {
            return [
                ...THERAPEUTIC_WORD_SETS.needs,
                ...THERAPEUTIC_WORD_SETS.support,
                ...THERAPEUTIC_WORD_SETS.actions,
                ...THERAPEUTIC_WORD_SETS.emotions,
                ...THERAPEUTIC_WORD_SETS.lifeAreas,
                ...THERAPEUTIC_WORD_SETS.adverbs
            ];
        }

        // Support context - enhanced
        if (/help|support|care|love|understand|guidance|comfort|empathy|compassion|validation/.test(lowercaseText)) {
            return [
                ...THERAPEUTIC_WORD_SETS.support,
                ...THERAPEUTIC_WORD_SETS.relationships,
                ...THERAPEUTIC_WORD_SETS.actions,
                ...THERAPEUTIC_WORD_SETS.emotions,
                ...THERAPEUTIC_WORD_SETS.lifeAreas,
                ...THERAPEUTIC_WORD_SETS.adverbs
            ];
        }

        // Growth/action context - enhanced
        if (/try|work|practice|learn|grow|change|improve|better|develop|progress|heal|recover|transform/.test(lowercaseText)) {
            return [
                ...THERAPEUTIC_WORD_SETS.actions,
                ...THERAPEUTIC_WORD_SETS.thoughts,
                ...THERAPEUTIC_WORD_SETS.emotions,
                ...THERAPEUTIC_WORD_SETS.support,
                ...THERAPEUTIC_WORD_SETS.lifeAreas,
                ...THERAPEUTIC_WORD_SETS.adverbs,
                ...THERAPEUTIC_WORD_SETS.adjectives
            ];
        }

        // Thinking/cognitive context - enhanced  
        if (/think|believe|know|understand|wonder|question|realize|recognize|remember|consider|reflect/.test(lowercaseText)) {
            return [
                ...THERAPEUTIC_WORD_SETS.thoughts,
                ...THERAPEUTIC_WORD_SETS.actions,
                ...THERAPEUTIC_WORD_SETS.emotions,
                ...THERAPEUTIC_WORD_SETS.support,
                ...THERAPEUTIC_WORD_SETS.adverbs,
                ...THERAPEUTIC_WORD_SETS.lifeAreas
            ];
        }

        // Relationship context - enhanced
        if (/family|friend|relationship|people|partner|therapist|parent|child|sibling|colleague|community/.test(lowercaseText)) {
            return [
                ...THERAPEUTIC_WORD_SETS.relationships,
                ...THERAPEUTIC_WORD_SETS.support,
                ...THERAPEUTIC_WORD_SETS.emotions,
                ...THERAPEUTIC_WORD_SETS.thoughts,
                ...THERAPEUTIC_WORD_SETS.adjectives,
                ...THERAPEUTIC_WORD_SETS.actions
            ];
        }

        // Creative/skill context - enhanced
        if (/music|art|creative|skill|talent|ability|learn|practice|draw|paint|sing|write|dance|cook|exercise/.test(lowercaseText)) {
            return [
                ...THERAPEUTIC_WORD_SETS.lifeAreas,
                ...THERAPEUTIC_WORD_SETS.actions,
                ...THERAPEUTIC_WORD_SETS.emotions,
                ...THERAPEUTIC_WORD_SETS.adjectives,
                ...THERAPEUTIC_WORD_SETS.adverbs,
                ...THERAPEUTIC_WORD_SETS.support
            ];
        }

        // Health/wellness context - enhanced
        if (/health|mental|physical|wellness|therapy|healing|recovery|meditation|mindfulness|fitness|sleep|nutrition/.test(lowercaseText)) {
            return [
                ...THERAPEUTIC_WORD_SETS.lifeAreas,
                ...THERAPEUTIC_WORD_SETS.actions,
                ...THERAPEUTIC_WORD_SETS.support,
                ...THERAPEUTIC_WORD_SETS.emotions,
                ...THERAPEUTIC_WORD_SETS.adjectives,
                ...THERAPEUTIC_WORD_SETS.adverbs
            ];
        }

        // Time/frequency context - enhanced
        if (/time|today|yesterday|tomorrow|always|never|sometimes|often|recently|currently/.test(lowercaseText)) {
            return [
                ...THERAPEUTIC_WORD_SETS.time,
                ...THERAPEUTIC_WORD_SETS.emotions,
                ...THERAPEUTIC_WORD_SETS.actions,
                ...THERAPEUTIC_WORD_SETS.adverbs,
                ...THERAPEUTIC_WORD_SETS.thoughts
            ];
        }

        // Default: ALL therapeutic words from ALL categories for maximum variety
        return [
            ...THERAPEUTIC_WORD_SETS.emotions,
            ...THERAPEUTIC_WORD_SETS.needs,
            ...THERAPEUTIC_WORD_SETS.actions,
            ...THERAPEUTIC_WORD_SETS.support,
            ...THERAPEUTIC_WORD_SETS.thoughts,
            ...THERAPEUTIC_WORD_SETS.relationships,
            ...THERAPEUTIC_WORD_SETS.struggles,
            ...THERAPEUTIC_WORD_SETS.time,
            ...THERAPEUTIC_WORD_SETS.connectors,
            ...THERAPEUTIC_WORD_SETS.adverbs,
            ...THERAPEUTIC_WORD_SETS.adjectives,
            ...THERAPEUTIC_WORD_SETS.lifeAreas
        ];
    }, [THERAPEUTIC_WORD_SETS]);

    // Extract recently used words to filter out only recent duplicates, not entire text history
    const getUsedWords = useCallback((text: string): Set<string> => {
        // Split text into words and only consider the last 5 words to avoid over-filtering
        const allWords = text
            .toLowerCase()
            .split(/\s+/)
            .map(word => word.replace(/[^a-z]/g, '')) // Remove punctuation
            .filter(word => word.length > 0);

        // Only filter out the last 5 words to allow reuse of earlier words
        const recentWords = allWords.slice(-5);

        return new Set(recentWords);
    }, []);

    // Main prediction logic
    const generateSuggestions = useCallback((text: string) => {
        const trimmedText = text.trim();
        if (trimmedText.length < 1) {
            setSuggestions([]);
            return;
        }

        setIsGenerating(true);

        // Use a brief delay to show loading state
        setTimeout(() => {
            // Get words already used in the text
            const usedWords = getUsedWords(text);

            // Get pattern-based suggestions
            const patternSuggestions = getPatternBasedNextWords(text);

            // Get contextual therapeutic words
            const contextualWords = getContextualWords(text);

            // Add some random creative words
            const randomWords = getRandomWords();

            // Combine all suggestions - prioritize pattern suggestions first, then contextual, then random
            const allSuggestions = [...patternSuggestions, ...contextualWords, ...randomWords];

            // Filter out already used words, remove duplicates, and limit to 15 new suggestions
            const filteredSuggestions = allSuggestions
                .filter(word => !usedWords.has(word.toLowerCase()))
                .filter((word, index, arr) => arr.indexOf(word) === index) // Remove duplicates
                .slice(0, 15);

            // Update suggestions and accumulate previous suggestions properly
            setSuggestions(currentSuggestions => {
                // Immediately update previous suggestions with the current ones
                setPreviousSuggestions(prevSuggestions => {
                    // Combine ALL previous suggestions: current suggestions + existing previous suggestions
                    const allPreviousSuggestions = [...currentSuggestions, ...prevSuggestions];

                    // Filter and clean up previous suggestions - allow overlap with new suggestions for maximum variety
                    const cleanedPrevious = allPreviousSuggestions
                        .filter(word => !usedWords.has(word.toLowerCase())) // Remove used words
                        // Allow overlap with new suggestions since users want maximum choice - visually distinct with different colors
                        .filter((word, index, arr) => arr.indexOf(word) === index) // Remove duplicates within previous suggestions
                        .slice(0, 35); // Keep up to 35 previous suggestions for total of 50 (15 new + 35 previous)

                    // Optional: Log total suggestions for debugging
                    // console.log('Previous suggestions count:', cleanedPrevious.length, 'Total with new:', filteredSuggestions.length + cleanedPrevious.length);
                    return cleanedPrevious;
                });

                // Return the new suggestions
                return filteredSuggestions;
            });

            setIsGenerating(false);
        }, 200);
    }, [getPatternBasedNextWords, getContextualWords, getRandomWords, getUsedWords]);

    // Handle input changes
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newText = e.target.value;
        setInputText(newText);

        // Clear existing timers
        if (typingTimerRef.current) {
            clearTimeout(typingTimerRef.current);
        }

        // Show "Take your time..." message if user pauses typing
        setShowTakeYourTime(false);
        typingTimerRef.current = setTimeout(() => {
            setShowTakeYourTime(true);
            // Hide the message after a bit
            setTimeout(() => setShowTakeYourTime(false), 3000);
        }, 2000);

        // Generate suggestions when user adds a space (completes a word)
        if (newText.endsWith(' ') && newText !== ' ') {
            generateSuggestions(newText);
        }
    }, [generateSuggestions]);

    // Handle applying a suggestion
    const applySuggestion = useCallback((word: string) => {
        const newText = inputText + (inputText.endsWith(' ') ? word : ' ' + word) + ' ';
        setInputText(newText);

        // Remove the clicked word from current suggestions immediately
        setSuggestions(current => current.filter(w => w !== word));

        // Remove the clicked word from previous suggestions as well
        setPreviousSuggestions(previous => previous.filter(w => w !== word));

        // Generate new suggestions based on the updated text
        generateSuggestions(newText);
    }, [inputText, generateSuggestions]);

    // Handle keyboard shortcuts
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab' && suggestions.length > 0) {
            e.preventDefault();
            applySuggestion(suggestions[0]); // Apply first suggestion on Tab
        }
    }, [suggestions, applySuggestion]);

    // Initialize with suggestions for the default "I " text
    React.useEffect(() => {
        if (!hasInitialized) {
            setHasInitialized(true);
            generateSuggestions(inputText);
        }
    }, [hasInitialized, inputText, generateSuggestions]);

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

            <div id="suggestions-container" className="min-h-[80px] flex flex-wrap gap-2" role="region" aria-label="Word suggestions">
                {/* Show "Take your time..." message when pausing */}
                {showTakeYourTime && !isGenerating && (
                    <div className="flex items-center gap-2 px-4 py-3 text-blue-600 dark:text-blue-400 text-base font-medium bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/30 mb-3 w-full" aria-live="polite">
                        <div className="w-5 h-5 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse mr-1"></div>
                        <span>Take your time...</span>
                    </div>
                )}

                {/* Show loading skeleton when generating suggestions */}
                {isGenerating && (
                    <>
                        {[70, 85, 95, 75, 100, 80].map((width, index) => (
                            <div
                                key={`skeleton-${index}`}
                                className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
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
                                className="px-3 py-2 text-sm font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors border border-blue-200 dark:border-blue-700"
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
                                className="px-3 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
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