'use client';

import { useState, useEffect, useRef } from 'react';

export default function Questionnaire() {
    const [questionIndex, setQuestionIndex] = useState(0);    
    
    const questions = [
        {
            id: 'internalize',
            text: 'What is a recurring thing that you have trouble internalizing?',    
        },
        {
            id: 'reasons',
            text: 'What are the reasons why it\'s so hard to accept?'
        },
        {
            id: 'believe',
            text: 'What would it take for you to believe it more deeply?'
        },
        {
            id: 'encouragement',
            text: 'Write a phrase in the form of "You [can/are/will]...". Imagine you are talking to a close friend and what you would say to encourage them in this situation.'
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

    const areAllQuestionsAnswered = () => {
        return responses.every(response => response && response.trim().length > 0);
    };

    const handleSubmit = async () => {
        if (!areAllQuestionsAnswered()) {
            alert('Please answer all questions before submitting.');
            return;
        }

        // You can customize this to send data to an API, save to a database, etc.
        console.log('Questionnaire responses:', responses);
        
        // Example: Send to API
        // try {
        //     const response = await fetch('/api/questionnaire', {
        //         method: 'POST',
        //         headers: { 'Content-Type': 'application/json' },
        //         body: JSON.stringify({ responses, timestamp: new Date().toISOString() })
        //     });
        //     if (response.ok) {
        //         alert('Responses submitted successfully!');
        //     }
        // } catch (error) {
        //     console.error('Failed to submit:', error);
        // }
        
        alert('Responses saved! Check console for details.');
    };

    



    const maxLength = 300;
    
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
                Self-Reflection Questionnaire
            </h2>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
                {currentQuestion.text}
            </p>
            <textarea 
                value={responses[questionIndex] || ''} 
                onChange={(e) => updateResponse(e.target.value)} 
                className={`w-full border mb-3 p-3 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    !isCurrentQuestionAnswered() ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
                rows={4}
                maxLength={maxLength}
                placeholder="Type your response here... (Required)"
                required
            />
            <div className="flex justify-between text-sm mb-6">
                <span className="text-gray-500 dark:text-gray-400">
                    {`${(responses[questionIndex] || '').length}/${maxLength} characters`}
                </span>
                <span className={`font-medium ${
                    isCurrentQuestionAnswered() 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-500 dark:text-red-400'
                }`}>
                    {isCurrentQuestionAnswered() ? '✓ Answered' : '⚠ Required'}
                </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
                <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }}
                ></div>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between items-center">
                {questionIndex > 0 && (
                    <button
                        onClick={handlePrevious}
                        className="bg-blue-500 hover:bg-blue-600 text-white cursor-pointer px-4 py-2 rounded transition-colors"
                    >
                        Previous Question
                    </button>
                )}
                
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        Question {questionIndex + 1} of {questions.length}
                    </span>
                </div>
                
                {questionIndex < questions.length - 1 ? (
                    <button
                        onClick={handleNext}
                        disabled={!isCurrentQuestionAnswered()}
                        className={`px-4 py-2 rounded transition-colors ${
                            isCurrentQuestionAnswered()
                                ? 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        Next Question
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={!areAllQuestionsAnswered()}
                        className={`px-4 py-2 rounded transition-colors ${
                            areAllQuestionsAnswered()
                                ? 'bg-green-500 hover:bg-green-600 text-white cursor-pointer'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        Submit Responses
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

