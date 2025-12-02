/**
 * Meta-Agent Orchestrator
 * 
 * The main orchestration engine that coordinates the entire workflow:
 * 1. Receives user blueprint
 * 2. Parses and splits into prompt tasks
 * 3. Distributes to Composers
 * 4. Collects and aggregates outputs
 * 5. Reviews consistency
 * 6. Generates final report
 */

import type {
  Blueprint,
  PromptTask,
  ComposerOutput,
  WorkflowState,
  AggregatedBlueprint,
  ComposerModuleId,
} from './types';
import { parseBlueprint, validateBlueprint, formatPromptTask } from './blueprint-parser';
import { 
  aggregateBlueprint, 
  needsAnotherRound, 
  generateSummaryReport,
  collectOutputs,
} from './aggregator';
import { COMPOSERS, getComposer, getComposersInOrder } from './composers';

/**
 * Maximum number of processing rounds before giving up.
 * If the blueprint still needs work after this many rounds,
 * the workflow will complete with a 'needs-revision' or 'incomplete' status.
 */
const MAX_ROUNDS = 5;

/** Mock execution time range for testing (in milliseconds) */
const MIN_MOCK_EXECUTION_TIME = 500;
const MAX_MOCK_EXECUTION_TIME = 1500;

/**
 * Workflow event types
 */
export type WorkflowEvent =
  | { type: 'BLUEPRINT_RECEIVED'; blueprint: Blueprint }
  | { type: 'PARSING_COMPLETE'; tasks: PromptTask[] }
  | { type: 'TASK_DISTRIBUTED'; moduleId: ComposerModuleId }
  | { type: 'COMPOSER_OUTPUT'; output: ComposerOutput }
  | { type: 'COLLECTION_COMPLETE'; outputs: ComposerOutput[] }
  | { type: 'REVIEW_COMPLETE'; aggregated: AggregatedBlueprint }
  | { type: 'ROUND_COMPLETE'; round: number; needsRetry: boolean }
  | { type: 'WORKFLOW_COMPLETE'; aggregated: AggregatedBlueprint };

/**
 * Workflow event listener
 */
export type WorkflowEventListener = (event: WorkflowEvent) => void;

/**
 * Composer executor interface
 * This should be implemented by the actual Composer integration (e.g., n8n workflow)
 */
export interface ComposerExecutor {
  execute(task: PromptTask): Promise<ComposerOutput>;
}

/**
 * Meta-Agent Orchestrator class
 */
export class MetaAgentOrchestrator {
  private state: WorkflowState | null = null;
  private listeners: WorkflowEventListener[] = [];
  private executor: ComposerExecutor | null = null;

  constructor(executor?: ComposerExecutor) {
    this.executor = executor ?? null;
  }

  /**
   * Set the composer executor
   */
  setExecutor(executor: ComposerExecutor): void {
    this.executor = executor;
  }

  /**
   * Add event listener
   */
  addEventListener(listener: WorkflowEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: WorkflowEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  /**
   * Get current workflow state
   */
  getState(): WorkflowState | null {
    return this.state;
  }

  /**
   * Process a blueprint through the entire workflow
   */
  async processBlueprint(blueprint: Blueprint): Promise<AggregatedBlueprint> {
    // Validate blueprint
    const validation = validateBlueprint(blueprint);
    if (!validation.valid) {
      throw new Error(`Invalid blueprint: ${validation.errors.join(', ')}`);
    }

    // Initialize state
    this.state = {
      phase: 'parsing',
      round: 1,
      blueprint,
      promptTasks: [],
      outputs: [],
    };

    this.emit({ type: 'BLUEPRINT_RECEIVED', blueprint });

    // Parse blueprint
    const promptTasks = parseBlueprint(blueprint);
    this.state.promptTasks = promptTasks;
    this.state.phase = 'distributing';

    this.emit({ type: 'PARSING_COMPLETE', tasks: promptTasks });

    // Process rounds
    let round = 1;
    let aggregated: AggregatedBlueprint;

    do {
      // Distribute and collect
      const outputs = await this.processRound(promptTasks, round);
      this.state.outputs = outputs;

      // Aggregate
      this.state.phase = 'aggregating';
      aggregated = aggregateBlueprint(blueprint, outputs, round);
      this.state.aggregatedBlueprint = aggregated;

      this.emit({ type: 'REVIEW_COMPLETE', aggregated });

      const needsRetry = needsAnotherRound(aggregated) && round < MAX_ROUNDS;
      this.emit({ type: 'ROUND_COMPLETE', round, needsRetry });

      round++;
    } while (needsAnotherRound(aggregated) && round <= MAX_ROUNDS);

    this.state.phase = 'complete';
    this.emit({ type: 'WORKFLOW_COMPLETE', aggregated });

    return aggregated;
  }

  /**
   * Process a single round
   */
  private async processRound(
    tasks: PromptTask[],
    round: number
  ): Promise<ComposerOutput[]> {
    this.state!.phase = 'distributing';
    const outputs: ComposerOutput[] = [];

    // Get tasks in dependency order
    const orderedComposers = getComposersInOrder();
    const taskMap = new Map(tasks.map((t) => [t.module_id, t]));

    for (const composer of orderedComposers) {
      const task = taskMap.get(composer.module_id);
      if (!task) continue;

      this.emit({ type: 'TASK_DISTRIBUTED', moduleId: composer.module_id });

      // Execute task
      this.state!.phase = 'composing';
      const output = await this.executeTask(task);
      outputs.push(output);

      this.emit({ type: 'COMPOSER_OUTPUT', output });
    }

    this.state!.phase = 'collecting';
    this.emit({ type: 'COLLECTION_COMPLETE', outputs });

    return outputs;
  }

  /**
   * Execute a single task
   */
  private async executeTask(task: PromptTask): Promise<ComposerOutput> {
    if (this.executor) {
      try {
        return await this.executor.execute(task);
      } catch (error) {
        return {
          module_id: task.module_id,
          status: 'failed',
          content: '',
          output_type: task.output_type,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    // Mock execution if no executor is set
    return this.mockExecute(task);
  }

  /**
   * Mock execution for testing/demo purposes
   */
  private mockExecute(task: PromptTask): ComposerOutput {
    const executionTime = Math.random() * (MAX_MOCK_EXECUTION_TIME - MIN_MOCK_EXECUTION_TIME) + MIN_MOCK_EXECUTION_TIME;
    return {
      module_id: task.module_id,
      status: 'completed',
      content: `// Generated code for ${task.module_id}\n// Goal: ${task.goal.split('\n')[0]}\n// Tech stack: ${task.tech_stack.join(', ')}`,
      output_type: task.output_type,
      executionTime,
    };
  }

  /**
   * Generate a formatted prompt for a specific module
   */
  static formatPromptForComposer(task: PromptTask): string {
    return formatPromptTask(task);
  }

  /**
   * Generate summary report from the final aggregated blueprint
   */
  static generateReport(aggregated: AggregatedBlueprint): string {
    return generateSummaryReport(aggregated);
  }

  /**
   * Get all composer definitions
   */
  static getComposers() {
    return COMPOSERS;
  }

  /**
   * Get a specific composer by ID
   */
  static getComposer(moduleId: ComposerModuleId) {
    return getComposer(moduleId);
  }
}

/**
 * Create a new orchestrator instance
 */
export function createOrchestrator(executor?: ComposerExecutor): MetaAgentOrchestrator {
  return new MetaAgentOrchestrator(executor);
}

/**
 * Quick process helper function
 */
export async function processBlueprint(
  blueprint: Blueprint,
  executor?: ComposerExecutor
): Promise<AggregatedBlueprint> {
  const orchestrator = createOrchestrator(executor);
  return orchestrator.processBlueprint(blueprint);
}
