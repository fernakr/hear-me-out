'use client';

import Link from 'next/link';

interface StartOverButtonProps {
  className?: string;
  text?: string;
}

export default function StartOverButton({ 
  className = '', 
  text = 'Start Over' 
}: StartOverButtonProps) {
  return (
    <Link 
      href="/" 
      className={`hover:underline ${className}`}
    >
      ← {text}
    </Link>
  );
}