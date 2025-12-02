/**
 * Collector & Aggregator
 * 
 * Collects outputs from all Composers and aggregates them into a final blueprint.
 */

import type {
  ComposerOutput,
  ComposerModuleId,
  ConsistencyReview,
  ConsistencyIssue,
  AggregatedBlueprint,
  ModuleSummary,
  DependencyNode,
  Blueprint,
} from './types';
import { COMPOSERS, getComposer, getComposersInOrder } from './composers';

/** Scoring constants for consistency review */
const ERROR_PENALTY = 20;
const WARNING_PENALTY = 5;
/** Minimum consistency score required to consider the blueprint complete */
const MINIMUM_ACCEPTABLE_SCORE = 80;

/**
 * Collect outputs from all Composers
 */
export function collectOutputs(outputs: ComposerOutput[]): {
  completed: ComposerOutput[];
  failed: ComposerOutput[];
  pending: ComposerOutput[];
} {
  return {
    completed: outputs.filter((o) => o.status === 'completed'),
    failed: outputs.filter((o) => o.status === 'failed'),
    pending: outputs.filter((o) => o.status === 'pending' || o.status === 'in-progress'),
  };
}

/**
 * Check naming consistency across outputs
 */
function checkNamingConsistency(outputs: ComposerOutput[]): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];
  const namingPatterns: Map<string, Set<string>> = new Map();

  // Patterns to check
  const patterns = [
    { name: 'camelCase', regex: /\b[a-z][a-zA-Z0-9]*\b/g },
    { name: 'PascalCase', regex: /\b[A-Z][a-zA-Z0-9]*\b/g },
    { name: 'kebab-case', regex: /\b[a-z]+(-[a-z]+)+\b/g },
    { name: 'snake_case', regex: /\b[a-z]+(_[a-z]+)+\b/g },
  ];

  for (const output of outputs) {
    if (output.status !== 'completed') continue;

    for (const pattern of patterns) {
      const matches = output.content.match(pattern.regex) || [];
      if (matches.length > 0) {
        if (!namingPatterns.has(output.module_id)) {
          namingPatterns.set(output.module_id, new Set());
        }
        namingPatterns.get(output.module_id)!.add(pattern.name);
      }
    }
  }

  // Check for inconsistent patterns across modules
  const allPatterns = new Set<string>();
  namingPatterns.forEach((patterns) => {
    patterns.forEach((p) => allPatterns.add(p));
  });

  if (allPatterns.size > 2) {
    issues.push({
      severity: 'warning',
      module_id: 'UI-Kit',
      description: 'Multiple naming conventions detected across modules',
      suggestion: 'Standardize on camelCase for variables and PascalCase for components',
    });
  }

  return issues;
}

/**
 * Validate dependencies between modules
 */
function validateDependencies(outputs: ComposerOutput[]): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];
  const completedModules = new Set(
    outputs.filter((o) => o.status === 'completed').map((o) => o.module_id)
  );

  for (const output of outputs) {
    if (output.status !== 'completed') continue;

    const composer = getComposer(output.module_id);
    if (!composer) continue;

    for (const depId of composer.dependencies) {
      if (!completedModules.has(depId)) {
        issues.push({
          severity: 'error',
          module_id: output.module_id,
          description: `Missing dependency: ${depId} is required but not completed`,
          suggestion: `Ensure ${depId} module is completed before ${output.module_id}`,
        });
      }
    }
  }

  return issues;
}

/**
 * Check style consistency
 */
function checkStyleConsistency(outputs: ComposerOutput[]): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];

  // Check for consistent import styles
  const importStyles = new Map<string, ComposerModuleId[]>();
  
  for (const output of outputs) {
    if (output.status !== 'completed') continue;

    // Check for ES6 imports vs require
    const hasES6Imports = output.content.includes('import ');
    const hasRequire = output.content.includes('require(');

    if (hasES6Imports && hasRequire) {
      issues.push({
        severity: 'warning',
        module_id: output.module_id,
        description: 'Mixed import styles (ES6 and CommonJS)',
        suggestion: 'Use ES6 imports consistently',
      });
    }

    // Track TypeScript usage
    if (output.content.includes(': string') || 
        output.content.includes(': number') ||
        output.content.includes('interface ') ||
        output.content.includes('type ')) {
      if (!importStyles.has('typescript')) {
        importStyles.set('typescript', []);
      }
      importStyles.get('typescript')!.push(output.module_id);
    }
  }

  return issues;
}

/**
 * Perform consistency review on all outputs
 */
export function performConsistencyReview(
  outputs: ComposerOutput[]
): ConsistencyReview {
  const namingIssues = checkNamingConsistency(outputs);
  const dependencyIssues = validateDependencies(outputs);
  const styleIssues = checkStyleConsistency(outputs);

  const allIssues = [...namingIssues, ...dependencyIssues, ...styleIssues];
  
  // Calculate score based on error and warning counts
  const errorCount = allIssues.filter((i) => i.severity === 'error').length;
  const warningCount = allIssues.filter((i) => i.severity === 'warning').length;
  const score = Math.max(0, 100 - errorCount * ERROR_PENALTY - warningCount * WARNING_PENALTY);

  return {
    score,
    issues: allIssues,
    dependenciesValid: dependencyIssues.filter((i) => i.severity === 'error').length === 0,
    namingConsistent: namingIssues.length === 0,
    styleConsistent: styleIssues.length === 0,
  };
}

/**
 * Generate module summary
 */
function generateModuleSummary(output: ComposerOutput): ModuleSummary {
  const composer = getComposer(output.module_id);
  
  let completionPercentage = 0;
  if (output.status === 'completed') {
    completionPercentage = 100;
  } else if (output.status === 'in-progress') {
    completionPercentage = 50;
  } else if (output.status === 'failed') {
    completionPercentage = 0;
  }

  return {
    module_id: output.module_id,
    summary: composer 
      ? `${composer.name}: ${output.status === 'completed' ? 'Successfully generated' : output.status}`
      : `Module ${output.module_id}: ${output.status}`,
    completionPercentage,
    filesGenerated: output.files?.length ?? 0,
  };
}

/**
 * Build dependency graph
 */
function buildDependencyGraph(): DependencyNode[] {
  const nodes: DependencyNode[] = [];

  for (const composer of COMPOSERS) {
    const requiredBy: ComposerModuleId[] = [];

    // Find modules that depend on this one
    for (const other of COMPOSERS) {
      if (other.dependencies.includes(composer.module_id)) {
        requiredBy.push(other.module_id);
      }
    }

    nodes.push({
      module_id: composer.module_id,
      dependsOn: composer.dependencies,
      requiredBy,
    });
  }

  return nodes;
}

/**
 * Determine suggested implementation order
 */
function getImplementationOrder(): ComposerModuleId[] {
  return getComposersInOrder().map((c) => c.module_id);
}

/**
 * Aggregate all outputs into a final blueprint
 */
export function aggregateBlueprint(
  blueprint: Blueprint,
  outputs: ComposerOutput[],
  round: number
): AggregatedBlueprint {
  const consistencyReview = performConsistencyReview(outputs);
  const { completed, failed, pending } = collectOutputs(outputs);

  // Determine overall status
  let status: 'incomplete' | 'needs-revision' | 'complete';
  if (pending.length > 0 || failed.length > 0) {
    status = 'incomplete';
  } else if (consistencyReview.score < MINIMUM_ACCEPTABLE_SCORE) {
    status = 'needs-revision';
  } else {
    status = 'complete';
  }

  return {
    blueprintId: blueprint.id,
    round,
    timestamp: new Date(),
    outputs,
    consistencyReview,
    moduleSummaries: outputs.map(generateModuleSummary),
    dependencyGraph: buildDependencyGraph(),
    implementationOrder: getImplementationOrder(),
    status,
  };
}

/**
 * Generate a summary report of the aggregated blueprint
 */
export function generateSummaryReport(aggregated: AggregatedBlueprint): string {
  const lines: string[] = [
    `# Aggregated Blueprint Report`,
    ``,
    `## Overview`,
    `- Blueprint ID: ${aggregated.blueprintId}`,
    `- Processing Round: ${aggregated.round}`,
    `- Status: ${aggregated.status}`,
    `- Consistency Score: ${aggregated.consistencyReview.score}/100`,
    ``,
    `## Module Status`,
    ``,
  ];

  for (const summary of aggregated.moduleSummaries) {
    const statusIcon = summary.completionPercentage === 100 ? '✅' : 
                       summary.completionPercentage > 0 ? '🔄' : '❌';
    lines.push(`- ${statusIcon} **${summary.module_id}**: ${summary.summary} (${summary.filesGenerated} files)`);
  }

  if (aggregated.consistencyReview.issues.length > 0) {
    lines.push(``, `## Issues Found`, ``);
    for (const issue of aggregated.consistencyReview.issues) {
      const icon = issue.severity === 'error' ? '🔴' : 
                   issue.severity === 'warning' ? '🟡' : '🔵';
      lines.push(`- ${icon} [${issue.module_id}] ${issue.description}`);
      if (issue.suggestion) {
        lines.push(`  - Suggestion: ${issue.suggestion}`);
      }
    }
  }

  lines.push(
    ``,
    `## Suggested Implementation Order`,
    ``,
    aggregated.implementationOrder.map((id, i) => `${i + 1}. ${id}`).join('\n'),
    ``,
    `---`,
    `Generated at: ${aggregated.timestamp.toISOString()}`
  );

  return lines.join('\n');
}

/**
 * Check if another round is needed
 */
export function needsAnotherRound(aggregated: AggregatedBlueprint): boolean {
  return aggregated.status !== 'complete';
}
