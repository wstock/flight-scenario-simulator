"use client";

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ScenarioGenerator from '@/components/scenario/ScenarioGenerator';

export default function GeneratePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if not authenticated
  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Generate Custom Scenario</h1>
        
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 bg-blue-900/30 p-6 rounded-lg border border-blue-700">
            <h2 className="text-xl font-semibold mb-3">How It Works</h2>
            <p className="mb-4">
              Describe the flight scenario you want to simulate, and our AI will generate a complete scenario with:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Realistic weather conditions</li>
              <li>Aircraft parameters and initial state</li>
              <li>Decision points and branching paths</li>
              <li>ATC and crew communications</li>
              <li>Potential challenges and emergencies</li>
            </ul>
            <p>
              Be as specific or general as you like. For example: "Thunderstorms on approach at Malaga" or 
              "Engine failure during cruise over the Atlantic with moderate turbulence."
            </p>
          </div>
          
          <ScenarioGenerator />
        </div>
      </div>
    </div>
  );
} 