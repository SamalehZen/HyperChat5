'use client';
import React, { useRef, useState } from 'react';
import { cn } from '../utils/cn';

interface SpotlightWrapperProps {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  spotlightSize?: number;
  disabled?: boolean;
}

export const SpotlightWrapper: React.FC<SpotlightWrapperProps> = ({
  children,
  className,
  spotlightColor = 'rgba(255, 165, 0, 0.6)',
  spotlightSize = 250,
  disabled = false,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !wrapperRef.current) return;

    const rect = wrapperRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePosition({ x, y });
  };

  const handleMouseEnter = () => {
    if (!disabled) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div
      ref={wrapperRef}
      className={cn('group relative', className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Spotlight border overlay */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300',
          isHovered && !disabled && 'opacity-100'
        )}
        style={{
          background: `radial-gradient(${spotlightSize}px circle at ${mousePosition.x}px ${mousePosition.y}px, ${spotlightColor}, transparent 70%)`,
          mask: 'linear-gradient(rgb(0, 0, 0) 0%, rgb(0, 0, 0) 0%) content-box, linear-gradient(rgb(0, 0, 0) 0%, rgb(0, 0, 0) 0%)',
          maskComposite: 'xor',
          WebkitMask: 'linear-gradient(rgb(0, 0, 0) 0%, rgb(0, 0, 0) 0%) content-box, linear-gradient(rgb(0, 0, 0) 0%, rgb(0, 0, 0) 0%)',
          WebkitMaskComposite: 'xor',
          padding: '2px',
        }}
      />
      
      {/* Rotating border animation */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300',
          'before:spotlight-rotate before:absolute before:inset-0 before:rounded-xl before:p-[2px]',
          'before:bg-gradient-conic before:from-orange-500/20 before:via-amber-500/20 before:to-orange-500/20',
          isHovered && !disabled && 'opacity-100'
        )}
      />
      
      {children}
    </div>
  );
};