"use client";

import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeadset, faMicrophone, faPlane } from '@fortawesome/free-solid-svg-icons';

interface Communication {
  id: string;
  type: 'atc' | 'crew' | 'system';
  sender: string;
  message: string;
  timestamp: string;
  isImportant?: boolean;
}

interface CommunicationsHistoryProps {
  className?: string;
  scenarioId?: string;
  maxItems?: number;
}

/**
 * CommunicationsHistory component shows a scrollable history of communications
 * between ATC, crew, and system messages
 */
export default function CommunicationsHistory({
  className = '',
  scenarioId,
  maxItems = 50,
}: CommunicationsHistoryProps) {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Set up polling for communications updates (replacing Supabase subscription)
  useEffect(() => {
    if (!scenarioId) {
      // Generate demo communications if no scenario ID
      generateDemoCommunications();
      return;
    }
    
    // Initial fetch of communications
    fetchCommunications();
    
    // Set up polling interval to check for updates
    const intervalId = setInterval(() => {
      fetchCommunications();
    }, 5000); // Poll every 5 seconds
    
    return () => {
      clearInterval(intervalId);
    };
  }, [scenarioId, maxItems]);
  
  // Fetch communications data
  const fetchCommunications = async () => {
    if (!scenarioId) return;
    
    try {
      const response = await fetch(`/api/scenarios/communications?scenarioId=${scenarioId}&limit=${maxItems}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching communications: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Transform data to our Communication format
        const transformedComms: Communication[] = result.data.map((comm: any) => ({
          id: comm.id,
          type: comm.type,
          sender: comm.sender,
          message: comm.message,
          timestamp: comm.created_at,
          isImportant: comm.is_important,
        }));
        
        setCommunications(transformedComms);
        
        // Scroll to bottom after loading
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error('Error fetching communications:', error);
    }
  };
  
  // Generate demo communications for preview
  const generateDemoCommunications = () => {
    const demoComms: Communication[] = [
      {
        id: '1',
        type: 'atc',
        sender: 'SFO Tower',
        message: 'Flight 123, cleared for takeoff runway 28L.',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      },
      {
        id: '2',
        type: 'crew',
        sender: 'Captain',
        message: 'Cleared for takeoff runway 28L, Flight 123.',
        timestamp: new Date(Date.now() - 1000 * 60 * 4.5).toISOString(),
      },
      {
        id: '3',
        type: 'system',
        sender: 'System',
        message: 'Takeoff power set. V1... Rotate... V2',
        timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
      },
      {
        id: '4',
        type: 'atc',
        sender: 'SFO Departure',
        message: 'Flight 123, contact NorCal Approach on 124.4',
        timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      },
      {
        id: '5',
        type: 'crew',
        sender: 'First Officer',
        message: 'Contact NorCal Approach on 124.4, Flight 123.',
        timestamp: new Date(Date.now() - 1000 * 60 * 2.5).toISOString(),
      },
      {
        id: '6',
        type: 'atc',
        sender: 'NorCal Approach',
        message: 'Flight 123, climb and maintain FL240, proceed direct OCEAN.',
        timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
        isImportant: true,
      },
      {
        id: '7',
        type: 'crew',
        sender: 'Captain',
        message: 'Climb and maintain FL240, direct OCEAN, Flight 123.',
        timestamp: new Date(Date.now() - 1000 * 60 * 1.5).toISOString(),
      },
      {
        id: '8',
        type: 'system',
        sender: 'System',
        message: 'Weather alert: Turbulence reported ahead.',
        timestamp: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
        isImportant: true,
      },
    ];
    
    setCommunications(demoComms);
    
    // Scroll to bottom after loading
    setTimeout(scrollToBottom, 100);
  };
  
  // Scroll to the bottom of the messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };
  
  // Get icon based on communication type
  const getIcon = (type: Communication['type']) => {
    switch (type) {
      case 'atc':
        return <FontAwesomeIcon icon={faHeadset} className="text-blue-500" />;
      case 'crew':
        return <FontAwesomeIcon icon={faMicrophone} className="text-green-500" />;
      case 'system':
        return <FontAwesomeIcon icon={faPlane} className="text-yellow-500" />;
      default:
        return <FontAwesomeIcon icon={faHeadset} className="text-blue-500" />;
    }
  };
  
  return (
    <div className={`bg-gray-800 rounded-lg p-4 shadow-lg flex flex-col ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-gray-400 font-medium text-sm">COMMUNICATIONS</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
        {communications.map((comm) => (
          <div 
            key={comm.id}
            className={`p-2 rounded ${
              comm.isImportant ? 'bg-red-900/30 border border-red-700/50' : 'bg-gray-700/50'
            }`}
          >
            <div className="flex items-start">
              <div className="mr-2 mt-1">
                {getIcon(comm.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-300">{comm.sender}</span>
                  <span className="text-xs text-gray-500">{formatTimestamp(comm.timestamp)}</span>
                </div>
                <p className="text-sm text-gray-200 mt-1">{comm.message}</p>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
} 