'use client';

import { useState, useRef, useEffect } from 'react';

interface TextToSpeechAdvancedProps {
  text: string;
  className?: string;
}

export default function TextToSpeechAdvanced({ text, className = '' }: TextToSpeechAdvancedProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en-US');
  const [selectedVoice, setSelectedVoice] = useState<number>(0);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Load available voices
  const loadVoices = () => {
    const availableVoices = speechSynthesis.getVoices();
    setVoices(availableVoices);
    
    // Set default language to first available English voice or first voice
    if (availableVoices.length > 0 && !selectedLanguage) {
      const defaultVoice = availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0];
      setSelectedLanguage(defaultVoice.lang);
    }
  };

  // Get unique languages from available voices
  const getAvailableLanguages = () => {
    const languageMap = new Map<string, { name: string; count: number }>();
    
    voices.forEach(voice => {
      const lang = voice.lang;
      const existing = languageMap.get(lang);
      
      if (existing) {
        existing.count++;
      } else {
        // Create readable language names
        const langName = new Intl.DisplayNames(['en'], { type: 'language' }).of(lang.split('-')[0]) || lang;
        const regionName = lang.includes('-') ? ` (${lang.split('-')[1]})` : '';
        languageMap.set(lang, { 
          name: `${langName}${regionName}`, 
          count: 1 
        });
      }
    });
    
    return Array.from(languageMap.entries()).sort(([a], [b]) => {
      // Sort English first, then alphabetically
      if (a.startsWith('en')) return -1;
      if (b.startsWith('en')) return 1;
      return a.localeCompare(b);
    });
  };

  // Get voices for selected language
  const getVoicesForLanguage = () => {
    return voices.filter(voice => voice.lang === selectedLanguage);
  };

  useEffect(() => {
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      speechSynthesis.cancel();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Update selected voice when language changes
  useEffect(() => {
    const voicesForLang = getVoicesForLanguage();
    if (voicesForLang.length > 0) {
      // Find the index of the first voice in the selected language within the full voices array
      const firstVoiceIndex = voices.findIndex(v => v.lang === selectedLanguage);
      if (firstVoiceIndex !== -1) {
        setSelectedVoice(firstVoiceIndex);
      }
    }
  }, [selectedLanguage, voices]);

  const speak = () => {
    if (!text.trim()) return;

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

  const speakAndRecord = async () => {
    if (!text.trim()) return;

    try {
      // Request microphone access to capture system audio
      // Note: This captures microphone, not system audio directly
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      chunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setIsRecording(false);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      setIsRecording(true);
      mediaRecorder.start();

      // Start speaking after a brief delay
      setTimeout(() => {
        speak();
      }, 100);

      // Stop recording when speech ends (estimate duration)
      const estimatedDuration = text.length * 100; // rough estimate
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      }, Math.max(2000, estimatedDuration));

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone for recording. You can still use the play function.');
      setIsRecording(false);
    }
  };

  const stop = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const downloadAudio = () => {
    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `tts-${Date.now()}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const generateWithAPI = async () => {
    try {
      // Call your TTS API
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text, 
          voice: voices[selectedVoice]?.lang || 'en-US' 
        }),
      });

      if (response.headers.get('content-type')?.includes('audio')) {
        // If API returns audio file
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      } else {
        // If API returns JSON with instructions
        const data = await response.json();
        console.log('TTS API Response:', data);
        alert('TTS API is ready but needs cloud service configuration. See console for details.');
      }
    } catch (error) {
      console.error('API Error:', error);
      alert('API call failed. Using client-side TTS instead.');
    }
  };

  return (
    <div className={`p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
      <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
        Advanced Text to Speech
      </h3>

      {/* Language and Voice Selection */}
      <div className="mb-4 space-y-3">
        {/* Language Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Language:
          </label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm"
          >
            {getAvailableLanguages().map(([lang, info]) => (
              <option key={lang} value={lang}>
                {info.name} ({info.count} voice{info.count !== 1 ? 's' : ''})
              </option>
            ))}
          </select>
        </div>

        {/* Voice Selection for Selected Language */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Voice in {selectedLanguage}:
          </label>
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm"
          >
            {voices
              .map((voice, index) => ({ voice, index }))
              .filter(({ voice }) => voice.lang === selectedLanguage)
              .map(({ voice, index }) => (
                <option key={index} value={index}>
                  {voice.name} {voice.default ? '(Default)' : ''} {voice.localService ? '(Local)' : '(Remote)'}
                </option>
              ))}
          </select>
        </div>

        {/* Voice Info */}
        {voices[selectedVoice] && (
          <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
            <strong>Selected:</strong> {voices[selectedVoice].name} • 
            <strong> Language:</strong> {voices[selectedVoice].lang} • 
            <strong> Type:</strong> {voices[selectedVoice].localService ? 'Local' : 'Network'} • 
            <strong> URI:</strong> {voices[selectedVoice].voiceURI}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
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

        <div>
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
      </div>

      {/* Text Display */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded border max-h-32 overflow-y-auto">
        <p className="text-gray-800 dark:text-gray-200 text-sm">{text}</p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        <button
          onClick={speak}
          disabled={isPlaying || isRecording}
          className="px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded transition-colors text-sm"
        >
          {isPlaying ? 'Speaking...' : 'Play'}
        </button>
        
        <button
          onClick={speakAndRecord}
          disabled={isPlaying || isRecording}
          className="px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded transition-colors text-sm"
        >
          {isRecording ? 'Recording...' : 'Record'}
        </button>

        <button
          onClick={stop}
          disabled={!isPlaying && !isRecording}
          className="px-3 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded transition-colors text-sm"
        >
          Stop
        </button>

        <button
          onClick={generateWithAPI}
          className="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded transition-colors text-sm"
        >
          Use API
        </button>
      </div>

      {/* Audio Player */}
      {audioUrl && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-700 dark:text-green-300 mb-2">✓ Audio generated successfully!</p>
          <audio controls className="w-full mb-2">
            <source src={audioUrl} type="audio/wav" />
            Your browser does not support audio playback.
          </audio>
          <button
            onClick={downloadAudio}
            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm transition-colors"
          >
            Download Audio File
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p><strong>Play:</strong> Uses browser TTS (no file generated)</p>
        <p><strong>Record:</strong> Captures microphone while playing TTS</p>
        <p><strong>API:</strong> For server-side generation (requires cloud service setup)</p>
      </div>
    </div>
  );
}