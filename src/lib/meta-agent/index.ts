/**
 * Meta-Agent Orchestration System
 * 
 * A system for analyzing user SaaS blueprints and distributing work
 * to 18 specialized Composers (helper agents).
 * 
 * @module meta-agent
 */

// Types
export type {
  ComposerModuleId,
  OutputType,
  TechStackItem,
  Blueprint,
  PromptTask,
  ComposerOutput,
  GeneratedFile,
  ConsistencyReview,
  ConsistencyIssue,
  AggregatedBlueprint,
  ModuleSummary,
  DependencyNode,
  WorkflowState,
} from './types';

// Composers
export { 
  COMPOSERS, 
  getComposer, 
  getComposerIds, 
  getComposersInOrder,
  type ComposerDefinition,
} from './composers';

// Blueprint Parser
export { 
  parseBlueprint, 
  formatPromptTask, 
  categorizeFeatures,
  validateBlueprint,
} from './blueprint-parser';

// Aggregator
export {
  collectOutputs,
  performConsistencyReview,
  aggregateBlueprint,
  generateSummaryReport,
  needsAnotherRound,
} from './aggregator';

// Orchestrator
export {
  MetaAgentOrchestrator,
  createOrchestrator,
  processBlueprint,
  type WorkflowEvent,
  type WorkflowEventListener,
  type ComposerExecutor,
} from './orchestrator';
