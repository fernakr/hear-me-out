'use client';

import { useState, useRef, useEffect } from 'react';

interface TextToSpeechProps {
  text: string;
  className?: string;
}

export default function TextToSpeech({ text, className = '' }: TextToSpeechProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<number>(0);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load available voices
  const loadVoices = () => {
    const availableVoices = speechSynthesis.getVoices();
    setVoices(availableVoices);
  };

  // Initialize voices when component mounts or voices change
  useEffect(() => {
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      speechSynthesis.cancel();
    };
  }, []);

  const speak = () => {
    if (!text.trim()) return;

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voices[selectedVoice] || null;
    utterance.rate = rate;
    utterance.pitch = pitch;
    
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  };

  const stop = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const downloadAudio = async () => {
    // Note: Web Speech API doesn't directly support audio file generation
    // This would require additional libraries or server-side processing
    alert('Audio download requires additional setup - see server-side options below!');
  };

  return (
    <div className={`p-4 bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
        Text to Speech
      </h3>

      {/* Voice Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Voice:
        </label>
        <select
          value={selectedVoice}
          onChange={(e) => setSelectedVoice(parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
        >
          {voices.map((voice, index) => (
            <option key={index} value={index}>
              {voice.name} ({voice.lang})
            </option>
          ))}
        </select>
      </div>

      {/* Rate Control */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Speed: {rate}x
        </label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={rate}
          onChange={(e) => setRate(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Pitch Control */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Pitch: {pitch}
        </label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={pitch}
          onChange={(e) => setPitch(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Text Display */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded border">
        <p className="text-gray-800 dark:text-gray-200">{text}</p>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          onClick={speak}
          disabled={isPlaying}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded transition-colors"
        >
          {isPlaying ? 'Speaking...' : 'Play'}
        </button>
        
        <button
          onClick={stop}
          disabled={!isPlaying}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded transition-colors"
        >
          Stop
        </button>

        <button
          onClick={downloadAudio}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
        >
          Download Audio
        </button>
      </div>
    </div>
  );
}