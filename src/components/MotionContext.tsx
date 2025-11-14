'use client';

import React, { createContext, useContext } from 'react';
import { useReducedMotion } from './useReducedMotion';

interface MotionContextType {
    reducedMotion: boolean;
    setReducedMotion: (value: boolean) => void;
}

const MotionContext = createContext<MotionContextType | undefined>(undefined);

export function MotionProvider({ children }: { children: React.ReactNode }) {
    const [reducedMotion, setReducedMotion] = useReducedMotion();

    return (
        <MotionContext.Provider value={{ reducedMotion, setReducedMotion }}>
            {children}
        </MotionContext.Provider>
    );
}

export function useMotion() {
    const context = useContext(MotionContext);
    if (context === undefined) {
        throw new Error('useMotion must be used within a MotionProvider');
    }
    return context;
}