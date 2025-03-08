"use client";

import { setupConsoleFilters, restoreConsole } from "@/lib/utils/disableNoiseLog";
import { setupErrorTracking, restoreConsoleError } from "@/lib/utils/intercept-console-error";
import { useEffect } from "react";

export default function ConsoleFilterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Set up error tracking first
    setupErrorTracking();
    
    // Then set up console filters
    setupConsoleFilters();
    
    // Restore both when component unmounts
    return () => {
      restoreConsole();
      restoreConsoleError();
    };
  }, []);

  return <>{children}</>;
} 