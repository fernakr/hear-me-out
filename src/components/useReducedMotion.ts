import { useEffect, useState } from 'react';

export function useReducedMotion() {
    // Always start with false to ensure consistent SSR/client rendering
    const [reducedMotion, setReducedMotion] = useState(false);

    useEffect(() => {
        // This effect handles the hydration and localStorage sync
        // This is a legitimate use of setState in useEffect for hydration
        const storedPreference = localStorage.getItem('reducedMotion');
        if (storedPreference !== null) {
            const storedValue = storedPreference === 'true';
            setReducedMotion(storedValue);
        } else {
            const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            setReducedMotion(mediaQuery.matches);
        }

        // Set up system preference listener
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const handler = () => {
            // Only update from system preference if no user preference is stored
            if (localStorage.getItem('reducedMotion') === null) {
                setReducedMotion(mediaQuery.matches);
            }
        };

        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    const setReducedMotionWithStorage = (value: boolean) => {
        setReducedMotion(value);
        localStorage.setItem('reducedMotion', value.toString());
    };

    return [reducedMotion, setReducedMotionWithStorage] as const;
}
