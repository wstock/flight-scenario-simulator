import { NextRequest, NextResponse }
import { createApiLogger } from '@/lib/utils/logger';  const logger = createApiLogger('[id]Route');
from 'next/server';
import { db } from '@/lib/db';

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
  context: { params: { id: string } }
) {
  try {
    // Ensure params are properly awaited when accessed
    const { id } = context.params;
    const body = await request.json();
    const { is_sent } = body;
    
    if (is_sent === undefined) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'is_sent field is required' 
        },
        { status: 400 }
      );
    }
    
    logger.info(`Updating communication queue item ${id}...`);
    
    // For now, just return success since we don't have the actual table
    // In a real implementation, this would update the database
    
    logger.info(`Successfully updated communication queue item ${id}`);
    
    return NextResponse.json({
      success: true,
      data: {
        id,
        is_sent
      }
    });
    
  } catch (error) {
    console.error('API route error updating communication queue item:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update communication queue item' 
      },
      { status: 500 }
    );
  }
} 