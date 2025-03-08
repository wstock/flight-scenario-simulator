"use client";

import React from 'react';

export interface AltitudeDisplayProps {
  altitude: number;
}

/**
 * AltitudeDisplay component shows the current aircraft altitude
 * with visual indicators for climbing/descending
 */
export default function AltitudeDisplay({ altitude }: AltitudeDisplayProps) {
  // Format altitude with commas
  const formattedAltitude = altitude.toLocaleString();
  
  return (
    <div className="bg-neutral-800 rounded-lg p-4 flex flex-col items-center">
      <span className="text-sm text-neutral-400 mb-1">Altitude</span>
      <span className="text-2xl font-bold">{formattedAltitude} ft</span>
    </div>
  );
} 