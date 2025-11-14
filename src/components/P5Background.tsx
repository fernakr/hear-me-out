'use client';

import { useEffect, useRef } from 'react';
import { useMotion } from './MotionContext';

export default function P5Background() {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<any>(null);
  const { reducedMotion } = useMotion();
  const reducedMotionRef = useRef<boolean>(reducedMotion);

  // Update ref when reducedMotion changes
  reducedMotionRef.current = reducedMotion;

  useEffect(() => {
    if (!containerRef.current) return;

    // Dynamically import p5 to avoid SSR issues
    const loadP5 = async () => {
      const p5 = (await import('p5')).default;

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
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ zIndex: -1 }}
    />
  );
}