/**
 * Default navigation configuration for AppSidebar.
 * Extracted for portability - can be overridden via props.
 */
import {
  LayoutGrid,
  Cpu,
  Mail,
  MessageSquare,
  List,
  Folder,
  Atom,
  ClipboardList,
  Gauge,
} from 'lucide-react';
import type { NavGroup } from '@/shared/components/AppSidebar/types';
import { ROUTES } from './routes';

/**
 * Default navigation groups for the main sidebar.
 * Uses ROUTES constants for all paths.
 */
export const defaultNavGroups: NavGroup[] = [
  {
    labelKey: 'sidebar.groups.dataManagement',
    items: [
      { path: ROUTES.dashboard, labelKey: 'sidebar.items.overview', icon: LayoutGrid },
      { path: ROUTES.executiveSummary, labelKey: 'sidebar.items.executiveSummary', icon: ClipboardList },
      { path: ROUTES.messages, labelKey: 'sidebar.items.messages', icon: Mail },
      { path: ROUTES.atoms, labelKey: 'sidebar.items.atoms', icon: Atom },
      { path: ROUTES.topics, labelKey: 'sidebar.items.topics', icon: MessageSquare },
    ],
  },
  // DORMANT: AI Operations (F014 Noise Filtering) - hidden until v1.1+
  // {
  //   labelKey: 'sidebar.groups.aiOperations',
  //   items: [
  //     { path: ROUTES.noiseFiltering, labelKey: 'sidebar.items.noiseFiltering', icon: FunnelIcon },
  //   ],
  //   action: true,
  // },
  {
    labelKey: 'sidebar.groups.aiSetup',
    items: [
      { path: ROUTES.agents, labelKey: 'sidebar.items.agents', icon: Cpu },
      { path: ROUTES.agentTasks, labelKey: 'sidebar.items.taskTemplates', icon: List },
      { path: ROUTES.projects, labelKey: 'sidebar.items.projects', icon: Folder },
    ],
  },
  {
    labelKey: 'sidebar.groups.monitoring',
    items: [
      { path: ROUTES.performance, labelKey: 'sidebar.items.performance', icon: Gauge },
    ],
  },
  // DORMANT: Automation (F015, F016) - hidden until v1.2+
  // {
  //   labelKey: 'sidebar.groups.automation',
  //   items: [
  //     { path: ROUTES.automation.dashboard, labelKey: 'sidebar.items.overview', icon: SparklesIcon },
  //     { path: ROUTES.automation.rules, labelKey: 'sidebar.items.rules', icon: Cog6ToothIcon },
  //     { path: ROUTES.automation.scheduler, labelKey: 'sidebar.items.scheduler', icon: CalendarIcon },
  //   ],
  // },
];
