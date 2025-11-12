'use client';

import { usePathname } from 'next/navigation';
import P5Background from './P5Background';

export default function ClientBackground() {
  const pathname = usePathname();
  
  // Only show particle background on pages other than help
  if (pathname === '/help') {
    return null;
  }
  
  return <P5Background />;
}