'use client';

import React, { createContext, useContext, useState } from 'react';

interface AudioContextType {
    isMuted: boolean;
    setMuted: (muted: boolean) => void;
    toggleMute: () => void;
    volume: number;
    setVolume: (volume: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
    const [isMuted, setMuted] = useState(false); // Start playing by default
    const [volume, setVolume] = useState(0.3); // Default volume

    const toggleMute = () => {
        setMuted(!isMuted);
    };

    return (
        <AudioContext.Provider value={{ 
            isMuted, 
            setMuted, 
            toggleMute, 
            volume, 
            setVolume 
        }}>
            {children}
        </AudioContext.Provider>
    );
}

export function useAudio() {
    const context = useContext(AudioContext);
    if (context === undefined) {
        throw new Error('useAudio must be used within an AudioProvider');
    }
    return context;
}