/**
 * Composers API Route
 * 
 * GET /api/meta-agent/composers
 * 
 * Returns information about all 18 Composers.
 */

import { NextResponse } from 'next/server';
import { COMPOSERS, getComposersInOrder } from '@/lib/meta-agent';

export async function GET() {
  const orderedComposers = getComposersInOrder();
  
  return NextResponse.json({
    total: COMPOSERS.length,
    composers: COMPOSERS.map((c) => ({
      ...c,
      priority: orderedComposers.findIndex((o) => o.module_id === c.module_id) + 1,
    })),
    implementationOrder: orderedComposers.map((c) => c.module_id),
  });
}
