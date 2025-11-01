# Hear Me Out - AI Coding Instructions

## Project Overview
"Hear Me Out" is a therapeutic Next.js 16 app that guides users through introspective questionnaires to create personalized encouragement messages. The core flow: questionnaire → pattern-based text prediction → message creation → QR code sharing for voice memo requests from trusted contacts.

## Critical Architecture Patterns

### Pattern-Based Text Prediction System
- **No external ML dependencies**: Uses curated therapeutic word sets and pattern matching
- **Instant response**: No loading delays or network dependencies
- **Therapeutic focus**: 9 categories of therapeutic vocabulary (emotions, struggles, needs, support, actions, thoughts, relationships, time, connectors)
- **Pattern matching**: Hardcoded sentence completion patterns for common therapeutic phrases

### Component Architecture
- **AutoResizeTextarea**: Reusable component with Android compatibility (`resize-vertical` vs `resize-none`)
- **Client-side only components**: Mark with `'use client'` - most components need browser APIs
- **Suspense boundaries**: Wrap components using `useSearchParams` (see `src/app/final/page.tsx`)

### State Management Patterns
- **URL-based state**: Pass data between pages via searchParams (`/final?message=...`)
- **Loading states**: Simple boolean flags for generation state (`isGenerating`)
- **Refs for persistence**: Use `useRef` for timers and previous values

### Styling System
- **Pure Tailwind CSS**: No custom CSS classes - use Tailwind utilities throughout
- **Font system**: Multiple font families loaded in layout (`geist-sans`, `poppins`, etc.)
- **Responsive design**: Mobile-first with `md:` and `lg:` breakpoints

## Development Workflow

### Essential Commands
```bash
# Standard Next.js commands
npm run dev
npm run build
npm run start
```

### Debugging Pattern & Prediction Issues
- **Pattern matching**: Test specific phrases against `getPatternBasedNextWords()` patterns
- **Word categories**: Verify therapeutic word sets are triggering correctly
- **Timing issues**: Adjust generation delays (200ms) for better UX
- **UX**: Use loading skeletons during brief generation delays for smooth experience

**Common Debug Patterns**:
```tsx
// Trace prediction flow
console.log('Pattern suggestions:', patternResults);
console.log('Contextual words:', contextualWords);
console.log('Final suggestions:', allSuggestions);
```

## Project-Specific Conventions

### File Organization
- **Pages**: App router in `src/app/` - each route is a folder with `page.tsx`
- **Components**: Reusable components in `src/components/`
- **Flow**: `/ → /questionnaire → /help (pattern-based suggestions) → /final`

### API Patterns
- **TTS services**: Mock implementations in `src/lib/tts-services.ts` for ElevenLabs/OpenAI
- **No backend required**: Fully client-side app with local pattern matching

### Accessibility & UX
- **ARIA labels**: Required for form inputs and suggestion buttons
- **Keyboard navigation**: Tab key applies first suggestion
- **Mobile optimization**: QR codes for phone-based message sharing

## Key Integration Points

### Pattern-Based Text Prediction System (`PredictionInput.tsx`)

**Core Architecture**: Lightweight prediction system using pattern matching and therapeutic word sets
- **Triggers**: Space completion, sentence starts, focus events
- **No external dependencies**: Pure JavaScript pattern matching
- **Instant response**: No network calls or model loading delays

**Prediction Pipeline** (3-tier system):
1. **Pattern-based prediction**: Hardcoded therapeutic sentence patterns (`I feel` → `like/that/so`)  
2. **Context-based selection**: 9 therapeutic word categories (emotions, struggles, needs, etc.)
3. **Creative variety**: Random words from curated sets for inspiration

```tsx
// Critical prediction flow pattern
const generateSuggestions = useCallback((text: string) => {
    // 1. Pattern-based suggestions for common phrases
    const patternSuggestions = getPatternBasedNextWords(text);
    // 2. Context-aware therapeutic words
    const contextualWords = getContextualWords(text);
    // 3. Creative random words for variety
    const randomWords = getRandomWords();
}, []);
```

**Therapeutic Word Categories**: 9 predefined sets for intelligent fallbacks
- `emotions`: feel, anxious, hopeful, calm, frustrated, etc.
- `struggles`: difficult, overwhelming, stuck, confused, etc.  
- `needs`: help, support, understanding, validation, etc.
- `actions`: try, practice, grow, change, progress, etc.

**Performance Optimizations**:
- Memoized word sets and pattern functions
- Brief loading delays (200ms) for smooth UX transitions
- Skeleton loading templates for visual consistency
- Instant pattern matching with no network dependencies

**Key Implementation Details**:
- Space-triggered predictions only (not keystroke-by-keystroke)
- Initial "I " text with immediate first suggestions
- Tab key applies first suggestion for keyboard accessibility
- Android-compatible textarea resizing (`resize-vertical` vs `resize-none`)

### Data Flow
1. User answers therapeutic questions (`Questionnaire.tsx`)
2. Optional pattern-assisted writing (`PredictionInput.tsx` on `/help`)
3. Message finalization with QR code (`/final`)
4. External sharing via voice memo requests

## Advanced Pattern Logic Details

### Pattern-Based Prediction Rules
The system uses hardcoded patterns for common therapeutic phrases:
- `" I"` → `['feel', 'am', 'have', 'need', 'want', 'think']`
- `" feel"/"felt"` → `['like', 'that', 'so', 'really', 'very', 'quite']` 
- `" need"` → `['to', 'help', 'support', 'someone', 'time', 'space']`
- Context detection: `struggling|difficult` → `['with', 'to', 'because', 'and', 'but', 'when']`

### Context-Aware Word Selection
Text analysis triggers therapeutic word categories:
- `feel|emotion|mood` → emotions category words
- `struggle|difficult|problem` → struggles category words
- `need|want|hope` → needs category words
- `help|support|care` → support category words

### Timing & UX Strategy
- **Brief loading delays**: 200ms generation time for smooth visual transitions
- **Loading indicators**: Animated skeleton placeholders maintain engagement
- **Instant feedback**: No network dependencies mean responsive interactions
- **Accessibility**: Tab key applies first suggestion for keyboard users

Remember: This is a vulnerability-focused therapeutic tool - handle user data sensitively and maintain encouraging, supportive UX throughout the experience.