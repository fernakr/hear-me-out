'use client';

import { useRef, useEffect } from 'react';
import { useMotion } from './MotionContext';
import { useAudio } from './AudioContext';

export default function P5Background() {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<any>(null);
  const calmAudioRef = useRef<HTMLAudioElement | null>(null); // For continuous calm.mp3
  const whatAudioRef = useRef<HTMLAudioElement | null>(null); // For timed what.mp3
  const whooshAudioRef = useRef<HTMLAudioElement | null>(null); // For alternating whoosh.mp3
  const intervalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialTimerRef = useRef<NodeJS.Timeout | null>(null);
  const calmWatchdogRef = useRef<NodeJS.Timeout | null>(null);
  const { reducedMotion } = useMotion();
  const { isMuted, volume } = useAudio();
  const reducedMotionRef = useRef<boolean>(reducedMotion);
  const isMutedRef = useRef<boolean>(isMuted);
  const volumeRef = useRef<number>(volume);
  const audioStartedRef = useRef<boolean>(false);
  const startAudioHandlerRef = useRef<(() => void) | null>(null);

  // Update refs when values change
  reducedMotionRef.current = reducedMotion;
  isMutedRef.current = isMuted;
  volumeRef.current = volume;

  useEffect(() => {
    if (!containerRef.current) return;

    // Dynamically import p5 to avoid SSR issues
    const loadP5 = async () => {
      const p5 = (await import('p5')).default;

      // DRY helper function for creating audio elements
      const createAudioElement = (src: string, loop: boolean = false, volumeMultiplier: number = 1): HTMLAudioElement => {
        const audio = new Audio(src);
        audio.loop = loop;
        audio.volume = volumeRef.current * volumeMultiplier;
        return audio;
      };

      // Helper function to play interval sounds with error handling
      const playIntervalSound = (audio: HTMLAudioElement | null, soundName: string) => {
        if (audio && !isMutedRef.current) {
          console.log(`🎵 Playing ${soundName}...`);
          audio.currentTime = 0; // Reset to start
          audio.play().catch((error: unknown) => {
            console.log(`❌ ${soundName} interval play failed:`, error);
          }).then(() => {
            console.log(`✅ ${soundName} played successfully`);
          });
        } else if (isMutedRef.current) {
          console.log(`🔇 ${soundName} blocked - audio is muted`);
        } else {
          console.log(`❌ ${soundName} blocked - audio element not found`);
        }
      };

      // Initialize dual audio system with DRY approach
      calmAudioRef.current = createAudioElement('/calm.mp3', true, 0.7); // Continuous, quieter
      whatAudioRef.current = createAudioElement('/what.mp3', false, 1.0); // Interval sound
      whooshAudioRef.current = createAudioElement('/whoosh.mp3', false, 1.0); // Alternating interval sound

      // Add event listeners to debug calm audio looping
      if (calmAudioRef.current) {
        calmAudioRef.current.addEventListener('ended', () => {
          console.log('🔄 Calm audio ended - should restart due to loop');
        });
        calmAudioRef.current.addEventListener('pause', () => {
          console.log('⏸ Calm audio paused');
        });
        calmAudioRef.current.addEventListener('play', () => {
          console.log('▶️ Calm audio playing');
        });
        calmAudioRef.current.addEventListener('error', (e) => {
          console.log('❌ Calm audio error:', e);
        });
      }

      // Add user interaction handler to start audio
      const startAudioOnInteraction = () => {
        if (!audioStartedRef.current && !isMutedRef.current) {
          console.log('🎵 Starting audio system...');

          // Start calm audio immediately
          if (calmAudioRef.current) {
            console.log('🎵 Starting calm.mp3...');
            calmAudioRef.current.play().catch((error: unknown) => {
              console.log('❌ Calm audio play failed:', error);
            }).then(() => {
              console.log('✅ Calm audio started successfully');
            });
          }

          // Schedule first interval sound (what.mp3) 10 seconds after start
          initialTimerRef.current = setTimeout(() => {
            console.log('🎵 Playing first interval sound (what.mp3)...');
            playIntervalSound(whatAudioRef.current, 'What audio');

            // Then play interval sounds every 45 seconds
            intervalTimerRef.current = setInterval(() => {
              // Check if we're on the final page - if so, always play what.mp3
              // Otherwise, always play whoosh.mp3 for the alternating intervals
              const isOnFinalPage = window.location.pathname === '/final';

              console.log(`🎵 Playing interval sound... (on final page: ${isOnFinalPage})`);

              if (isOnFinalPage) {
                playIntervalSound(whatAudioRef.current, 'What audio (final page)');
              } else {
                playIntervalSound(whooshAudioRef.current, 'Whoosh audio');
              }
            }, 45000); // 45 seconds = 45000ms
          }, 10000); // 10 seconds initial delay

          audioStartedRef.current = true;
          console.log('🎵 Audio system initialized');

          // Set up a periodic check to ensure calm audio keeps playing
          calmWatchdogRef.current = setInterval(() => {
            if (calmAudioRef.current && !isMutedRef.current && audioStartedRef.current) {
              if (calmAudioRef.current.paused) {
                console.log('🔄 Calm audio stopped - restarting...');
                calmAudioRef.current.play().catch((error: unknown) => {
                  console.log('❌ Calm audio restart failed:', error);
                });
              }
            }
          }, 5000); // Check every 5 seconds

          // Remove listeners after first successful play
          document.removeEventListener('click', startAudioOnInteraction);
          document.removeEventListener('keydown', startAudioOnInteraction);
          document.removeEventListener('touchstart', startAudioOnInteraction);
        }
      };

      // Store handler reference for cleanup
      startAudioHandlerRef.current = startAudioOnInteraction;

      // Add event listeners for user interactions
      document.addEventListener('click', startAudioOnInteraction);
      document.addEventListener('keydown', startAudioOnInteraction);
      document.addEventListener('touchstart', startAudioOnInteraction);

      const sketch = (p: any) => {
        let time = 0;
        let waveShader: any;
        let mouseX = 0.5;
        let mouseY = 0.5;
        let lerpedMouseX = 0.5;
        let lerpedMouseY = 0.5;
        let mouseInfluence = 0.0;

        // Simple vertex shader
        const vertSource = `
            attribute vec3 aPosition;
            attribute vec2 aTexCoord;
            varying vec2 vTexCoord;
            
            void main() {
              vTexCoord = aTexCoord;
              vec4 positionVec4 = vec4(aPosition, 1.0);
              positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
              gl_Position = positionVec4;
            }
          `;

        // Enhanced fragment shader with more global rippling and subtle continuous mouse distortion
        const fragSource = `
            precision mediump float;
            varying vec2 vTexCoord;
            uniform float u_time;
            uniform vec2 u_resolution;
            uniform vec2 u_mouse;
            uniform float u_mouseInfluence;
            
            // Simple noise function
            float noise(vec2 st) {
              return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }
            
            // Smooth noise
            float smoothNoise(vec2 st) {
              vec2 i = floor(st);
              vec2 f = fract(st);
              
              float a = noise(i);
              float b = noise(i + vec2(1.0, 0.0));
              float c = noise(i + vec2(0.0, 1.0));
              float d = noise(i + vec2(1.0, 1.0));
              
              vec2 u = f * f * (3.0 - 2.0 * f);
              
              return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
            }
            
            // Subtle continuous mouse distortion field
            float mouseDistortion(vec2 uv, vec2 mousePos, float time) {
              float dist = distance(uv, mousePos);
              
              // Continuous field that doesn't fade - always present when mouse has been active
              float field1 = sin(time * 0.8 + dist * 4.0) * exp(-dist * 1.5) * 0.15;
              float field2 = cos(time * 0.6 + dist * 3.0) * exp(-dist * 2.0) * 0.12;
              float field3 = sin(time * 1.0 + dist * 5.0) * exp(-dist * 2.5) * 0.08;
              
              // Add some gentle ripples that continue radiating
              float ripple = sin(dist * 12.0 - time * 2.0) * exp(-dist * 1.8) * 0.1;
              
              return field1 + field2 + field3 + ripple;
            }
            
            // Enhanced global background ripples
            float globalRipples(vec2 uv, float time) {
              float ripples = 0.0;
              
              // Multiple ripple sources across the canvas
              vec2 center1 = vec2(0.5, 0.5);
              float dist1 = length(uv - center1);
              ripples += sin(dist1 * 8.0 - time * 1.2) * exp(-dist1 * 1.5) * 0.3;
              
              vec2 center2 = vec2(0.2, 0.8) + sin(time * 0.4) * 0.1;
              float dist2 = length(uv - center2);
              ripples += sin(dist2 * 12.0 - time * 1.5) * exp(-dist2 * 2.0) * 0.25;
              
              vec2 center3 = vec2(0.8, 0.3) + cos(time * 0.3) * 0.1;
              float dist3 = length(uv - center3);
              ripples += sin(dist3 * 10.0 - time * 1.0) * exp(-dist3 * 1.8) * 0.2;
              
              vec2 center4 = vec2(0.7, 0.7) + sin(time * 0.5) * 0.08;
              float dist4 = length(uv - center4);
              ripples += sin(dist4 * 15.0 - time * 1.8) * exp(-dist4 * 2.5) * 0.18;
              
              // Add traveling waves
              ripples += sin(uv.x * 4.0 + time * 0.8) * 0.12;
              ripples += sin(uv.y * 3.0 - time * 0.6) * 0.1;
              ripples += sin((uv.x + uv.y) * 5.0 + time * 0.7) * 0.08;
              
              return ripples;
            }
            
            // Ocean-like base waves
            float oceanWaves(vec2 uv, float time) {
              float wave = 0.0;
              
              // Layered wave patterns
              wave += sin(uv.x * 3.0 + time * 0.4) * 0.2;
              wave += sin(uv.x * 6.0 - time * 0.3) * 0.15;
              wave += sin(uv.y * 2.5 + time * 0.35) * 0.18;
              wave += sin(uv.y * 4.5 - time * 0.4) * 0.12;
              
              // Organic noise movement
              wave += smoothNoise(uv * 4.0 + time * 0.06) * 0.2;
              wave += smoothNoise(uv * 8.0 - time * 0.04) * 0.1;
              
              return wave;
            }
            
            // Halftone dots
            float halftone(vec2 uv, float size, float intensity) {
              vec2 grid = fract(uv * size);
              vec2 center = vec2(0.5);
              float dist = distance(grid, center);
              float dotSize = intensity * 0.4 + 0.1;
              return smoothstep(dotSize, dotSize - 0.1, dist);
            }
            
            void main() {
              vec2 uv = vTexCoord;
              
              // Create continuous mouse distortion field (always active, not dependent on mouseInfluence)
              float mouseField = mouseDistortion(uv, u_mouse, u_time);
              
              // Enhanced global ripple system
              float globalPattern = globalRipples(uv, u_time);
              
              // Base ocean waves
              float oceanPattern = oceanWaves(uv, u_time);
              
              // Combine all effects with mouse field being subtle but persistent
              float totalEffect = oceanPattern + globalPattern * 0.8 + mouseField * 1.5;
              
              // Normalize and smooth the effect
              float effectIntensity = (totalEffect + 1.5) * 0.4;
              effectIntensity = clamp(effectIntensity, 0.0, 1.0);
              
              // Rich vibrant color palette with lots of pinky purples - back to vibrant version
              vec3 color1 = vec3(0.9, 0.7, 1.0);        // Rich pinky purple
              vec3 color2 = vec3(1.0, 0.75, 0.95);      // Bright pink
              vec3 color3 = vec3(0.85, 0.7, 1.0);       // Deep lavender
              vec3 color4 = vec3(1.0, 0.8, 0.9);        // Rose pink
              vec3 color5 = vec3(0.95, 0.65, 1.0);      // Vibrant magenta
              vec3 color6 = vec3(0.8, 0.85, 1.0);       // Periwinkle blue
              vec3 color7 = vec3(1.0, 0.7, 0.85);       // Coral pink
              vec3 color8 = vec3(0.75, 0.8, 1.0);       // Soft blue purple
              vec3 color9 = vec3(1.0, 0.85, 0.8);       // Peach pink
              vec3 color10 = vec3(0.8, 0.75, 1.0);      // Purple blue
              
              // Much more dynamic color mixing with pinky purple focus
              float colorMixX = sin(uv.x * 4.0 + u_time * 0.15) * 0.5 + 0.5;
              float colorMixY = sin(uv.y * 3.5 + u_time * 0.18) * 0.5 + 0.5;
              float colorMixTime = sin(u_time * 0.12) * 0.5 + 0.5;
              float colorMixDiag = sin((uv.x + uv.y) * 3.0 + u_time * 0.2) * 0.5 + 0.5;
              
              // Start with pinky purple base
              vec3 baseColor = mix(color1, color2, colorMixX);
              baseColor = mix(baseColor, color3, colorMixY * 0.9);
              baseColor = mix(baseColor, color5, colorMixTime * 0.7);
              baseColor = mix(baseColor, color7, colorMixDiag * 0.6);
              
              // Mouse area gets rich pinky purple enhancement
              float mouseDistance = distance(uv, u_mouse);
              float mouseProximity = exp(-mouseDistance * 1.8);
              baseColor = mix(baseColor, color4, mouseProximity * 1.0);
              baseColor = mix(baseColor, color1, mouseProximity * 0.8);
              
              // Global effects add more pinky purple variation
              float normalizedEffect = clamp((effectIntensity - 0.1) * 3.0, 0.0, 1.0);
              baseColor = mix(baseColor, color5, normalizedEffect * 0.9);
              baseColor = mix(baseColor, color3, abs(globalPattern) * 0.8);
              
              // Add dynamic pinky purple zones
              float zoneEffect1 = sin(uv.x * 6.0 + u_time * 0.25) * 0.5 + 0.5;
              float zoneEffect2 = cos(uv.y * 5.0 - u_time * 0.3) * 0.5 + 0.5;
              float spiralEffect = sin(atan(uv.y - 0.5, uv.x - 0.5) * 3.0 + u_time * 0.4) * 0.5 + 0.5;
              
              baseColor = mix(baseColor, color2, zoneEffect1 * 0.6);
              baseColor = mix(baseColor, color10, zoneEffect2 * 0.5);
              baseColor = mix(baseColor, color6, spiralEffect * 0.4);
              
              // Add extra pinky purple layers for richness
              float extraPink1 = sin(uv.x * uv.y * 20.0 + u_time * 0.1) * 0.5 + 0.5;
              float extraPink2 = cos(length(uv - vec2(0.5)) * 8.0 + u_time * 0.15) * 0.5 + 0.5;
              baseColor = mix(baseColor, color9, extraPink1 * 0.3);
              baseColor = mix(baseColor, color8, extraPink2 * 0.4);
              
              // Enhanced halftone pattern that enhances colors instead of graying them
              float halftoneSize = 18.0 + sin(u_time * 0.15) * 3.0 + totalEffect * 6.0;
              float halftonePattern = halftone(uv + totalEffect * 0.12, halftoneSize, effectIntensity);
              
              // Secondary halftone layer
              float halftone2 = halftone(uv * 1.2 + mouseField * 0.2, halftoneSize * 1.1, effectIntensity * 0.9);
              
              // Combine halftone patterns
              float finalHalftone = halftonePattern * 0.7 + halftone2 * 0.3;
              
              // Apply halftone as color enhancement instead of gray overlay
              // Use additive blending to brighten colors rather than darken
              vec3 finalColor = baseColor + baseColor * finalHalftone * 0.15;
              
              // Subtle highlights for mouse area and wave peaks
              float mouseGlow = mouseProximity * 0.08;
              float waveHighlight = smoothstep(0.3, 0.7, effectIntensity) * 0.06;
              finalColor += vec3(mouseGlow + waveHighlight);
              
              // Ensure vibrant colors with no gray bleed-through
              finalColor = clamp(finalColor, vec3(0.75, 0.7, 0.85), vec3(1.0));
              
              gl_FragColor = vec4(finalColor, 1.0);
            }
          `;

        p.setup = () => {
          p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);

          // Create shader with error handling
          try {
            waveShader = p.createShader(vertSource, fragSource);
            console.log('Shader created successfully');
          } catch (error) {
            console.error('Failed to create shader:', error);
            waveShader = null;
          }
        };

        p.draw = () => {
          // Fallback rendering if shader fails to load
          if (!waveShader) {
            // Simple fallback background with basic effects
            p.background(240, 245, 255, 255); // Light pastel blue background

            // Add some simple animated effects without shader
            const currentTime = reducedMotionRef.current ? 0 : time * 0.02;

            // Simple animated gradient overlay
            for (let i = 0; i < 20; i++) {
              const alpha = 10 + Math.sin(currentTime + i * 0.5) * 5;
              p.fill(220 + i, 230 + i, 250, alpha);
              p.noStroke();
              const size = 50 + Math.sin(currentTime * 0.5 + i) * 20;
              const x = (Math.sin(currentTime * 0.1 + i) * p.width / 4);
              const y = (Math.cos(currentTime * 0.15 + i) * p.height / 4);
              p.ellipse(x, y, size, size);
            }

            // Mouse effects fallback
            if (mouseInfluence > 0.1) {
              const mouseScreenX = mouseX * p.width - p.width / 2;
              const mouseScreenY = mouseY * p.height - p.height / 2;

              for (let i = 0; i < 5; i++) {
                const alpha = mouseInfluence * 20 * (1 - i * 0.2);
                p.fill(200, 220, 255, alpha);
                p.noStroke();
                const size = 30 + i * 15;
                p.ellipse(mouseScreenX, mouseScreenY, size, size);
              }
            }

            // Increment time for animation
            if (!reducedMotionRef.current) {
              time++;
            }
            return;
          }

          // Use the shader
          p.shader(waveShader);

          // Simple mouse influence decay
          if (mouseInfluence > 0) {
            mouseInfluence -= 0.01; // Gradual decay
            mouseInfluence = Math.max(0, mouseInfluence);
          }

          // Smooth mouse position lerping (adjust lerp factor for responsiveness)
          const lerpFactor = 0.08; // Lower = smoother, higher = more responsive
          lerpedMouseX += (mouseX - lerpedMouseX) * lerpFactor;
          lerpedMouseY += (mouseY - lerpedMouseY) * lerpFactor;

          // Pass uniforms to shader - only increment time if motion is not reduced
          const currentTime = reducedMotionRef.current ? 0 : time * 0.02;
          waveShader.setUniform('u_time', currentTime);
          waveShader.setUniform('u_resolution', [p.width, p.height]);
          waveShader.setUniform('u_mouse', [lerpedMouseX, lerpedMouseY]); // Use lerped position
          waveShader.setUniform('u_mouseInfluence', mouseInfluence);

          // Draw a rectangle that covers the entire canvas
          p.rect(-p.width / 2, -p.height / 2, p.width, p.height);

          // Increment time only if motion is not reduced
          if (!reducedMotionRef.current) {
            time++;
          }
        };

        p.mouseMoved = () => {
          // ✅ WORKING MOUSE TRACKING SOLUTION - DO NOT CHANGE! ✅
          // This coordinate mapping works correctly for WebGL shader coordinates:
          // - X: Direct mapping (0 to 1 from left to right)  
          // - Y: MUST BE FLIPPED with (1.0 - rawY/height) for proper shader mapping
          // - WebGL fragment coords have origin at bottom-left, but p5 mouse has origin at top-left
          const rawX = p.mouseX;
          const rawY = p.mouseY;
          
          // Normalize to 0-1 range and flip Y coordinate for WebGL shader
          mouseX = rawX / p.width;
          mouseY = 1.0 - (rawY / p.height); // Flip Y: 0 at top becomes 1, height at bottom becomes 0
          
          // Clamp to ensure we stay within bounds
          mouseX = Math.max(0, Math.min(1, mouseX));
          mouseY = Math.max(0, Math.min(1, mouseY));
          
          // Set mouse influence
          mouseInfluence = 1.0;
          
          // Store coordinates globally for testing
          if (typeof window !== 'undefined') {
            (window as typeof window & { lastMouseCoords?: { x: number; y: number } }).lastMouseCoords = { x: mouseX, y: mouseY };
          }
          
          console.log(`Mouse at: screen(${rawX.toFixed(1)}, ${rawY.toFixed(1)}) normalized(${mouseX.toFixed(3)}, ${mouseY.toFixed(3)}) canvas(${p.width}x${p.height})`);
        };

        p.mouseExited = () => {
          // Gradually reduce influence when mouse leaves
          mouseInfluence = 0.5;
          console.log('Mouse exited canvas');
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
      // Clean up calm audio
      if (calmAudioRef.current) {
        calmAudioRef.current.pause();
        calmAudioRef.current = null;
      }
      // Clean up what audio
      if (whatAudioRef.current) {
        whatAudioRef.current.pause();
        whatAudioRef.current = null;
      }
      // Clean up whoosh audio
      if (whooshAudioRef.current) {
        whooshAudioRef.current.pause();
        whooshAudioRef.current = null;
      }
      // Clear timers/intervals
      if (initialTimerRef.current) {
        clearTimeout(initialTimerRef.current);
        initialTimerRef.current = null;
      }
      if (intervalTimerRef.current) {
        clearInterval(intervalTimerRef.current);
        intervalTimerRef.current = null;
      }
      if (calmWatchdogRef.current) {
        clearInterval(calmWatchdogRef.current);
        calmWatchdogRef.current = null;
      }
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
      // Clean up event listeners
      if (startAudioHandlerRef.current) {
        document.removeEventListener('click', startAudioHandlerRef.current);
        document.removeEventListener('keydown', startAudioHandlerRef.current);
        document.removeEventListener('touchstart', startAudioHandlerRef.current);
      }
    };
  }, []);

  // Handle mute/unmute changes
  useEffect(() => {
    // DRY helper for audio control
    const controlAudio = (audioRef: React.MutableRefObject<HTMLAudioElement | null>, shouldPlay: boolean = false) => {
      if (audioRef.current) {
        if (isMuted) {
          console.log('🔇 Pausing audio due to mute');
          audioRef.current.pause();
        } else if (shouldPlay && audioStartedRef.current) {
          console.log('🔊 Resuming audio after unmute');
          audioRef.current.play().catch((error: unknown) => {
            console.log('❌ Audio resume failed:', error);
          });
        }
      }
    };

    // Control all audio tracks
    controlAudio(calmAudioRef, true); // Resume calm audio when unmuted
    controlAudio(whatAudioRef, false); // Interval sounds resume on their schedule
    controlAudio(whooshAudioRef, false); // Interval sounds resume on their schedule

    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Handle volume changes
  useEffect(() => {
    // DRY helper for volume control
    const setAudioVolume = (audioRef: React.MutableRefObject<HTMLAudioElement | null>, volumeMultiplier: number = 1) => {
      if (audioRef.current) {
        audioRef.current.volume = volume * volumeMultiplier;
      }
    };

    // Apply volume to all audio tracks
    setAudioVolume(calmAudioRef, 0.7); // Maintain background layer quietness
    setAudioVolume(whatAudioRef, 1.0); // Full volume for interval sounds
    setAudioVolume(whooshAudioRef, 1.0); // Full volume for interval sounds

    volumeRef.current = volume;
  }, [volume]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ zIndex: -1 }}
    />
  );
}