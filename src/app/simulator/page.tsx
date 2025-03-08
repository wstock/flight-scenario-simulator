"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import NavigationDisplay from "@/components/navigation/NavigationDisplay";
import AltitudeDisplay from "@/components/dashboard/AltitudeDisplay";
import FuelDisplay from "@/components/dashboard/FuelDisplay";
import HeadingDisplay from "@/components/dashboard/HeadingDisplay";
import ScenarioTimeDisplay from "@/components/dashboard/ScenarioTimeDisplay";
import CommunicationsHistory from "@/components/communications/CommunicationsHistory";
import DecisionOptions from "@/components/decisions/DecisionOptions";
import { processScenarioTick, pauseScenario, resumeScenario } from "@/lib/scenario/realTimeAdaptation";
import { getCurrentParameters } from "@/lib/scenario/parameterSimulation";
import { toast } from "react-toastify";

export default function SimulatorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [parameters, setParameters] = useState({
    altitude: 30000,
    heading: 270,
    speed: 450,
    fuel: 15000,
    latitude: 37.6213,
    longitude: -122.3790,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Check for active scenario
  useEffect(() => {
    const checkActiveScenario = async () => {
      try {
        // This would be replaced with actual API call to get active scenario
        const mockActiveScenario = localStorage.getItem("activeScenarioId");
        if (mockActiveScenario) {
          setActiveScenarioId(mockActiveScenario);
          
          // Get initial parameters
          if (mockActiveScenario) {
            const params = await getCurrentParameters(mockActiveScenario);
            if (params) {
              setParameters({
                altitude: params.altitude,
                heading: params.heading,
                speed: params.speed,
                fuel: params.fuel,
                latitude: params.latitude,
                longitude: params.longitude,
              });
            }
          }
        }
      } catch (error) {
        console.error("Error checking active scenario:", error);
        toast.error("Failed to load active scenario");
      }
    };

    checkActiveScenario();
  }, []);

  // Scenario tick effect
  useEffect(() => {
    if (!activeScenarioId || isPaused) return;

    const tickInterval = setInterval(async () => {
      try {
        await processScenarioTick(activeScenarioId, 1);
        
        // Update parameters
        const params = await getCurrentParameters(activeScenarioId);
        if (params) {
          setParameters({
            altitude: params.altitude,
            heading: params.heading,
            speed: params.speed,
            fuel: params.fuel,
            latitude: params.latitude,
            longitude: params.longitude,
          });
        }
      } catch (error) {
        console.error("Error processing scenario tick:", error);
      }
    }, 1000);

    return () => clearInterval(tickInterval);
  }, [activeScenarioId, isPaused]);

  const handlePauseResume = async () => {
    if (!activeScenarioId) return;
    
    try {
      if (isPaused) {
        await resumeScenario(activeScenarioId);
        setIsPaused(false);
        toast.info("Scenario resumed");
      } else {
        await pauseScenario(activeScenarioId);
        setIsPaused(true);
        toast.info("Scenario paused");
      }
    } catch (error) {
      console.error("Error toggling pause state:", error);
      toast.error("Failed to toggle pause state");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      <div className="container mx-auto p-4">
        {!activeScenarioId ? (
          <div className="flex flex-col items-center justify-center h-[80vh]">
            <h1 className="text-3xl font-bold mb-6">No Active Scenario</h1>
            <p className="mb-4">Please select a scenario to begin the simulation.</p>
            <button
              onClick={() => router.push("/scenarios")}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Browse Scenarios
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-4">
            {/* Top Row - Dashboard */}
            <div className="col-span-12 flex justify-between items-center mb-4">
              <div className="flex space-x-6">
                <AltitudeDisplay altitude={parameters.altitude} />
                <HeadingDisplay heading={parameters.heading} />
                <FuelDisplay fuel={parameters.fuel} />
              </div>
              <div className="flex items-center space-x-4">
                <ScenarioTimeDisplay scenarioId={activeScenarioId} />
                <button
                  onClick={handlePauseResume}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  {isPaused ? "Resume" : "Pause"}
                </button>
              </div>
            </div>

            {/* Middle Row - Navigation Display and Communications */}
            <div className="col-span-8 bg-neutral-800 rounded-lg p-4 h-[60vh]">
              <NavigationDisplay 
                scenarioId={activeScenarioId}
                initialPosition={{ 
                  latitude: parameters.latitude, 
                  longitude: parameters.longitude 
                }}
                heading={parameters.heading}
                className="h-full"
              />
            </div>
            <div className="col-span-4 bg-neutral-800 rounded-lg p-4 h-[60vh] overflow-y-auto">
              <CommunicationsHistory scenarioId={activeScenarioId} />
            </div>

            {/* Bottom Row - Decision Options */}
            <div className="col-span-12 bg-neutral-800 rounded-lg p-4 mt-6 z-30 relative">
              <DecisionOptions scenarioId={activeScenarioId} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 