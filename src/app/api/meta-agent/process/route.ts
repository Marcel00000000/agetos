/**
 * Meta-Agent API Route
 * 
 * POST /api/meta-agent/process
 * 
 * Receives a blueprint and processes it through the Meta-Agent orchestration system.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  processBlueprint,
  validateBlueprint,
  generateSummaryReport,
  type Blueprint,
} from '@/lib/meta-agent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = validateBlueprint(body);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'Invalid blueprint', 
          details: validation.errors 
        },
        { status: 400 }
      );
    }

    // Create blueprint with defaults
    const blueprint: Blueprint = {
      id: body.id || crypto.randomUUID(),
      name: body.name,
      description: body.description,
      features: body.features,
      techPreferences: body.techPreferences,
      designPreferences: body.designPreferences,
      createdAt: new Date(),
    };

    // Process the blueprint
    const aggregated = await processBlueprint(blueprint);

    // Generate summary report
    const report = generateSummaryReport(aggregated);

    return NextResponse.json({
      success: true,
      aggregated,
      report,
    });
  } catch (error) {
    console.error('Meta-agent processing error:', error);
    return NextResponse.json(
      { 
        error: 'Processing failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'Meta-Agent API',
    version: '1.0.0',
    endpoints: {
      'POST /api/meta-agent/process': 'Process a SaaS blueprint',
    },
    schema: {
      blueprint: {
        id: 'string (optional)',
        name: 'string (required)',
        description: 'string (required)',
        features: 'string[] (required)',
        techPreferences: 'TechStackItem[] (optional)',
        designPreferences: '{colorScheme, typography, style} (optional)',
      },
    },
  });
}
