"use client";

import React from 'react';

export interface HeadingDisplayProps {
  heading: number;
}

/**
 * HeadingDisplay component shows the current aircraft heading
 * with visual compass indicator
 */
export default function HeadingDisplay({ heading }: HeadingDisplayProps) {
  // Format heading to always be 3 digits with leading zeros
  const formattedHeading = heading.toString().padStart(3, '0');
  
  // Convert heading to cardinal direction
  const getCardinalDirection = (heading: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(heading / 45) % 8;
    return directions[index];
  };
  
  return (
    <div className="bg-neutral-800 rounded-lg p-4 flex flex-col items-center">
      <span className="text-sm text-neutral-400 mb-1">Heading</span>
      <span className="text-2xl font-bold">{formattedHeading}° {getCardinalDirection(heading)}</span>
    </div>
  );
} 