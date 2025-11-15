'use client';

import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';

import QRCodeGenerator from "@/components/QRCodeGenerator";
import AutoResizeTextarea from "@/components/AutoResizeTextarea";
import StartOverButton from "@/components/StartOverButton";

function FinalPageContent() {
  const searchParams = useSearchParams();
  const messageFromQuestionnaire = searchParams.get('message');

  // const template = `Hey! I wanted to share something with you: "${messageFromQuestionnaire}" Just a little reminder that you are capable of amazing things. Trust yourself and take that next step forward. You've got this!`;

  // Use the message from questionnaire, or fall back to a default
  const encouragingMessage = messageFromQuestionnaire || "You are capable of amazing things. Trust yourself and take that next step forward.";
  const [fullMessage, setFullMessage] = useState(`Could you do me a favor and record a voice memo saying the following and send it to me: \n\n"${encouragingMessage}" \n\nFeel free to put your own spin to it or record it in a way that feels right.\n\n(This has been created as a part of an art project exploring vulnerability, support, and introspection.)`);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showManualCopy, setShowManualCopy] = useState(false);

  // Word count limits
  const maxWords = 100; // Reasonable limit for the final message

  // Helper function to count words
  const getWordCount = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullMessage);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      // Fallback for older browsers and Android
      try {
        const textArea = document.createElement('textarea');
        textArea.value = fullMessage;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        } else {
          setShowManualCopy(true);
        }
      } catch (e) {
        setShowManualCopy(true);
      }
    }
  };

  return (


    <div className="max-w-4xl content-container p-8">
      <div className="mb-4 flex justify-end">
        <StartOverButton />
      </div>
      <h2 className="text-2xl font-semibold text-gray-800  mb-4 ">Now the hard part.</h2>
      <div className="grid md:grid-cols-2 md:gap-5 lg:gap-10">

        <div className="col-span-1">
          <p>You will be reaching out to someone who will recite this message back to you.</p>
          <p>Sharing with others is vulnerable, but it also can be easier to be encouraged by the voice of others than your own voice.</p>
          <p>Once they send you the voice note, you should save it so you can replay it whenever you need a reminder.</p>
        </div>
        <div className="col-span-1">

          <p>Use this QR code to open up the message on your phone and send to a trusted person in your life who can support you.</p>
          <p>If you are having trouble thinking of someone to send to, can email me at <a href="mailto:hello@kristinefernandez.com?subject=Hear Me Out">hello@kristinefernandez.com</a> and I will record one for you.</p>
        </div>
      </div>


      <hr className="mt-3 mb-6" />


      <div className="flex gap-10 items-center flex-col lg:flex-row">

        <div className="lg:w-3/4 w-full">
          <label htmlFor="message">Can continue to edit the message here</label>
          <AutoResizeTextarea
            id="message"
            value={fullMessage}
            onChange={setFullMessage}
            className="w-full border mb-3 p-6"
            minHeight="80px"
            maxWords={maxWords}
          />
          <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
            <span>{getWordCount(fullMessage)} words (max {maxWords})</span>
            <button
              onClick={copyToClipboard}
              className="button "
            >
              {copySuccess ? '✓ Copied!' : 'Copy Text'}
            </button>
          </div>
          {showManualCopy && (
            <div className="mb-2 text-xs text-red-600">
              <p>Copy not supported on this device/browser. Please select the text above and copy it manually.</p>
            </div>
          )}

        </div>
        <div className="lg:w-1/4 w-full">

          <p className="text-sm text-gray-500 mb-4">💡 Already on your phone? Use "Copy Text" to copy the message directly.</p>
          <QRCodeGenerator text={fullMessage} />

        </div>
      </div>
    </div>

  );
}

export default function FinalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50  flex items-center justify-center">Loading...</div>}>
      <FinalPageContent />
    </Suspense>
  );
}
