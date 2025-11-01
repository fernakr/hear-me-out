# Hear Me Out

A therapeutic Next.js 16 app that guides users through introspective questionnaires to create personalized encouragement messages. The core flow: questionnaire → pattern-based text prediction → message creation → QR code sharing for voice memo requests from trusted contacts.

## Features

- **Therapeutic Questionnaire**: Guided introspective questions to help users reflect
- **Pattern-Based Text Prediction**: Intelligent word suggestions using therapeutic vocabulary and sentence patterns
- **Message Creation**: Transform reflections into personalized encouragement messages
- **QR Code Sharing**: Generate QR codes for trusted contacts to leave voice memos

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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
