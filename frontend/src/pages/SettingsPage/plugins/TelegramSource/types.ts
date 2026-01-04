/**
 * Type definitions for Telegram Integration UI wizard flow
 */

export type SetupStepId = 'bot-info' | 'webhook' | 'verify'

export interface SetupStep {
  id: SetupStepId
  title: string
  description: string
  isComplete: boolean
}

export const SETUP_STEPS: SetupStep[] = [
  {
    id: 'bot-info',
    title: 'Bot Info',
    description: 'Learn about our Telegram bot',
    isComplete: false,
  },
  {
    id: 'webhook',
    title: 'Configure Webhook',
    description: 'Set up your webhook URL',
    isComplete: false,
  },
  {
    id: 'verify',
    title: 'Verify Connection',
    description: 'Test the integration',
    isComplete: false,
  },
]

export interface WizardState {
  currentStep: SetupStepId
  stepsCompleted: Set<SetupStepId>
  isFirstTimeSetup: boolean
}

export const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || '@PulseRadarBot'
export const BOT_NAME = import.meta.env.VITE_TELEGRAM_BOT_NAME || 'Pulse Radar Bot'
