'use client';

import { useRef, useEffect } from 'react';

interface AutoResizeTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  minWords?: number;
  maxWords?: number;
  className?: string;
  required?: boolean;
  id?: string;
  minHeight?: string;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export default function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
  maxLength,
  minWords,
  maxWords,
  className = '',
  required = false,
  id,
  minHeight = '40px',
  onKeyDown
}: AutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper function to count words
  const getWordCount = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      // add extra space to avoid scrollbar flicker
      textareaRef.current.style.height = (textareaRef.current.scrollHeight + 2) + 'px';
      // ensure padding is considered
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;

    // Check word limits if specified
    if (maxWords !== undefined) {
      const wordCount = getWordCount(newValue);
      if (wordCount > maxWords) {
        // Prevent input if word limit exceeded
        return;
      }
    }

    onChange(newValue);
    setTimeout(autoResize, 0);
  };

  // Auto-resize when value changes or component mounts
  useEffect(() => {
    autoResize();
  }, [value]);

  // On Android, allow manual vertical resize for better compatibility
  // Use resize: vertical and remove overflow-hidden for mobile
  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
  const textareaClass = isAndroid
    ? `resize-vertical ${className}`
    : `resize-none overflow-hidden ${className}`;

  return (
    <textarea
      ref={textareaRef}
      id={id}
      className={textareaClass}
      value={value}
      onChange={handleChange}
      onKeyDown={onKeyDown}
      rows={1}
      maxLength={maxLength}
      placeholder={placeholder}
      style={{ minHeight }}
      required={required}
    />
  );
}