"use client";

import React from 'react';

export interface FuelDisplayProps {
  fuel: number;
  className?: string;
}

export default function FuelDisplay({ fuel, className = '' }: FuelDisplayProps) {
  // Format fuel with commas
  const formattedFuel = fuel.toLocaleString();
  
  // Calculate fuel status
  const getFuelStatus = (fuel: number) => {
    if (fuel < 3000) return { text: 'LOW', color: 'text-red-500' };
    if (fuel < 6000) return { text: 'CAUTION', color: 'text-yellow-500' };
    return { text: 'NORMAL', color: 'text-green-500' };
  };
  
  const status = getFuelStatus(fuel);
  
  return (
    <div className={`bg-neutral-800 rounded-lg p-4 flex flex-col items-center ${className}`}>
      <span className="text-sm text-neutral-400 mb-1">Fuel</span>
      <span className="text-2xl font-bold">{formattedFuel} lbs</span>
      <span className={`text-xs mt-1 ${status.color}`}>{status.text}</span>
    </div>
  );
} 