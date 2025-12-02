/**
 * Blueprint Parser (Meta-Parser)
 * 
 * Parses user blueprints and generates prompt tasks for each of the 18 Composers.
 */

import type { 
  Blueprint, 
  PromptTask, 
  ComposerModuleId,
  TechStackItem 
} from './types';
import { COMPOSERS, getComposersInOrder, type ComposerDefinition } from './composers';

/** Maximum length for description excerpt in generated goals */
const DESCRIPTION_MAX_LENGTH = 200;

/**
 * Keywords that help identify which modules a feature belongs to
 */
const FEATURE_KEYWORDS: Record<ComposerModuleId, string[]> = {
  'UI-Kit': ['button', 'component', 'ui', 'design', 'style', 'theme', 'input', 'form', 'modal'],
  'UI-Pages': ['page', 'layout', 'route', 'navigation', 'dashboard', 'screen', 'view'],
  'API-Routes': ['api', 'endpoint', 'rest', 'graphql', 'route', 'handler', 'crud'],
  'API-Integration': ['integration', 'third-party', 'external', 'sdk', 'service'],
  'Database': ['database', 'schema', 'model', 'table', 'migration', 'data', 'storage'],
  'Auth': ['auth', 'login', 'signup', 'register', 'password', 'oauth', 'session', 'permission', 'role'],
  'Billing': ['billing', 'payment', 'subscription', 'stripe', 'invoice', 'pricing', 'plan'],
  'Analytics': ['analytics', 'metrics', 'report', 'chart', 'graph', 'statistic', 'tracking'],
  'QA-Testing': ['test', 'testing', 'qa', 'quality', 'coverage', 'spec', 'e2e'],
  'Debug': ['debug', 'logging', 'log', 'error', 'trace', 'stack'],
  'Security': ['security', 'secure', 'encrypt', 'hash', 'csrf', 'xss', 'vulnerability'],
  'Performance': ['performance', 'speed', 'optimize', 'cache', 'lazy', 'fast'],
  'DevOps': ['deploy', 'deployment', 'ci', 'cd', 'docker', 'pipeline', 'infrastructure'],
  'Documentation': ['documentation', 'docs', 'readme', 'api-docs', 'guide', 'tutorial'],
  'Localization': ['i18n', 'l10n', 'translation', 'language', 'locale', 'international'],
  'Notifications': ['notification', 'email', 'push', 'alert', 'message', 'sms'],
  'Search': ['search', 'filter', 'sort', 'find', 'query', 'autocomplete'],
  'Monitoring': ['monitor', 'observability', 'health', 'uptime', 'alert', 'metrics'],
};

/**
 * Parse a blueprint description and extract relevant features for a module
 */
function extractRelevantFeatures(
  blueprint: Blueprint, 
  moduleId: ComposerModuleId
): string {
  const keywords = FEATURE_KEYWORDS[moduleId];
  const relevantFeatures: string[] = [];

  // Check blueprint description
  const descWords = blueprint.description.toLowerCase();
  for (const keyword of keywords) {
    if (descWords.includes(keyword)) {
      relevantFeatures.push(`Description mentions: ${keyword}`);
    }
  }

  // Check features list
  for (const feature of blueprint.features) {
    const featureLower = feature.toLowerCase();
    for (const keyword of keywords) {
      if (featureLower.includes(keyword)) {
        relevantFeatures.push(feature);
        break;
      }
    }
  }

  // If no specific features found, include general context
  if (relevantFeatures.length === 0) {
    return `Project: ${blueprint.name}\nDescription: ${blueprint.description}`;
  }

  return `Project: ${blueprint.name}\nRelevant features:\n${relevantFeatures.map(f => `- ${f}`).join('\n')}`;
}

/**
 * Generate a goal description for a module based on the blueprint
 */
function generateGoal(
  blueprint: Blueprint,
  composer: ComposerDefinition
): string {
  const baseGoal = composer.description;
  
  // Add project-specific context with truncated description
  return `${baseGoal}\n\nProject Context: ${blueprint.name} - ${blueprint.description.slice(0, DESCRIPTION_MAX_LENGTH)}`;
}

/**
 * Merge tech stacks (default + user preferences)
 */
function mergeTechStack(
  defaultStack: TechStackItem[],
  preferences?: TechStackItem[]
): TechStackItem[] {
  if (!preferences || preferences.length === 0) {
    return defaultStack;
  }
  
  const merged = new Set([...defaultStack, ...preferences]);
  return Array.from(merged);
}

/**
 * Generate constraints for a module
 */
function generateConstraints(
  blueprint: Blueprint,
  composer: ComposerDefinition
): string[] {
  const constraints = [...composer.defaultConstraints];

  // Add design preferences if available
  if (blueprint.designPreferences) {
    if (blueprint.designPreferences.colorScheme) {
      constraints.push(`Color scheme: ${blueprint.designPreferences.colorScheme}`);
    }
    if (blueprint.designPreferences.typography) {
      constraints.push(`Typography: ${blueprint.designPreferences.typography}`);
    }
    if (blueprint.designPreferences.style) {
      constraints.push(`Style: ${blueprint.designPreferences.style}`);
    }
  }

  return constraints;
}

/**
 * Parse a blueprint and generate prompt tasks for all 18 Composers
 */
export function parseBlueprint(blueprint: Blueprint): PromptTask[] {
  const orderedComposers = getComposersInOrder();
  const promptTasks: PromptTask[] = [];

  orderedComposers.forEach((composer, index) => {
    const task: PromptTask = {
      module_id: composer.module_id,
      goal: generateGoal(blueprint, composer),
      tech_stack: mergeTechStack(composer.defaultTechStack, blueprint.techPreferences),
      output_type: composer.defaultOutputType,
      constraints: generateConstraints(blueprint, composer),
      references: extractRelevantFeatures(blueprint, composer.module_id),
      priority: index + 1,
      dependencies: composer.dependencies,
    };

    promptTasks.push(task);
  });

  return promptTasks;
}

/**
 * Format a prompt task as a JSON string (for sending to a Composer)
 */
export function formatPromptTask(task: PromptTask): string {
  return JSON.stringify(task, null, 2);
}

/**
 * Parse blueprint features and categorize them by module
 */
export function categorizeFeatures(
  blueprint: Blueprint
): Record<ComposerModuleId, string[]> {
  // Initialize categories object with empty arrays for each composer
  const categories = Object.fromEntries(
    COMPOSERS.map((c) => [c.module_id, [] as string[]])
  ) as Record<ComposerModuleId, string[]>;

  for (const feature of blueprint.features) {
    const featureLower = feature.toLowerCase();
    let assigned = false;

    for (const [moduleId, keywords] of Object.entries(FEATURE_KEYWORDS)) {
      for (const keyword of keywords) {
        if (featureLower.includes(keyword)) {
          categories[moduleId as ComposerModuleId].push(feature);
          assigned = true;
          break;
        }
      }
      if (assigned) break;
    }

    // If not assigned to any specific module, add to UI-Pages as general feature
    if (!assigned) {
      categories['UI-Pages'].push(feature);
    }
  }

  return categories;
}

/**
 * Validate a blueprint before parsing
 */
export function validateBlueprint(blueprint: Partial<Blueprint>): { 
  valid: boolean; 
  errors: string[] 
} {
  const errors: string[] = [];

  if (!blueprint.id) {
    errors.push('Blueprint ID is required');
  }

  if (!blueprint.name || blueprint.name.trim() === '') {
    errors.push('Blueprint name is required');
  }

  if (!blueprint.description || blueprint.description.trim() === '') {
    errors.push('Blueprint description is required');
  }

  if (!blueprint.features || blueprint.features.length === 0) {
    errors.push('At least one feature is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
