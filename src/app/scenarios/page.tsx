"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { listScenarios, activateScenario } from "@/lib/scenario/scenarioLoader";
import { toast } from "react-toastify";

interface Scenario {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  created_at: string;
}

export default function ScenariosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Load scenarios
  useEffect(() => {
    const loadScenarios = async () => {
      try {
        setLoading(true);
        const scenariosData = await listScenarios();
        setScenarios(scenariosData as Scenario[]);
      } catch (error) {
        console.error("Error loading scenarios:", error);
        toast.error("Failed to load scenarios");
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      loadScenarios();
    }
  }, [status]);

  const handleActivateScenario = async (scenarioId: string) => {
    try {
      setActivating(scenarioId);
      await activateScenario(scenarioId);
      
      // Store active scenario ID in localStorage for demo purposes
      // In a real app, this would be stored in the database
      localStorage.setItem("activeScenarioId", scenarioId);
      
      toast.success("Scenario activated successfully");
      router.push("/simulator");
    } catch (error) {
      console.error("Error activating scenario:", error);
      toast.error("Failed to activate scenario");
    } finally {
      setActivating(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Flight Scenarios</h1>
        
        {scenarios.length === 0 ? (
          <div className="bg-neutral-800 rounded-lg p-6 text-center">
            <p className="mb-4">No scenarios available.</p>
            <p className="text-sm text-neutral-400">
              Please check back later or contact an administrator.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scenarios.map((scenario) => (
              <div 
                key={scenario.id} 
                className="bg-neutral-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-semibold">{scenario.title}</h2>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      scenario.difficulty === "Easy" 
                        ? "bg-green-900 text-green-300" 
                        : scenario.difficulty === "Medium" 
                        ? "bg-yellow-900 text-yellow-300" 
                        : "bg-red-900 text-red-300"
                    }`}>
                      {scenario.difficulty}
                    </span>
                  </div>
                  <p className="text-neutral-300 mb-6 line-clamp-3">
                    {scenario.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-neutral-400">
                      Created: {new Date(scenario.created_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleActivateScenario(scenario.id)}
                      disabled={activating === scenario.id}
                      className={`px-4 py-2 rounded-lg ${
                        activating === scenario.id
                          ? "bg-blue-800 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                      } transition-colors`}
                    >
                      {activating === scenario.id ? (
                        <span className="flex items-center">
                          <span className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full mr-2"></span>
                          Activating...
                        </span>
                      ) : (
                        "Start Scenario"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 