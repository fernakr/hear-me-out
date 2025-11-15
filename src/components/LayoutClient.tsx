'use client';

import P5Background from './P5Background';
import ControlToggles from './MotionToggle';

export default function LayoutClient({ children }: { children: React.ReactNode }) {
    return (
        <>
            {/* Always show the background - it will handle reduced motion internally */}
            <P5Background />
            <ControlToggles />
            {children}
        </>
    );
}