'use client';

import { useRef, useEffect } from 'react';

interface AutoResizeTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  required?: boolean;
  id?: string;
  minHeight?: string;
}

export default function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
  maxLength,
  className = '',
  required = false,
  id,
  minHeight = '40px'
}: AutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    onChange(e.target.value);
    setTimeout(autoResize, 0);
  };

  // Auto-resize when value changes or component mounts
  useEffect(() => {
    autoResize();
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      id={id}
      className={`resize-none overflow-hidden ${className}`}
      value={value}
      onChange={handleChange}
      rows={1}
      maxLength={maxLength}
      placeholder={placeholder}
      style={{ minHeight }}
      required={required}
    />
  );
}