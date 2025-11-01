# Hear Me Out - AI Coding Instructions

## Project Overview
"Hear Me Out" is a therapeutic Next.js 16 app that guides users through introspective questionnaires to create personalized encouragement messages. The core flow: questionnaire → ML-powered text prediction → message creation → QR code sharing for voice memo requests from trusted contacts.

## Critical Architecture Patterns

### ML Integration with @xenova/transformers
- **Always run dev server with webpack mode**: `npm run dev -- --webpack`
- **Dynamic imports required**: Import `@xenova/transformers` inside `useEffect` to avoid SSR issues
- **Model loading pattern**: Use refs to persist pipeline across renders, implement loading states with skeletons
- **Configuration**: `serverExternalPackages: ['@xenova/transformers']` in `next.config.ts`

```tsx
// Required pattern for ML model loading
const { pipeline, env } = await import('@xenova/transformers');
env.allowRemoteModels = true;
env.allowLocalModels = false;
generatorRef.current = await pipeline('text-generation', 'Xenova/distilgpt2', {
    quantized: true
});
```

### Component Architecture
- **AutoResizeTextarea**: Reusable component with Android compatibility (`resize-vertical` vs `resize-none`)
- **Client-side only components**: Mark with `'use client'` - most components need browser APIs
- **Suspense boundaries**: Wrap components using `useSearchParams` (see `src/app/final/page.tsx`)

### State Management Patterns
- **URL-based state**: Pass data between pages via searchParams (`/final?message=...`)
- **Loading states**: Implement with boolean flags, not status strings (`isModelLoading` vs `status`)
- **Refs for persistence**: Use `useRef` for timers, previous values, and ML model instances

### Styling System
- **Pure Tailwind CSS**: No custom CSS classes - use Tailwind utilities throughout
- **Font system**: Multiple font families loaded in layout (`geist-sans`, `poppins`, etc.)
- **Responsive design**: Mobile-first with `md:` and `lg:` breakpoints

## Development Workflow

### Essential Commands
```bash
# CRITICAL: Always use webpack mode for ML features
npm run dev -- --webpack

# Standard Next.js commands
npm run build
npm run start
```

### Debugging ML & Prediction Issues
- **Model loading**: Check browser console for transformer loading errors
- **Performance**: Verify model quantization settings if memory issues occur  
- **Prediction flow**: Use console.log in `predictNext()` to trace fallback chain
- **Timing issues**: Adjust `PREDICTION_DEBOUNCE_DELAY` (200ms) or `SUBSEQUENT_PREDICTION_DELAY` (1s)
- **Pattern matching**: Test specific phrases against `getPatternBasedNextWords()` patterns
- **UX**: Use loading skeletons instead of status messages for better experience

**Common Debug Patterns**:
```tsx
// Trace prediction flow
console.log('Intent-based suggestions:', contextualWords);
console.log('Pattern fallback for:', text, '→', patternResults);
console.log('Category fallback:', therapeuticWords);
```

## Project-Specific Conventions

### File Organization
- **Pages**: App router in `src/app/` - each route is a folder with `page.tsx`
- **Components**: Reusable components in `src/components/`
- **Flow**: `/ → /questionnaire → /help (ML) → /final`

### API Patterns
- **TTS services**: Mock implementations in `src/lib/tts-services.ts` for ElevenLabs/OpenAI
- **No backend required**: Fully client-side app with local ML processing

### Accessibility & UX
- **ARIA labels**: Required for form inputs and suggestion buttons
- **Keyboard navigation**: Tab key applies first suggestion
- **Mobile optimization**: QR codes for phone-based message sharing

## Key Integration Points

### ML Text Prediction System (`PredictionInput.tsx`)

**Core Architecture**: Multi-layered prediction system with LLM + pattern fallbacks
- **Triggers**: Space completion, sentence starts, focus events
- **Model**: DistilGPT-2 (`Xenova/distilgpt2`) with quantization for browser performance
- **Adaptive timing**: Immediate first predictions (100ms) → delayed subsequent (1s) for better UX

**Prediction Pipeline** (3-tier fallback system):
1. **LLM-based prediction**: Uses therapeutic prompting for contextual next-word completion
2. **Pattern-based fallback**: Hardcoded therapeutic sentence patterns (`I feel` → `like/that/so`)  
3. **Category-based fallback**: 9 therapeutic word categories (emotions, struggles, needs, etc.)

```tsx
// Critical prediction flow pattern
const predictNext = useCallback(async (text: string) => {
    // 1. LLM prediction with therapeutic prompt
    const nextWords = await predictNextWords(trimmedText);
    // 2. Pattern-based fallback for common phrases
    if (!nextWords.length) return getPatternBasedNextWords(text);
    // 3. Category-based therapeutic words as final fallback
}, []);
```

**Therapeutic Word Categories**: 9 predefined sets for intelligent fallbacks
- `emotions`: feel, anxious, hopeful, calm, frustrated, etc.
- `struggles`: difficult, overwhelming, stuck, confused, etc.  
- `needs`: help, support, understanding, validation, etc.
- `actions`: try, practice, grow, change, progress, etc.

**Performance Optimizations**:
- Debounced predictions (200ms) to prevent excessive API calls
- `useRef` for pipeline persistence across renders
- Memoized word sets and pattern functions
- Loading states with "Thinking..." placeholders

**Key Implementation Details**:
- Space-triggered predictions only (not keystroke-by-keystroke)
- Initial "I " text with immediate first suggestions
- Tab key applies first suggestion for keyboard accessibility
- Android-compatible textarea resizing (`resize-vertical` vs `resize-none`)

### Data Flow
1. User answers therapeutic questions (`Questionnaire.tsx`)
2. Optional ML-assisted writing (`PredictionInput.tsx` on `/help`)
3. Message finalization with QR code (`/final`)
4. External sharing via voice memo requests

## Advanced Prediction Logic Details

### LLM Prompt Engineering
The system uses carefully crafted therapeutic prompts for next-word prediction:
```tsx
const prompt = `Complete this therapeutic sentence with the most natural next word. Consider the emotional context and therapeutic flow.

Sentence: "${text}"

Provide 6 different natural next words that would therapeutically complete this sentence. Focus on:
- What would naturally come next in conversation
- Therapeutic vocabulary that helps expression
- Emotional continuity and support
- Common sentence patterns in therapy

Respond with just 6 words separated by commas:`;
```

### Pattern-Based Fallback Rules
When LLM fails, the system uses hardcoded patterns for common therapeutic phrases:
- `" I"` → `['feel', 'am', 'have', 'need', 'want', 'think']`
- `" feel"/"felt"` → `['like', 'that', 'so', 'really', 'very', 'quite']` 
- `" need"` → `['to', 'help', 'support', 'someone', 'time', 'space']`
- Context detection: `struggling|difficult` → `['with', 'to', 'because', 'and', 'but', 'when']`

### Timing & UX Strategy
- **First interaction**: Immediate suggestions (100ms delay) to feel responsive
- **Subsequent interactions**: 1-second delay to reduce cognitive load
- **Debouncing**: 200ms to prevent excessive API calls while typing
- **Loading indicators**: "Thinking..." placeholders maintain engagement
- **Accessibility**: Tab key applies first suggestion for keyboard users

Remember: This is a vulnerability-focused therapeutic tool - handle user data sensitively and maintain encouraging, supportive UX throughout the experience.