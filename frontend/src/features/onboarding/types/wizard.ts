/**
 * Types for Dashboard Setup Wizard (Cold Start)
 *
 * SetupWizard - inline grid wizard for Dashboard empty state
 * Different from OnboardingWizard (modal, 5 steps)
 */

// ═══════════════════════════════════════════════════════════════
// STEP STATUS
// ═══════════════════════════════════════════════════════════════

/**
 * Step status in the setup wizard flow
 * - pending: Not started, waiting for user
 * - active: Currently actionable
 * - completed: Successfully finished
 * - locked: Blocked by prerequisites
 */
export type StepStatus = 'pending' | 'active' | 'completed' | 'locked';

// ═══════════════════════════════════════════════════════════════
// WIZARD STEP
// ═══════════════════════════════════════════════════════════════

/**
 * Configuration for a single setup wizard step
 */
export interface WizardStep {
  /** Unique step identifier (1-4) */
  id: number;
  /** i18n key for step title */
  titleKey: string;
  /** i18n key for step description */
  descriptionKey: string;
  /** Current status of this step */
  status: StepStatus;
  /** Lucide icon name for this step */
  icon: string;
}

// ═══════════════════════════════════════════════════════════════
// SETUP WIZARD PROPS
// ═══════════════════════════════════════════════════════════════

/**
 * Props for SetupWizard component
 */
export interface SetupWizardProps {
  /** Status for step 1: Connect Sources */
  step1Status: StepStatus;
  /** Status for step 2: First Project */
  step2Status: StepStatus;
  /** Status for step 3: Activate Agent */
  step3Status: StepStatus;
  /** Status for step 4: First Insight (always derived) */
  step4Status: StepStatus;
  /** Callback when user clicks Connect Source action */
  onConnectSource?: () => void;
  /** Callback when user clicks Create Project action */
  onCreateProject?: () => void;
  /** Callback when user clicks Activate Agent action */
  onActivateAgent?: () => void;
}

/**
 * Props for SetupStep component
 */
export interface SetupStepProps {
  /** Step number (1-4) */
  stepNumber: number;
  /** Step title text */
  title: string;
  /** Step description text */
  description: string;
  /** Current step status */
  status: StepStatus;
  /** Lucide icon component */
  icon: React.ReactNode;
  /** Optional children for action buttons */
  children?: React.ReactNode;
}
