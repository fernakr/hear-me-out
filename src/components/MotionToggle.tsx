'use client';

import { useMotion } from './MotionContext';
import { useAudio } from './AudioContext';
import ToggleSwitch from './ToggleSwitch';

interface MotionToggleProps {
    onToggle?: (reducedMotion: boolean) => void;
}

export default function ControlToggles({ onToggle }: MotionToggleProps) {
    const { reducedMotion, setReducedMotion } = useMotion();
    const { isMuted, toggleMute } = useAudio();

    const handleMotionToggle = () => {
        const newValue = !reducedMotion;
        setReducedMotion(newValue);
        onToggle?.(newValue);
    };

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col items-end">
            <ToggleSwitch
                label="Reduce Motion"
                checked={reducedMotion}
                onChange={handleMotionToggle}
                ariaLabel="Toggle reduced motion"
            />
            <div className="mt-2">
                <ToggleSwitch
                    label="Mute Audio"
                    checked={isMuted}
                    onChange={toggleMute}
                    ariaLabel="Toggle background audio mute"
                />
            </div>
        </div>
    );
}