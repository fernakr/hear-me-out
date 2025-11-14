# Hear Me Out

A therapeutic Next.js 16 app that guides users through introspective questionnaires to create personalized encouragement messages. The core flow: questionnaire → pattern-based text prediction → message creation → QR code sharing for voice memo requests from trusted contacts.

## Features

- **Therapeutic Questionnaire**: Guided introspective questions to help users reflect
- **Pattern-Based Text Prediction**: Intelligent word suggestions using therapeutic vocabulary and sentence patterns
- **Message Creation**: Transform reflections into personalized encouragement messages
- **QR Code Sharing**: Generate QR codes for trusted contacts to leave voice memos
- **Accessibility & Motion Control**: Comprehensive reduced motion support with persistent user preferences

## Accessibility Features

### Reduced Motion Support
The app includes comprehensive accessibility features for users who prefer reduced motion:

- **Smart Motion Toggle**: Clean lightswitch-style toggle in the top-right corner
- **Persistent Preferences**: Motion settings are saved in localStorage and maintained across all pages
- **Graceful Degradation**: When reduced motion is enabled:
  - Background animations freeze while maintaining visual appeal
  - Floating word suggestions remain clickable but stop moving
  - All interactive elements remain fully functional
- **Respect System Preferences**: Automatically detects and respects the user's system-level `prefers-reduced-motion` setting
- **No Functionality Loss**: All therapeutic features work identically regardless of motion settings

## Getting Started

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Architecture

- **Next.js 16**: Latest version with App Router
- **Pattern-Based Predictions**: No external ML dependencies - uses curated therapeutic word sets
- **Client-Side Only**: Fully browser-based with no backend requirements
- **Therapeutic Focus**: 9 categories of therapeutic vocabulary for intelligent suggestions
- **Accessibility-First**: Motion preferences managed via React Context with localStorage persistence
- **P5.js Backgrounds**: Animated halftone ocean backgrounds that respect motion preferences

### Motion Management System

The app uses a sophisticated motion management system built on React Context:

```typescript
// Core motion context provides app-wide state
MotionProvider -> useMotion() hook -> MotionToggle component

// Background components respect motion state
P5Background: Freezes wave animation when motion is reduced
P5SuggestionBackground: Disables floating and collision physics
```

**Key Components:**
- `MotionContext`: Global state management for motion preferences
- `MotionToggle`: Lightswitch-style UI component with persistence
- `useReducedMotion`: Custom hook managing localStorage + system preferences
- `LayoutClient`: Wraps all pages with consistent motion-aware backgrounds

## Development Guidelines

### Adding Motion-Aware Components

When creating new animated components, always respect the motion context:

```typescript
import { useMotion } from '@/components/MotionContext';

function MyAnimatedComponent() {
  const { reducedMotion } = useMotion();
  
  // Disable animations when reducedMotion is true
  const animationSpeed = reducedMotion ? 0 : 1;
  
  return <div className={`transition-transform ${!reducedMotion && 'animate-pulse'}`} />;
}
```

### Motion-Responsive Styling

Use conditional styling for motion-sensitive animations:

```typescript
// Good: Respects user preference
const floatOffset = !reducedMotion ? Math.sin(time) * 2 : 0;

// Good: Conditional CSS classes  
className={`transform transition-all ${!reducedMotion && 'hover:scale-105'}`}
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
