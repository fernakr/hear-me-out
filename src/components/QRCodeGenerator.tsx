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
  size = 200,
  className = '' 
}: QRCodeGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [inputText, setInputText] = useState(text);
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
    generateQRCode(inputText);
  }, [inputText, size]);

//   const downloadQRCode = () => {
//     if (qrCodeUrl) {
//       const link = document.createElement('a');
//       link.download = 'qrcode.png';
//       link.href = qrCodeUrl;
//       link.click();
//     }
//   };

  const copyToClipboard = async () => {
    if (canvasRef.current) {
      try {
        canvasRef.current.toBlob((blob) => {
          if (blob) {
            const item = new ClipboardItem({ 'image/png': blob });
            navigator.clipboard.write([item]);
          }
        });
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };

  return (
    <div className={` ${className}`}>
      
      {/* Input Section */}
      {/* <div className="mb-6">
        <label htmlFor="qr-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Enter text or URL:
        </label>
        <textarea
          id="qr-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter text, URL, or any data to generate QR code..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
          rows={3}
        />
      </div> */}

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

      {/* Action Buttons */}
      {/* {qrCodeUrl && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">

          <button
            onClick={copyToClipboard}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Copy to Clipboard
          </button>
        </div>
      )} */}
    </div>
  );
}