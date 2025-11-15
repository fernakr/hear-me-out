'use client';

import { useEffect, useRef } from 'react';
import { useMotion } from './MotionContext';

interface FloatingSuggestion {
  word: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  isNew: boolean;
  hovered: boolean;
}

interface P5SuggestionBackgroundProps {
  suggestions: string[];
  previousSuggestions: string[];
  onSuggestionClick: (word: string) => void;
}

export default function P5SuggestionBackground({
  suggestions,
  previousSuggestions,
  onSuggestionClick
}: P5SuggestionBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<any>(null);
  const suggestionsRef = useRef<string[]>([]);
  const previousSuggestionsRef = useRef<string[]>([]);
  const onSuggestionClickRef = useRef<(word: string) => void>(onSuggestionClick);
  const { reducedMotion } = useMotion();
  const reducedMotionRef = useRef<boolean>(reducedMotion);

  // Update refs when props change
  suggestionsRef.current = suggestions;
  previousSuggestionsRef.current = previousSuggestions;
  onSuggestionClickRef.current = onSuggestionClick;
  reducedMotionRef.current = reducedMotion;

  // Create p5 instance only once
  useEffect(() => {
    if (!containerRef.current) return;

    // Dynamically import p5 to avoid SSR issues
    const loadP5 = async () => {
      const p5 = (await import('p5')).default;

      const sketch = (p: any) => {
        let floatingSuggestions: FloatingSuggestion[] = [];

        p.setup = () => {
          // Create canvas that fills the viewport
          p.createCanvas(p.windowWidth, p.windowHeight);
          p.textAlign(p.CENTER, p.CENTER);

          // Set font to Yomogi (loaded via Next.js font system)
          p.textFont('Yomogi');
          // bold
          p.textStyle(p.BOLD);
        };

        p.draw = () => {
          // Transparent background to let the halftone layer show through
          p.clear();

          // Use current suggestions from refs
          const currentSuggestions = suggestionsRef.current;
          const currentPreviousSuggestions = previousSuggestionsRef.current;
          const allCurrentWords = [...currentSuggestions, ...currentPreviousSuggestions];

          // Limit total words to 40
          const limitedWords = allCurrentWords.slice(0, 40);

          // Update floating suggestions - remove words no longer in limited set
          floatingSuggestions = floatingSuggestions.filter(fs =>
            limitedWords.includes(fs.word)
          );

          // Add new words that aren't already floating, but preserve existing positions
          limitedWords.forEach(word => {
            const existingWord = floatingSuggestions.find(fs => fs.word === word);
            if (!existingWord) {
              const isNewSuggestion = currentSuggestions.includes(word);

              // Try to find a non-overlapping position
              let attempts = 0;
              let x, y;
              let validPosition = false;

              while (!validPosition && attempts < 50) {
                x = p.random(100, p.width - 100);
                y = p.random(100, p.height - 100);

                // Check for collisions with existing suggestions
                validPosition = true;
                for (let existing of floatingSuggestions) {
                  const distance = p.dist(x, y, existing.x, existing.y);
                  const minDistance = 80; // Minimum distance between words
                  if (distance < minDistance) {
                    validPosition = false;
                    break;
                  }
                }
                attempts++;
              }

              // If we couldn't find a valid position after 50 attempts, use random position
              if (!validPosition) {
                x = p.random(100, p.width - 100);
                y = p.random(100, p.height - 100);
              }

              floatingSuggestions.push({
                word,
                x: x,
                y: y,
                vx: p.random(-0.3, 0.3), // Slower movement
                vy: p.random(-0.3, 0.3), // Slower movement
                size: p.random(16, 24),
                opacity: isNewSuggestion ? 0.9 : 0.6,
                isNew: isNewSuggestion,
                hovered: false
              });
            } else {
              // Update the isNew property for existing suggestions
              existingWord.isNew = currentSuggestions.includes(word);
              existingWord.opacity = existingWord.isNew ? 0.9 : 0.6;
            }
          });

          // Update and draw floating suggestions with collision avoidance
          let isAnyWordHovered = false;

          floatingSuggestions.forEach((suggestion, index) => {
            // Only update position if motion is not reduced
            if (!reducedMotionRef.current) {
              // Update position
              const newX = suggestion.x + suggestion.vx;
              const newY = suggestion.y + suggestion.vy;

              // Check for collisions with other suggestions
              for (const other of floatingSuggestions) {
                if (other !== suggestion) {
                  const distance = p.dist(newX, newY, other.x, other.y);
                  const minDistance = 70; // Minimum distance during movement

                  if (distance < minDistance && distance > 0) {
                    // Calculate repulsion force
                    const angle = p.atan2(newY - other.y, newX - other.x);
                    const force = (minDistance - distance) * 0.02;
                    suggestion.vx += p.cos(angle) * force;
                    suggestion.vy += p.sin(angle) * force;

                    // Limit velocity to prevent wild movements
                    const maxSpeed = 0.5;
                    const speed = p.sqrt(suggestion.vx * suggestion.vx + suggestion.vy * suggestion.vy);
                    if (speed > maxSpeed) {
                      suggestion.vx = (suggestion.vx / speed) * maxSpeed;
                      suggestion.vy = (suggestion.vy / speed) * maxSpeed;
                    }
                  }
                }
              }

              // Apply the updated velocity
              suggestion.x += suggestion.vx;
              suggestion.y += suggestion.vy;

              // Bounce off edges with some padding - gentler bouncing
              const padding = 80;
              if (suggestion.x < padding || suggestion.x > p.width - padding) {
                suggestion.vx *= -0.6; // More damping for gentler bounce
                suggestion.x = p.constrain(suggestion.x, padding, p.width - padding);
              }
              if (suggestion.y < padding || suggestion.y > p.height - padding) {
                suggestion.vy *= -0.6; // More damping for gentler bounce
                suggestion.y = p.constrain(suggestion.y, padding, p.height - padding);
              }
            }

            // Check if mouse is hovering
            const mouseDistance = p.dist(p.mouseX, p.mouseY, suggestion.x, suggestion.y);
            p.textSize(suggestion.size); // Set size to measure text width
            const textWidth = p.textWidth(suggestion.word);
            suggestion.hovered = mouseDistance < Math.max(textWidth / 2 + 10, 35);

            // Track if any word is being hovered
            if (suggestion.hovered) {
              isAnyWordHovered = true;
            }

            // Gentle floating effect - slower (only if motion is not reduced)
            const floatOffset = !reducedMotionRef.current ? p.sin(p.millis() * 0.001 + index * 0.1) * 2 : 0; // Slower and smaller offset
            const drawY = suggestion.y + floatOffset;

            // Set text properties
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(suggestion.size + (suggestion.hovered ? 4 : 0));

            // Color scheme
            if (suggestion.isNew) {
              // New suggestions - blue
              const baseColor = suggestion.hovered ?
                [29, 78, 216] : [37, 99, 235]; // blue-700 : blue-600
              p.fill(baseColor[0], baseColor[1], baseColor[2], suggestion.opacity * 255);
            } else {
              // Previous suggestions - gray
              const baseColor = suggestion.hovered ?
                [75, 85, 99] : [107, 114, 128]; // gray-600 : gray-500
              p.fill(baseColor[0], baseColor[1], baseColor[2], suggestion.opacity * 255);
            }

            // Add glow effect when hovered
            if (suggestion.hovered) {
              p.drawingContext.shadowBlur = 15;
              p.drawingContext.shadowColor = suggestion.isNew ?
                'rgba(37, 99, 235, 0.6)' : 'rgba(107, 114, 128, 0.6)';
            } else {
              p.drawingContext.shadowBlur = 0;
            }

            // Draw the text
            p.text(suggestion.word, suggestion.x, drawY);
          });

          // Change cursor based on hover state
          if (isAnyWordHovered) {
            document.body.style.cursor = 'pointer';
          } else {
            document.body.style.cursor = 'default';
          }

          // Reset shadow
          p.drawingContext.shadowBlur = 0;
        };

        p.mousePressed = () => {
          // Only handle clicks if they're not on UI elements
          const clickedElement = document.elementFromPoint(p.mouseX, p.mouseY);
          if (clickedElement && (
            clickedElement.tagName === 'TEXTAREA' ||
            clickedElement.tagName === 'INPUT' ||
            clickedElement.tagName === 'BUTTON' ||
            clickedElement.tagName === 'SELECT' ||
            clickedElement.tagName === 'OPTION' ||
            clickedElement.tagName === 'A' ||
            clickedElement.closest('textarea') ||
            clickedElement.closest('input') ||
            clickedElement.closest('button') ||
            clickedElement.closest('select') ||
            clickedElement.closest('a') ||
            clickedElement.closest('.content-container') || // Exclude entire input area
            clickedElement.closest('.input-interaction-zone') // Exclude specific input zones
          )) {
            return true; // Allow default behavior for UI elements
          }

          // Check if any suggestion was clicked
          let suggestionClicked = false;
          floatingSuggestions.forEach(suggestion => {
            if (suggestion.hovered && !suggestionClicked) {
              onSuggestionClickRef.current(suggestion.word);
              suggestionClicked = true;
            }
          });

          if (suggestionClicked) {
            return false; // Prevent default only if we handled the click
          }
          return true; // Allow default behavior otherwise
        };

        p.windowResized = () => {
          p.resizeCanvas(p.windowWidth, p.windowHeight);
        };
      };

      // Create p5 instance
      if (containerRef.current) {
        p5InstanceRef.current = new p5(sketch, containerRef.current);
      }
    };

    loadP5();

    // Cleanup function
    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
      // Reset cursor when component unmounts
      document.body.style.cursor = 'default';
    };
  }, []); // Empty dependency array - only run once

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10"
      style={{ zIndex: -1 }}
    />
  );
}