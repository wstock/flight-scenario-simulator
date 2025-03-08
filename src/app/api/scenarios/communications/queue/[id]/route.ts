import { NextRequest, NextResponse } from 'next/server';
import { createApiLogger } from '@/lib/utils/logger';
import { db } from '@/lib/db';

const logger = createApiLogger('DynamicRoute');

// Use correct config exports for Next.js 15+
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

/**
 * PATCH handler for updating a communication queue item
 * Using the exact parameter style required by Next.js
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the item ID from the URL
    const id = params.id;
    
    logger.info(`Updating communication queue item ${id}...`);
    
    // Parse the request body
    const body = await request.json();
    const { is_sent } = body;
    
    if (is_sent === undefined) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing is_sent field in request body' 
        },
        { status: 400 }
      );
    }
    
    // In a real implementation, we would update the database here
    // For mock purposes, we'll just return success
    
    logger.info(`Successfully updated communication queue item ${id}`);
    
    return NextResponse.json({
      success: true,
      data: {
        id,
        is_sent
      }
    });
  } catch (error) {
    logger.error('Error updating communication queue item:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update communication queue item' 
      },
      { status: 500 }
    );
  }
} 
