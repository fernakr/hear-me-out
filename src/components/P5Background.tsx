'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

export default function P5Background() {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Dynamically import p5 to avoid SSR issues
    const loadP5 = async () => {
      const p5 = (await import('p5')).default;
      
      const sketch = (p: any) => {
        let particles: Particle[] = [];
        const numParticles = 50;

      p.setup = () => {
        // Create canvas that fills the viewport
        p.createCanvas(p.windowWidth, p.windowHeight);
        
        // Initialize particles
        for (let i = 0; i < numParticles; i++) {
          particles.push({
            x: p.random(p.width),
            y: p.random(p.height),
            vx: p.random(-1, 1), // Faster movement for testing
            vy: p.random(-1, 1),
            size: p.random(2, 6), // Larger particles
            opacity: p.random(0.3, 0.7) // More visible opacity
          });
        }

        console.log('P5 canvas initialized with', particles.length, 'particles');
      };

      p.draw = () => {
        // Create a more visible background
        p.background(240, 242, 247); // Slightly darker background for better contrast
        
        // Skip the gradient overlay for now to test visibility
        // Create a simple test: draw larger, more visible particles
        
        // Update and draw particles
        particles.forEach((particle, index) => {
          // Update position
          particle.x += particle.vx;
          particle.y += particle.vy;

          // Wrap around edges
          if (particle.x < 0) particle.x = p.width;
          if (particle.x > p.width) particle.x = 0;
          if (particle.y < 0) particle.y = p.height;
          if (particle.y > p.height) particle.y = 0;

          // More visible pulsing effect
          particle.opacity = 0.3 + 0.4 * p.sin(p.millis() * 0.002 + index * 0.2);

          // Draw particle - make it more visible
          p.fill(100, 116, 139, particle.opacity * 255); // darker blue-gray with better opacity
          p.noStroke();
          p.ellipse(particle.x, particle.y, particle.size * 3); // Make particles larger

          // Draw connections between nearby particles - make them more visible
          particles.slice(index + 1).forEach(otherParticle => {
            const distance = p.dist(particle.x, particle.y, otherParticle.x, otherParticle.y);
            if (distance < 150) { // Increase connection distance
              const alpha = p.map(distance, 0, 150, 0.4, 0); // Make lines more visible
              p.stroke(100, 116, 139, alpha * 255); // darker blue-gray
              p.strokeWeight(1); // Thicker lines
              p.line(particle.x, particle.y, otherParticle.x, otherParticle.y);
            }
          });
        });

        // Add a simple test indicator
        p.fill(255, 0, 0); // Red color for testing
        p.noStroke();
        p.ellipse(50, 50, 20); // Red circle in top-left corner to confirm canvas is working
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
  }, []);  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ zIndex: -1 }}
    />
  );
}