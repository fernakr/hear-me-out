'use client';

import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeGeneratorProps {
  text?: string;
  size?: number;
  className?: string;
}

export default function QRCodeGenerator({ 
  text = 'Hello World!', 
  size = 400,
  className = '' 
}: QRCodeGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateQRCode = async (value: string) => {
    if (!value.trim()) return;
    
    setIsGenerating(true);
    try {
      // Generate QR code as data URL
      const url = await QRCode.toDataURL(value, {
        width: size,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCodeUrl(url);

      // Also render to canvas if available
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, value, {
          width: size,
          margin: 1,
        });
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    generateQRCode(text);
  }, [text, size]);



  return (
    <div className={` ${className}`}>

      {/* QR Code Display */}
      <div className="flex flex-col items-center">
        {isGenerating ? (
          <div className="flex items-center justify-center" style={{ width: size, height: size }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : qrCodeUrl ? (
          <div className="relative group">
            <img
              src={qrCodeUrl}
              alt="Generated QR Code"
              className=""
              width={size}
              height={size}
            />
            {/* Hidden canvas for clipboard functionality */}
            <canvas
              ref={canvasRef}
              style={{ display: 'none' }}
              width={size}
              height={size}
            />
          </div>
        ) : (
          <div 
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400"
            style={{ width: size, height: size }}
          >
            Enter text to generate QR code
          </div>
        )}
      </div>


    </div>
  );
}