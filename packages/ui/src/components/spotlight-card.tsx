'use client';
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

export const SpotlightWrapper: React.FC<SpotlightWrapperProps> = ({ 
  children, 
  className = '', 
  glowColor = 'orange',
  spotlightSize = 250
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const { base, spread } = glowColorMap[glowColor];

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      el.style.setProperty('--mouse-x', `${x}px`);
      el.style.setProperty('--mouse-y', `${y}px`);
      
      const xp = x / rect.width;
      const hue = base + (xp * spread);
      el.style.setProperty('--hue', hue.toString());
    };

    el.addEventListener('mousemove', handleMouseMove);
    return () => el.removeEventListener('mousemove', handleMouseMove);
  }, [glowColor, spotlightSize]);

  const { base } = glowColorMap[glowColor];

  return (
    <div 
      ref={ref} 
      className={`spotlight-wrapper relative ${className}`}
      style={{
        '--hue': base,
        '--spotlight-size': `${spotlightSize}px`,
      } as React.CSSProperties}
    >
      <div className="spotlight-overlay" />
      {children}
    </div>
  );
};