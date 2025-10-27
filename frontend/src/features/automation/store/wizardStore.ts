import { create } from 'zustand'
import type { WizardFormData } from '../types'

interface WizardState {
  currentStep: number
  formData: WizardFormData
  isValid: {
    schedule: boolean
    rules: boolean
    notifications: boolean
  }
  setCurrentStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  updateSchedule: (data: Partial<WizardFormData['schedule']>) => void
  updateRules: (data: Partial<WizardFormData['rules']>) => void
  updateNotifications: (data: Partial<WizardFormData['notifications']>) => void
  setStepValidity: (step: 'schedule' | 'rules' | 'notifications', isValid: boolean) => void
  resetWizard: () => void
}

const initialFormData: WizardFormData = {
  schedule: {
    preset: 'daily',
    cron_expression: '0 9 * * *',
  },
  rules: {
    confidence_threshold: 80,
    similarity_threshold: 85,
    action: 'approve',
  },
  notifications: {
    email_enabled: false,
    telegram_enabled: false,
    pending_threshold: 10,
    digest_enabled: false,
    digest_frequency: 'daily',
  },
}

export const useWizardStore = create<WizardState>((set) => ({
  currentStep: 0,
  formData: initialFormData,
  isValid: {
    schedule: true,
    rules: true,
    notifications: true,
  },

  setCurrentStep: (step) => set({ currentStep: step }),

  nextStep: () =>
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, 3),
    })),

  prevStep: () =>
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 0),
    })),

  updateSchedule: (data) =>
    set((state) => ({
      formData: {
        ...state.formData,
        schedule: {
          ...state.formData.schedule,
          ...data,
        },
      },
    })),

  updateRules: (data) =>
    set((state) => ({
      formData: {
        ...state.formData,
        rules: {
          ...state.formData.rules,
          ...data,
        },
      },
    })),

  updateNotifications: (data) =>
    set((state) => ({
      formData: {
        ...state.formData,
        notifications: {
          ...state.formData.notifications,
          ...data,
        },
      },
    })),

  setStepValidity: (step, isValid) =>
    set((state) => ({
      isValid: {
        ...state.isValid,
        [step]: isValid,
      },
    })),

  resetWizard: () =>
    set({
      currentStep: 0,
      formData: initialFormData,
      isValid: {
        schedule: true,
        rules: true,
        notifications: true,
      },
    }),
}))
