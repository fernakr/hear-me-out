'use client';

import { useMotion } from './MotionContext';

interface MotionToggleProps {
    onToggle?: (reducedMotion: boolean) => void;
}

export default function MotionToggle({ onToggle }: MotionToggleProps) {
    const { reducedMotion, setReducedMotion } = useMotion();

    const handleToggle = () => {
        const newValue = !reducedMotion;
        setReducedMotion(newValue);
        onToggle?.(newValue);
    };

    return (
        <div className="fixed top-4 right-4 z-50">
            <label className="mb-0 flex items-center gap-3 cursor-pointer">
                <span className="text-sm font-bold text-blue-600">Reduce Motion</span>
                <div className="relative">
                    <input
                        type="checkbox"
                        checked={reducedMotion}
                        onChange={handleToggle}
                        className="sr-only"
                        aria-label="Toggle reduced motion"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors duration-200 ease-in-out flex items-center ${reducedMotion ? 'bg-blue-600' : 'bg-gray-300'
                        }`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ml-0.5 ${reducedMotion ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                    </div>
                </div>
            </label>
        </div>
    );
}