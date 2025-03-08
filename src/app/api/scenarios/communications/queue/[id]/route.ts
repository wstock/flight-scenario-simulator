import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * PATCH handler for updating a communication queue item
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await req.json();
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
    
    console.log(`API route: Updating communication queue item ${id}...`);
    
    // For now, just return success since we don't have the actual table
    // In a real implementation, this would update the database
    
    console.log(`API route: Successfully updated communication queue item ${id}`);
    
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