/**
 * Composer Definitions
 * 
 * Defines the 18 specialized Composers that handle different aspects
 * of SaaS blueprint processing.
 */

import type { ComposerModuleId, TechStackItem, OutputType } from './types';

/**
 * Composer definition
 */
export interface ComposerDefinition {
  module_id: ComposerModuleId;
  name: string;
  description: string;
  defaultTechStack: TechStackItem[];
  defaultOutputType: OutputType;
  defaultConstraints: string[];
  dependencies: ComposerModuleId[];
}

/**
 * The 18 Composer definitions
 */
export const COMPOSERS: ComposerDefinition[] = [
  {
    module_id: 'UI-Kit',
    name: 'UI Component Kit',
    description: 'Design reusable UI components following atomic design principles and shadcn/ui patterns.',
    defaultTechStack: ['Next.js', 'TailwindCSS', 'Framer Motion', 'TypeScript', 'shadcn/ui'],
    defaultOutputType: 'code-snippet',
    defaultConstraints: [
      'reusable components',
      'atomic design pattern',
      'white background, #0af accent',
      'Inter + Satoshi typography',
      'accessible (WCAG 2.1)',
    ],
    dependencies: [],
  },
  {
    module_id: 'UI-Pages',
    name: 'UI Pages & Layouts',
    description: 'Create page layouts and route structures using the component kit.',
    defaultTechStack: ['Next.js', 'TailwindCSS', 'TypeScript', 'React'],
    defaultOutputType: 'code-snippet',
    defaultConstraints: [
      'responsive design',
      'glassmorphism style',
      'dark mode support',
      'semantic HTML',
    ],
    dependencies: ['UI-Kit'],
  },
  {
    module_id: 'API-Routes',
    name: 'API Route Handlers',
    description: 'Define API routes and endpoints for the backend services.',
    defaultTechStack: ['Next.js', 'TypeScript', 'Prisma'],
    defaultOutputType: 'code-snippet',
    defaultConstraints: [
      'RESTful design',
      'input validation',
      'error handling',
      'rate limiting support',
    ],
    dependencies: ['Database'],
  },
  {
    module_id: 'API-Integration',
    name: 'External API Integration',
    description: 'Integrate with external services and third-party APIs.',
    defaultTechStack: ['TypeScript', 'Axios', 'React Query'],
    defaultOutputType: 'code-snippet',
    defaultConstraints: [
      'retry logic',
      'error handling',
      'response caching',
      'type-safe clients',
    ],
    dependencies: ['API-Routes'],
  },
  {
    module_id: 'Database',
    name: 'Database Schema & Models',
    description: 'Design database schema, models, and migrations.',
    defaultTechStack: ['Prisma', 'PostgreSQL', 'TypeScript'],
    defaultOutputType: 'code-snippet',
    defaultConstraints: [
      'normalized schema',
      'proper indexes',
      'soft deletes',
      'audit timestamps',
    ],
    dependencies: [],
  },
  {
    module_id: 'Auth',
    name: 'Authentication & Authorization',
    description: 'Implement user authentication and role-based access control.',
    defaultTechStack: ['NextAuth', 'TypeScript', 'Prisma'],
    defaultOutputType: 'code-snippet',
    defaultConstraints: [
      'OAuth providers',
      'JWT tokens',
      'session management',
      'RBAC support',
    ],
    dependencies: ['Database'],
  },
  {
    module_id: 'Billing',
    name: 'Billing & Subscriptions',
    description: 'Integrate payment processing and subscription management.',
    defaultTechStack: ['Stripe', 'TypeScript', 'Next.js'],
    defaultOutputType: 'code-snippet',
    defaultConstraints: [
      'webhook handling',
      'subscription tiers',
      'invoice generation',
      'proration support',
    ],
    dependencies: ['Auth', 'Database'],
  },
  {
    module_id: 'Analytics',
    name: 'Analytics & Reporting',
    description: 'Implement analytics tracking and dashboard reporting.',
    defaultTechStack: ['React', 'TypeScript', 'React Query'],
    defaultOutputType: 'code-snippet',
    defaultConstraints: [
      'real-time updates',
      'chart visualizations',
      'export functionality',
      'custom date ranges',
    ],
    dependencies: ['API-Routes', 'UI-Kit'],
  },
  {
    module_id: 'QA-Testing',
    name: 'Quality Assurance & Testing',
    description: 'Create comprehensive test suites for all components.',
    defaultTechStack: ['Jest', 'Vitest', 'TypeScript'],
    defaultOutputType: 'test-suite',
    defaultConstraints: [
      'unit tests',
      'integration tests',
      'e2e tests',
      '80% coverage minimum',
    ],
    dependencies: ['UI-Kit', 'API-Routes'],
  },
  {
    module_id: 'Debug',
    name: 'Debugging & Error Handling',
    description: 'Implement error boundaries, logging, and debugging utilities.',
    defaultTechStack: ['TypeScript', 'React', 'Next.js'],
    defaultOutputType: 'code-snippet',
    defaultConstraints: [
      'error boundaries',
      'structured logging',
      'source maps',
      'dev tools integration',
    ],
    dependencies: ['UI-Kit'],
  },
  {
    module_id: 'Security',
    name: 'Security Implementation',
    description: 'Implement security measures and vulnerability protection.',
    defaultTechStack: ['TypeScript', 'Next.js'],
    defaultOutputType: 'code-snippet',
    defaultConstraints: [
      'CSRF protection',
      'XSS prevention',
      'input sanitization',
      'secure headers',
    ],
    dependencies: ['Auth', 'API-Routes'],
  },
  {
    module_id: 'Performance',
    name: 'Performance Optimization',
    description: 'Optimize application performance and loading times.',
    defaultTechStack: ['Next.js', 'TypeScript', 'React'],
    defaultOutputType: 'code-snippet',
    defaultConstraints: [
      'code splitting',
      'lazy loading',
      'image optimization',
      'caching strategies',
    ],
    dependencies: ['UI-Pages', 'API-Routes'],
  },
  {
    module_id: 'DevOps',
    name: 'DevOps & Deployment',
    description: 'Configure CI/CD pipelines and deployment infrastructure.',
    defaultTechStack: ['TypeScript', 'Node.js'],
    defaultOutputType: 'config-file',
    defaultConstraints: [
      'GitHub Actions',
      'Docker support',
      'environment configs',
      'automated deployments',
    ],
    dependencies: [],
  },
  {
    module_id: 'Documentation',
    name: 'Documentation & API Docs',
    description: 'Generate comprehensive documentation for the codebase.',
    defaultTechStack: ['TypeScript'],
    defaultOutputType: 'documentation',
    defaultConstraints: [
      'JSDoc comments',
      'API documentation',
      'README files',
      'usage examples',
    ],
    dependencies: ['API-Routes', 'UI-Kit'],
  },
  {
    module_id: 'Localization',
    name: 'Localization & i18n',
    description: 'Implement internationalization and localization support.',
    defaultTechStack: ['TypeScript', 'Next.js', 'React'],
    defaultOutputType: 'code-snippet',
    defaultConstraints: [
      'translation files',
      'RTL support',
      'date/number formatting',
      'dynamic loading',
    ],
    dependencies: ['UI-Kit'],
  },
  {
    module_id: 'Notifications',
    name: 'Notification System',
    description: 'Implement in-app, email, and push notification systems.',
    defaultTechStack: ['TypeScript', 'Next.js', 'React'],
    defaultOutputType: 'code-snippet',
    defaultConstraints: [
      'toast notifications',
      'email templates',
      'push notifications',
      'notification preferences',
    ],
    dependencies: ['Auth', 'UI-Kit'],
  },
  {
    module_id: 'Search',
    name: 'Search Functionality',
    description: 'Implement search features with filtering and sorting.',
    defaultTechStack: ['TypeScript', 'React', 'React Query'],
    defaultOutputType: 'code-snippet',
    defaultConstraints: [
      'full-text search',
      'faceted filtering',
      'search suggestions',
      'debounced input',
    ],
    dependencies: ['API-Routes', 'UI-Kit'],
  },
  {
    module_id: 'Monitoring',
    name: 'Monitoring & Observability',
    description: 'Set up application monitoring and observability tools.',
    defaultTechStack: ['TypeScript', 'Next.js'],
    defaultOutputType: 'config-file',
    defaultConstraints: [
      'error tracking',
      'performance monitoring',
      'health checks',
      'alerting rules',
    ],
    dependencies: ['DevOps'],
  },
];

/**
 * Get a composer by ID
 */
export function getComposer(moduleId: ComposerModuleId): ComposerDefinition | undefined {
  return COMPOSERS.find((c) => c.module_id === moduleId);
}

/**
 * Get all composer module IDs
 */
export function getComposerIds(): ComposerModuleId[] {
  return COMPOSERS.map((c) => c.module_id);
}

/**
 * Get composers in dependency order (topological sort)
 */
export function getComposersInOrder(): ComposerDefinition[] {
  const visited = new Set<ComposerModuleId>();
  const result: ComposerDefinition[] = [];

  function visit(composer: ComposerDefinition) {
    if (visited.has(composer.module_id)) return;
    visited.add(composer.module_id);

    for (const depId of composer.dependencies) {
      const dep = getComposer(depId);
      if (dep) visit(dep);
    }

    result.push(composer);
  }

  for (const composer of COMPOSERS) {
    visit(composer);
  }

  return result;
}
