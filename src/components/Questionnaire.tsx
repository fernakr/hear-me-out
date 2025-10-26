'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AutoResizeTextarea from './AutoResizeTextarea';
import StartOverButton from './StartOverButton';

export default function Questionnaire() {
    const router = useRouter();
    const [questionIndex, setQuestionIndex] = useState(0);

    const questions = [
        {
            id: 'internalize',
            text: 'What is something (belief, thought, behavior) that you have trouble internalizing?',
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

    // Initialize responses array with empty strings for each question
    const [responses, setResponses] = useState<string[]>(() =>
        new Array(questions.length).fill('')
    );

    const updateResponse = (value: string) => {
        setResponses(prev => {
            const updated = [...prev];
            updated[questionIndex] = value;
            return updated;
        });
    };

    const currentQuestion = questions[questionIndex];

    const isCurrentQuestionAnswered = () => {
        const currentResponse = responses[questionIndex];
        return currentResponse && currentResponse.trim().length > 0;
    };

    const handleNext = () => {
        if (!isCurrentQuestionAnswered()) {
            alert('Please answer the current question before proceeding.');
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
        return finalResponse && finalResponse.trim().length > 0;
    };

    const handleSubmit = () => {
        if (!isFinalQuestionAnswered()) {
            alert('Please complete your encouraging message before submitting.');
            return;
        }

        // Get just the final response (the encouragement message)
        const finalResponse = responses[questions.length - 1];

        // Navigate to final page with the encouragement message as a query parameter
        const encodedResponse = encodeURIComponent(finalResponse);
        router.push(`/final?message=${encodedResponse}`);
    };





    const maxLength = 300;

    return (
        <div className="w-full max-w-4xl ">
            <div className="flex justify-between mb-8 gap-3">

                <span><span className="hidden lg:inline">Question </span>{questionIndex + 1} of {questions.length}</span>
                <StartOverButton />
            </div>


            <div className="lg:py-10">
                <label htmlFor="answer" className="md:text-2xl lg:text-3xl mb-3">{currentQuestion.text}</label>
                {currentQuestion.subtext && (
                    <p className="mb-4 text-gray-600">{currentQuestion.subtext}</p>
                )}

                <AutoResizeTextarea
                    id="answer"
                    className="w-full border p-2"
                    value={responses[questionIndex] || ''}
                    onChange={updateResponse}
                    maxLength={maxLength}
                    placeholder="Type your response here... (Required)"
                    required
                />
                <div className="flex justify-between mt-2 text-sm text-gray-500">
                    <span>{`${(responses[questionIndex] || '').length}/${maxLength} characters`}</span>
                    <span>{isCurrentQuestionAnswered() ? '✓ Answered' : '⚠ Required'}</span>
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
                        Next Question
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

