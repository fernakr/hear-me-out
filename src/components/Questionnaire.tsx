'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AutoResizeTextarea from './AutoResizeTextarea';
import StartOverButton from './StartOverButton';

export default function Questionnaire() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [questionIndex, setQuestionIndex] = useState(0);

    const questions = [
        {
            id: 'internalize',
            text: 'What is a belief or behavior that you understand in theory but find difficult to truly accept or apply in your life?',
            subtext: 'Could be a big thing, a small thing, or anything in between.'
        },
        {
            id: 'reasons',
            text: 'What is/are the thing(s) holding you back?',
            subtext: 'These could be internal (self-doubt, fear, etc.) or external (lack of resources, unsupportive environment, etc.)'
        },
        {
            id: 'believe',
            text: 'What is/are the thing(s) (behaviors, resources, tools) that could help you with this?',
            subtext: 'These could be internal (mindset shifts, habits, etc.) or external (support systems, opportunities, etc.)'

        },
        {
            id: 'encouragement',
            text: 'Write a message in the form of "You [can/are/will]...". Imagine you are talking to a close friend and what you would say to encourage them in this situation.',

        }
    ]

    // Initialize responses array with prefill if available
    const [responses, setResponses] = useState<string[]>(() => {
        const initialResponses = new Array(questions.length).fill('');
        const prefillText = searchParams.get('prefill');
        if (prefillText) {
            initialResponses[0] = decodeURIComponent(prefillText);
        }
        return initialResponses;
    });

    const updateResponse = (value: string) => {
        setResponses(prev => {
            const updated = [...prev];
            updated[questionIndex] = value;
            return updated;
        });
    };

    const currentQuestion = questions[questionIndex];

    // Handle Enter key press for next question
    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey && isCurrentQuestionAnswered()) {
            event.preventDefault();
            if (questionIndex < questions.length - 1) {
                handleNext();
            } else {
                handleSubmit();
            }
        }
    };

    const isCurrentQuestionAnswered = () => {
        const currentResponse = responses[questionIndex];
        if (!currentResponse || currentResponse.trim().length === 0) {
            return false;
        }
        const wordCount = getWordCount(currentResponse);
        return wordCount >= minWords && wordCount <= maxWords;
    };

    const handleNext = () => {
        if (!isCurrentQuestionAnswered()) {
            const currentResponse = responses[questionIndex] || '';
            const wordCount = getWordCount(currentResponse);
            if (currentResponse.trim().length === 0) {
                alert('Please answer the current question before proceeding.');
            } else if (wordCount < minWords) {
                alert(`Please add ${minWords - wordCount} more words to meet the minimum requirement of ${minWords} words.`);
            } else if (wordCount > maxWords) {
                alert(`Please reduce your answer by ${wordCount - maxWords} words to stay within the ${maxWords} word limit.`);
            }
            return;
        }
        if (questionIndex < questions.length - 1) {
            setQuestionIndex(questionIndex + 1);
        }
    };

    const handlePrevious = () => {
        if (questionIndex > 0) {
            setQuestionIndex(questionIndex - 1);
        }
    };

    const isFinalQuestionAnswered = () => {
        const finalResponse = responses[questions.length - 1];
        if (!finalResponse || finalResponse.trim().length === 0) {
            return false;
        }
        const wordCount = getWordCount(finalResponse);
        return wordCount >= minWords && wordCount <= maxWords;
    };

    const handleSubmit = () => {
        if (!isFinalQuestionAnswered()) {
            const finalResponse = responses[questions.length - 1] || '';
            const wordCount = getWordCount(finalResponse);
            if (finalResponse.trim().length === 0) {
                alert('Please complete your encouraging message before submitting.');
            } else if (wordCount < minWords) {
                alert(`Please add ${minWords - wordCount} more words to meet the minimum requirement of ${minWords} words.`);
            } else if (wordCount > maxWords) {
                alert(`Please reduce your message by ${wordCount - maxWords} words to stay within the ${maxWords} word limit.`);
            }
            return;
        }

        // Get just the final response (the encouragement message)
        const finalResponse = responses[questions.length - 1];

        // Navigate to final page with the encouragement message as a query parameter
        const encodedResponse = encodeURIComponent(finalResponse);
        router.push(`/final?message=${encodedResponse}`);
    };





    const minWords = 7;
    const maxWords = 40;

    // Helper function to count words
    const getWordCount = (text: string): number => {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    };

    return (
        <div className="w-full max-w-4xl content-container p-8">
            <div className="flex justify-between mb-8 gap-3 text-gray-400 text-sm font-bold">

                <span><span className="hidden lg:inline ">Question </span>{questionIndex + 1} of {questions.length}</span>
                {questionIndex > 0 ? <StartOverButton /> : <Link href="/help" className="nav-link">Need help figuring out what this is?</Link>}
            </div>


            <div className="lg:py-10">
                <label htmlFor="answer" className="block mb-4 font-bold question-text md:text-2xl lg:text-3xl mb-3">{currentQuestion.text}</label>
                {currentQuestion.subtext && (
                    <p className="tracking-wide mb-4 text-gray-500">{currentQuestion.subtext}</p>
                )}

                <AutoResizeTextarea
                    id="answer"
                    className="w-full border p-2"
                    value={responses[questionIndex] || ''}
                    onChange={updateResponse}
                    onKeyDown={handleKeyDown}
                    minWords={minWords}
                    maxWords={maxWords}
                    placeholder="Type your response here..."
                    required
                />
                <div className="flex justify-between mt-2 text-sm text-gray-500">
                    <span>{getWordCount(responses[questionIndex] || '')} words</span>
                    <span>{minWords}-{maxWords} words required</span>
                    <span>
                        {(() => {
                            const currentResponse = responses[questionIndex] || '';
                            const wordCount = getWordCount(currentResponse);
                            if (currentResponse.trim().length === 0) {
                                return '⚠ Required';
                            } else if (wordCount < minWords) {
                                return `Need ${minWords - wordCount} more words`;
                            } else if (wordCount > maxWords) {
                                return `${wordCount - maxWords} words over limit`;
                            } else {
                                return '✓ Ready';
                            }
                        })()}
                    </span>
                </div>
            </div>


            <div>
                <div style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }}></div>
            </div>

            <div className={'flex justify-between mt-6 gap-4' + (questionIndex === 0 ? ' justify-end' : '')}>
                {questionIndex > 0 && (
                    <button className="button" onClick={handlePrevious}>
                        Previous Question
                    </button>
                )}

                {questionIndex < questions.length - 1 ? (
                    <button
                        className="button"
                        onClick={handleNext}
                        disabled={!isCurrentQuestionAnswered()}
                    >
                        {isCurrentQuestionAnswered() ? 'Next Question (or hit Enter)' : 'More Words Needed'}
                    </button>
                ) : (
                    <button
                        className="button final"
                        onClick={handleSubmit}
                        disabled={!isFinalQuestionAnswered()}
                    >
                        My message is ready
                    </button>
                )}
            </div>

        </div>
    );
}


// let questionIndex = 0;
// const getNextQuestion = () => {
//   const question = questions[questionIndex];
//   questionIndex = (questionIndex + 1) % questions.length;
//   return question;
// };

