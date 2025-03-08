"use client";

import { getTrackedErrors, clearTrackedErrors } from "@/lib/utils/intercept-console-error";
import { useState } from "react";

export default function DebugErrorButton() {
  const [showErrors, setShowErrors] = useState(false);
  const [errors, setErrors] = useState<ReturnType<typeof getTrackedErrors>>([]);
  
  // Only show in development
  if (process.env.NODE_ENV === "production") {
    return null;
  }
  
  const handleShowErrors = () => {
    const currentErrors = getTrackedErrors();
    setErrors(currentErrors);
    setShowErrors(true);
  };
  
  const handleClearErrors = () => {
    clearTrackedErrors();
    setErrors([]);
  };
  
  const handleClose = () => {
    setShowErrors(false);
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={handleShowErrors}
        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
      >
        Debug Errors ({getTrackedErrors().length})
      </button>
      
      {showErrors && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-4xl w-full max-h-[80vh] overflow-auto">
            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-semibold">Debug Error Log ({errors.length})</h3>
              <div className="flex gap-2">
                <button 
                  onClick={handleClearErrors}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                >
                  Clear Errors
                </button>
                <button 
                  onClick={handleClose}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="p-4">
              {errors.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No errors tracked yet
                </p>
              ) : (
                <div className="space-y-4">
                  {errors.map((error, index) => (
                    <div 
                      key={index} 
                      className="p-3 border dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-900"
                    >
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {new Date(error.timestamp).toLocaleString()}
                      </div>
                      <div className="font-mono text-sm overflow-x-auto pb-1 text-red-600 dark:text-red-400">
                        {error.message}
                      </div>
                      {error.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer">
                            Details
                          </summary>
                          <pre className="mt-2 text-xs overflow-x-auto bg-gray-100 dark:bg-gray-800 p-2 rounded">
                            {JSON.stringify(error.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 