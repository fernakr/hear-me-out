'use client';

import { useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();
  const reducedMotionRef = useRef<boolean>(reducedMotion);
  const isMutedRef = useRef<boolean>(isMuted);
  const volumeRef = useRef<number>(volume);
  const audioStartedRef = useRef<boolean>(false);
  const startAudioHandlerRef = useRef<(() => void) | null>(null);

  // Add a global flag to persist audio state across HMR refreshes during development
  useEffect(() => {
    // Check if audio system was already started in a previous component instance
    if (typeof window !== 'undefined' && (window as any).__audioSystemStarted) {
      audioStartedRef.current = true;
      console.log('🔄 Audio system already started - persisting across HMR');
    }
  }, []);

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

          // Schedule first interval sound 1 second after start
          initialTimerRef.current = setTimeout(() => {
            // Check if we're on the final page for the initial sound too
            const isOnFinalPage = window.location.pathname === '/final';
            
            console.log(`🎵 Playing first interval sound... (on final page: ${isOnFinalPage})`);
            
            // Function to schedule next interval sound after current one ends + 30 seconds
            const scheduleNextIntervalSound = () => {
              const currentIsOnFinalPage = window.location.pathname === '/final';
              const audioToPlay = currentIsOnFinalPage ? whatAudioRef.current : whooshAudioRef.current;
              const soundName = currentIsOnFinalPage ? 'What audio (final page)' : 'Whoosh audio';
              
              if (audioToPlay && !isMutedRef.current) {
                console.log(`🎵 Playing ${soundName}...`);
                audioToPlay.currentTime = 0;
                
                // Set up event listener for when this sound ends
                const handleSoundEnd = () => {
                  console.log(`🎵 ${soundName} ended, scheduling next in 30 seconds...`);
                  audioToPlay.removeEventListener('ended', handleSoundEnd);
                  
                  // Schedule next sound 30 seconds after this one ends
                  intervalTimerRef.current = setTimeout(() => {
                    scheduleNextIntervalSound();
                  }, 30000);
                };
                
                audioToPlay.addEventListener('ended', handleSoundEnd);
                
                audioToPlay.play().catch((error: unknown) => {
                  console.log(`❌ ${soundName} play failed:`, error);
                  audioToPlay.removeEventListener('ended', handleSoundEnd);
                  // If play fails, try again in 30 seconds
                  intervalTimerRef.current = setTimeout(() => {
                    scheduleNextIntervalSound();
                  }, 30000);
                });
              }
            };
            
            if (isOnFinalPage) {
              playIntervalSound(whatAudioRef.current, 'What audio (final page - initial)');
              // Set up the duration-based scheduling after initial sound
              if (whatAudioRef.current) {
                const handleInitialEnd = () => {
                  whatAudioRef.current?.removeEventListener('ended', handleInitialEnd);
                  intervalTimerRef.current = setTimeout(() => {
                    scheduleNextIntervalSound();
                  }, 30000);
                };
                whatAudioRef.current.addEventListener('ended', handleInitialEnd);
              }
            } else {
              playIntervalSound(whooshAudioRef.current, 'Whoosh audio (initial)');
              // Set up the duration-based scheduling after initial sound
              if (whooshAudioRef.current) {
                const handleInitialEnd = () => {
                  whooshAudioRef.current?.removeEventListener('ended', handleInitialEnd);
                  intervalTimerRef.current = setTimeout(() => {
                    scheduleNextIntervalSound();
                  }, 30000);
                };
                whooshAudioRef.current.addEventListener('ended', handleInitialEnd);
              }
            }
          }, 1000); // 1 second initial delay

          audioStartedRef.current = true;
          console.log('🎵 Audio system initialized');
          
          // Set global flag for HMR persistence
          if (typeof window !== 'undefined') {
            (window as any).__audioSystemStarted = true;
          }

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
        let canvas: any;

        // Vertex shader (standard)
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

        // Fragment shader with ocean waves and halftone
        const fragSource = `
          precision mediump float;
          varying vec2 vTexCoord;
          uniform float u_time;
          uniform vec2 u_resolution;
          
          // Noise function for organic wave movement
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
          
          // Ocean wave function
          float oceanWave(vec2 uv, float time) {
            float wave = 0.0;
            
            // Multiple wave layers for complexity
            wave += sin(uv.x * 3.0 + time * 0.5) * 0.3;
            wave += sin(uv.x * 7.0 - time * 0.3) * 0.15;
            wave += sin(uv.y * 2.0 + time * 0.4) * 0.2;
            wave += sin(uv.y * 5.0 - time * 0.6) * 0.1;
            
            // Add noise for organic movement
            wave += smoothNoise(uv * 4.0 + time * 0.1) * 0.2;
            wave += smoothNoise(uv * 8.0 - time * 0.05) * 0.1;
            
            return wave;
          }
          
          // Halftone pattern function
          float halftone(vec2 uv, float size, float intensity) {
            vec2 grid = fract(uv * size);
            vec2 center = vec2(0.5, 0.5);
            float dist = distance(grid, center);
            
            // Create halftone dots that vary with intensity
            float dotSize = intensity * 0.4 + 0.1;
            return smoothstep(dotSize, dotSize - 0.1, dist);
          }
          
          void main() {
            vec2 uv = vTexCoord;
            vec2 st = gl_FragCoord.xy / u_resolution.xy;
            
            // Create ocean wave
            float wave = oceanWave(st * 2.0, u_time);
            
            // Normalize wave to 0-1 range
            float waveIntensity = (wave + 1.0) * 0.5;
            
            // Base ocean colors (soft pastels)
            vec3 color1 = vec3(0.9, 0.95, 1.0);    // Very light blue
            vec3 color2 = vec3(0.95, 0.9, 1.0);    // Very light lavender
            vec3 color3 = vec3(0.9, 1.0, 0.95);    // Very light mint
            vec3 color4 = vec3(1.0, 0.95, 0.9);    // Very light peach
            
            // Mix colors based on wave and position
            vec3 baseColor = mix(color1, color2, sin(st.x * 2.0 + u_time * 0.1) * 0.5 + 0.5);
            baseColor = mix(baseColor, color3, sin(st.y * 3.0 + u_time * 0.15) * 0.3 + 0.3);
            baseColor = mix(baseColor, color4, waveIntensity * 0.2);
            
            // Create halftone effect
            float halftoneSize = 20.0 + sin(u_time * 0.1) * 5.0; // Animated halftone size
            float halftonePattern = halftone(st + wave * 0.1, halftoneSize, waveIntensity);
            
            // Secondary halftone layer for more detail
            float halftone2 = halftone(st * 1.5 + wave * 0.05, halftoneSize * 1.5, waveIntensity * 0.7);
            
            // Combine halftone patterns
            float finalHalftone = halftonePattern * 0.7 + halftone2 * 0.3;
            
            // Apply halftone to color with gentle opacity
            vec3 halftoneColor = baseColor * (0.95 + finalHalftone * 0.05);
            
            // Add subtle wave highlighting
            float waveHighlight = smoothstep(0.6, 0.8, waveIntensity) * 0.03;
            halftoneColor += vec3(waveHighlight);
            
            // Ensure colors stay in pastel range
            halftoneColor = clamp(halftoneColor, vec3(0.85), vec3(1.0));
            
            gl_FragColor = vec4(halftoneColor, 1.0);
          }
        `;

        p.setup = () => {
          canvas = p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);

          // Create shader
          waveShader = p.createShader(vertSource, fragSource);
        };

        p.draw = () => {
          if (!waveShader) return; // Safety check

          // Use the shader
          p.shader(waveShader);

          // Pass uniforms to shader - only increment time if motion is not reduced
          const currentTime = reducedMotionRef.current ? 0 : time * 0.02;
          waveShader.setUniform('u_time', currentTime);
          waveShader.setUniform('u_resolution', [p.width, p.height]);

          // Draw a rectangle that covers the entire canvas
          p.rect(-p.width / 2, -p.height / 2, p.width, p.height);

          // Increment time only if motion is not reduced
          if (!reducedMotionRef.current) {
            time++;
          }
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
        clearTimeout(intervalTimerRef.current);
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

  // Handle page transitions for audio changes
  useEffect(() => {
    if (audioStartedRef.current) {
      const isOnFinalPage = pathname === '/final';
      
      // If we just moved to the final page, fade out any playing interval sounds
      if (isOnFinalPage) {
        console.log('🎵 Transitioning to final page - fading out interval sounds...');
        
        // Fade out whoosh if it's currently playing
        if (whooshAudioRef.current && !whooshAudioRef.current.paused) {
          // Inline fade function since we can't reference the inner function
          const fadeOutAudio = (audio: HTMLAudioElement, duration: number = 1000): Promise<void> => {
            return new Promise((resolve) => {
              const startVolume = audio.volume;
              const fadeStep = startVolume / (duration / 50); // 50ms intervals
              
              const fadeInterval = setInterval(() => {
                if (audio.volume > 0) {
                  audio.volume = Math.max(0, audio.volume - fadeStep);
                } else {
                  clearInterval(fadeInterval);
                  audio.pause();
                  audio.volume = startVolume; // Reset volume for next play
                  resolve();
                }
              }, 50);
            });
          };

          fadeOutAudio(whooshAudioRef.current, 500).then(() => {
            console.log('🔇 Whoosh audio faded out');
          });
        }
        
        // Immediately play what.mp3 after a brief delay
        setTimeout(() => {
          if (!isMutedRef.current && whatAudioRef.current) {
            console.log('🎵 Playing what.mp3 for final page transition');
            whatAudioRef.current.currentTime = 0;
            whatAudioRef.current.play().catch((error: unknown) => {
              console.log('❌ What audio transition play failed:', error);
            });
          }
        }, 600); // Small delay to let fade finish
      }
    }
  }, [pathname]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ zIndex: -1 }}
    />
  );
}