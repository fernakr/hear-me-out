'use client';

import { useState, useRef, useEffect } from 'react';

interface ClientSideTTSProps {
  text: string;
  className?: string;
}

export default function ClientSideTTS({ text, className = '' }: ClientSideTTSProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en-US');
  const [selectedVoice, setSelectedVoice] = useState<number>(0);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Load available voices
  const loadVoices = () => {
    const availableVoices = speechSynthesis.getVoices();
    setVoices(availableVoices);
    
    if (availableVoices.length > 0 && !selectedLanguage) {
      const defaultVoice = availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0];
      setSelectedLanguage(defaultVoice.lang);
    }
  };

  useEffect(() => {
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      speechSynthesis.cancel();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Update selected voice when language changes
  useEffect(() => {
    const voicesForLang = getVoicesForLanguage();
    if (voicesForLang.length > 0) {
      const firstVoiceIndex = voices.findIndex(v => v.lang === selectedLanguage);
      if (firstVoiceIndex !== -1) {
        setSelectedVoice(firstVoiceIndex);
      }
    }
  }, [selectedLanguage, voices]);

  // Get unique languages from available voices
  const getAvailableLanguages = () => {
    const languageMap = new Map<string, { name: string; count: number }>();
    
    voices.forEach(voice => {
      const lang = voice.lang;
      const existing = languageMap.get(lang);
      
      if (existing) {
        existing.count++;
      } else {
        const langName = new Intl.DisplayNames(['en'], { type: 'language' }).of(lang.split('-')[0]) || lang;
        const regionName = lang.includes('-') ? ` (${lang.split('-')[1]})` : '';
        languageMap.set(lang, { 
          name: `${langName}${regionName}`, 
          count: 1 
        });
      }
    });
    
    return Array.from(languageMap.entries()).sort(([a], [b]) => {
      if (a.startsWith('en')) return -1;
      if (b.startsWith('en')) return 1;
      return a.localeCompare(b);
    });
  };

  const getVoicesForLanguage = () => {
    return voices.filter(voice => voice.lang === selectedLanguage);
  };

  // Method 1: Direct audio capture using MediaRecorder with system audio
  const generateAudioWithCapture = async () => {
    if (!text.trim()) return;

    try {
      setIsGenerating(true);
      
      // Request screen capture to get system audio
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ 
        audio: true, 
        video: false 
      });

      chunksRef.current = [];
      const mediaRecorder = new MediaRecorder(displayStream, {
        mimeType: 'audio/webm'
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setIsGenerating(false);
        
        // Stop all tracks
        displayStream.getTracks().forEach(track => track.stop());
      };

      // Start recording
      mediaRecorder.start();

      // Start speaking after a brief delay
      setTimeout(() => {
        speak();
      }, 500);

      // Estimate speech duration and stop recording
      const estimatedDuration = Math.max(2000, text.length * 80 + 1000);
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      }, estimatedDuration);

    } catch (error) {
      console.error('Error capturing audio:', error);
      setIsGenerating(false);
      alert('Screen capture failed. Try the Web Audio API method instead.');
    }
  };

  // Method 2: Using Web Audio API (more complex but doesn't require screen sharing)
  const generateAudioWithWebAudio = async () => {
    if (!text.trim()) return;

    try {
      setIsGenerating(true);

      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Create a script processor to capture audio
      const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
      const audioChunks: Float32Array[] = [];

      scriptProcessor.onaudioprocess = (event) => {
        const inputBuffer = event.inputBuffer.getChannelData(0);
        audioChunks.push(new Float32Array(inputBuffer));
      };

      // Connect to destination
      scriptProcessor.connect(audioContext.destination);

      // Create utterance and speak
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voices[selectedVoice] || null;
      utterance.rate = rate;
      utterance.pitch = pitch;
      
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => {
        setIsPlaying(false);
        
        // Convert captured audio to blob
        setTimeout(() => {
          try {
            const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
            const combinedAudio = new Float32Array(totalLength);
            let offset = 0;
            
            audioChunks.forEach(chunk => {
              combinedAudio.set(chunk, offset);
              offset += chunk.length;
            });

            // Convert to WAV
            const audioBuffer = audioContext.createBuffer(1, combinedAudio.length, audioContext.sampleRate);
            audioBuffer.getChannelData(0).set(combinedAudio);

            // Create WAV blob
            const wavBlob = audioBufferToWav(audioBuffer);
            const url = URL.createObjectURL(wavBlob);
            setAudioUrl(url);
            
          } catch (error) {
            console.error('Error processing audio:', error);
          }
          
          scriptProcessor.disconnect();
          setIsGenerating(false);
        }, 500);
      };

      speechSynthesis.speak(utterance);

    } catch (error) {
      console.error('Web Audio API error:', error);
      setIsGenerating(false);
      alert('Web Audio API failed. This method has limitations with speech synthesis.');
    }
  };

  // Convert AudioBuffer to WAV blob
  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const length = buffer.length;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(arrayBuffer);
    const channels = [buffer.getChannelData(0)];

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);

    // Convert audio data
    const channelData = channels[0];
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  // Simple speak function
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

    speechSynthesis.speak(utterance);
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
      link.download = `tts-${Date.now()}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className={`p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
      <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
        Client-Side Audio Generation
      </h3>

      {/* Language and Voice Selection */}
      <div className="mb-4 space-y-3">
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

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Voice:
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
                  {voice.name} {voice.default ? '(Default)' : ''}
                </option>
              ))}
          </select>
        </div>
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
          disabled={isPlaying || isGenerating}
          className="px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded transition-colors text-sm"
        >
          {isPlaying ? 'Speaking...' : 'Play'}
        </button>
        
        <button
          onClick={generateAudioWithCapture}
          disabled={isPlaying || isGenerating}
          className="px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded transition-colors text-sm"
        >
          {isGenerating ? 'Recording...' : 'Capture Audio'}
        </button>

        <button
          onClick={generateAudioWithWebAudio}
          disabled={isPlaying || isGenerating}
          className="px-3 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded transition-colors text-sm"
        >
          Web Audio
        </button>

        <button
          onClick={stop}
          disabled={!isPlaying && !isGenerating}
          className="px-3 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded transition-colors text-sm"
        >
          Stop
        </button>
      </div>

      {/* Audio Player */}
      {audioUrl && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-700 dark:text-green-300 mb-2">✓ Audio file generated!</p>
          <audio controls className="w-full mb-2">
            <source src={audioUrl} type="audio/webm" />
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

      {/* Method Info */}
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p><strong>Play:</strong> Standard TTS playback</p>
        <p><strong>Capture Audio:</strong> Records system audio (requires screen share permission)</p>
        <p><strong>Web Audio:</strong> Experimental method using Web Audio API</p>
        <p><strong>Note:</strong> Browser limitations may affect audio quality and capture methods</p>
      </div>
    </div>
  );
}