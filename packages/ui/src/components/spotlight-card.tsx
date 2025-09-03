import React, { useEffect, useRef, ReactNode } from 'react';

interface SpotlightWrapperProps {
  children: ReactNode;
  className?: string;
  glowColor?: 'blue' | 'purple' | 'green' | 'red' | 'orange';
  spotlightSize?: number;
}

const glowColorMap = {
  blue: { base: 220, spread: 200 },
  purple: { base: 280, spread: 300 },
  green: { base: 120, spread: 200 },
  red: { base: 0, spread: 200 },
  orange: { base: 30, spread: 200 }
};

const SpotlightWrapper: React.FC<SpotlightWrapperProps> = ({ 
  children, 
  className = '', 
  glowColor = 'orange',
  spotlightSize = 250
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncPointer = (e: PointerEvent) => {
      const { clientX: x, clientY: y } = e;
      
      if (wrapperRef.current) {
        wrapperRef.current.style.setProperty('--x', x.toFixed(2));
        wrapperRef.current.style.setProperty('--xp', (x / window.innerWidth).toFixed(2));
        wrapperRef.current.style.setProperty('--y', y.toFixed(2));
        wrapperRef.current.style.setProperty('--yp', (y / window.innerHeight).toFixed(2));
      }
    };

    document.addEventListener('pointermove', syncPointer);
    return () => document.removeEventListener('pointermove', syncPointer);
  }, []);

  const { base, spread } = glowColorMap[glowColor];

  const getInlineStyles = () => {
    return {
      '--base': base,
      '--spread': spread,
      '--radius': '12',
      '--border': '2',
      '--size': spotlightSize.toString(),
      '--border-size': 'calc(var(--border, 2) * 1px)',
      '--spotlight-size': 'calc(var(--size, 250) * 1px)',
      '--hue': 'calc(var(--base) + (var(--xp, 0) * var(--spread, 0)))',
      position: 'relative' as const,
      touchAction: 'none' as const,
    };
  };

  const spotlightStyles = `
    [data-spotlight]::before,
    [data-spotlight]::after {
      pointer-events: none;
      content: "";
      position: absolute;
      inset: calc(var(--border-size) * -1);
      border: var(--border-size) solid transparent;
      border-radius: calc(var(--radius) * 1px);
      background-attachment: fixed;
      background-size: calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)));
      background-repeat: no-repeat;
      background-position: 50% 50%;
      mask: linear-gradient(transparent, transparent), linear-gradient(white, white);
      mask-clip: padding-box, border-box;
      mask-composite: intersect;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    [data-spotlight]:hover::before,
    [data-spotlight]:hover::after {
      opacity: 1;
    }
    
    [data-spotlight]::before {
      background-image: radial-gradient(
        calc(var(--spotlight-size) * 0.75) calc(var(--spotlight-size) * 0.75) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 50) * 1%) / 0.8), transparent 100%
      );
      filter: brightness(1.5);
    }
    
    [data-spotlight]::after {
      background-image: radial-gradient(
        calc(var(--spotlight-size) * 0.5) calc(var(--spotlight-size) * 0.5) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(0 100% 100% / 0.3), transparent 100%
      );
    }
    
    [data-spotlight] [data-spotlight-inner] {
      position: absolute;
      inset: 0;
      will-change: filter;
      border-radius: calc(var(--radius) * 1px);
      filter: blur(calc(var(--border-size) * 5));
      background: none;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    [data-spotlight]:hover [data-spotlight-inner] {
      opacity: 0.5;
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: spotlightStyles }} />
      <div
        ref={wrapperRef}
        data-spotlight
        style={getInlineStyles()}
        className={`relative ${className}`}
      >
        <div ref={innerRef} data-spotlight-inner></div>
        {children}
      </div>
    </>
  );
};

export { SpotlightWrapper };