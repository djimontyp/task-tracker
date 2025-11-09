import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/config/api'
import type {
  SchedulerJob,
  CreateJobRequest,
  UpdateJobRequest,
  AutomationRule,
  CreateRuleRequest,
  UpdateRuleRequest,
  RuleTemplate,
  RulePreviewResponse,
  AutomationStats,
  AutomationTrend,
  JobExecutionHistory,
} from '../types'

class AutomationService {
  async getStats(): Promise<AutomationStats> {
    const response = await apiClient.get(API_ENDPOINTS.automation.stats)
    return response.data
  }

  async getTrends(period: string): Promise<AutomationTrend[]> {
    const response = await apiClient.get(API_ENDPOINTS.automation.trends(period))
    return response.data
  }

  async getRules(): Promise<AutomationRule[]> {
    const response = await apiClient.get(API_ENDPOINTS.automation.rules)
    const { rules } = response.data
    return rules.map((rule: any) => ({
      ...rule,
      conditions: typeof rule.conditions === 'string'
        ? JSON.parse(rule.conditions)
        : rule.conditions,
      success_rate: rule.success_count > 0
        ? (rule.success_count / rule.triggered_count) * 100
        : 0
    }))
  }

  async getRule(ruleId: string): Promise<AutomationRule> {
    const response = await apiClient.get(API_ENDPOINTS.automation.rule(ruleId))
    const rule = response.data
    return {
      ...rule,
      conditions: typeof rule.conditions === 'string'
        ? JSON.parse(rule.conditions)
        : rule.conditions,
      success_rate: rule.success_count > 0
        ? (rule.success_count / rule.triggered_count) * 100
        : 0
    }
  }

  async createRule(data: CreateRuleRequest): Promise<AutomationRule> {
    const response = await apiClient.post(API_ENDPOINTS.automation.rules, data)
    return response.data
  }

  async updateRule(ruleId: string, data: UpdateRuleRequest): Promise<AutomationRule> {
    const response = await apiClient.put(API_ENDPOINTS.automation.rule(ruleId), data)
    return response.data
  }

  async deleteRule(ruleId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.automation.rule(ruleId))
  }

  async getRuleTemplates(): Promise<RuleTemplate[]> {
    const response = await apiClient.get(API_ENDPOINTS.automation.ruleTemplates)
    return response.data
  }

  async evaluateRule(conditions: string, action: string): Promise<RulePreviewResponse> {
    const response = await apiClient.post(API_ENDPOINTS.automation.ruleEvaluate, {
      conditions,
      action,
    })
    return response.data
  }

  async getJobs(): Promise<SchedulerJob[]> {
    const response = await apiClient.get(API_ENDPOINTS.scheduler.jobs)
    return response.data
  }

  async getJob(jobId: string): Promise<SchedulerJob> {
    const response = await apiClient.get(API_ENDPOINTS.scheduler.job(jobId))
    return response.data
  }

  async createJob(data: CreateJobRequest): Promise<SchedulerJob> {
    const response = await apiClient.post(API_ENDPOINTS.scheduler.jobs, data)
    return response.data
  }

  async updateJob(jobId: string, data: UpdateJobRequest): Promise<SchedulerJob> {
    const response = await apiClient.put(API_ENDPOINTS.scheduler.job(jobId), data)
    return response.data
  }

  async deleteJob(jobId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.scheduler.job(jobId))
  }

  async triggerJob(jobId: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.scheduler.jobTrigger(jobId))
  }

  async toggleJob(jobId: string): Promise<SchedulerJob> {
    const response = await apiClient.post(API_ENDPOINTS.scheduler.jobToggle(jobId))
    return response.data
  }

  async getJobExecutionHistory(jobId: string): Promise<JobExecutionHistory[]> {
    const response = await apiClient.get(`${API_ENDPOINTS.scheduler.job(jobId)}/history`)
    return response.data
  }

}

export const automationService = new AutomationService()

export function useAutomationStats() {
  return useQuery({
    queryKey: ['automation-stats'],
    queryFn: () => automationService.getStats(),
  })
}

export function useAutomationTrends(period: string) {
  return useQuery({
    queryKey: ['automation-trends', period],
    queryFn: () => automationService.getTrends(period),
  })
}

export function useAutomationRules() {
  return useQuery({
    queryKey: ['automation-rules'],
    queryFn: () => automationService.getRules(),
  })
}

export function useRuleTemplates() {
  return useQuery({
    queryKey: ['rule-templates'],
    queryFn: () => automationService.getRuleTemplates(),
  })
}

export function useCreateRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateRuleRequest) => automationService.createRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] })
    },
  })
}

export function useUpdateRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ ruleId, data }: { ruleId: string; data: UpdateRuleRequest }) =>
      automationService.updateRule(ruleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] })
    },
  })
}

export function useDeleteRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ruleId: string) => automationService.deleteRule(ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] })
    },
  })
}

export function useSchedulerJobs() {
  return useQuery({
    queryKey: ['scheduler-jobs'],
    queryFn: () => automationService.getJobs(),
  })
}

export function useCreateJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateJobRequest) => automationService.createJob(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduler-jobs'] })
    },
  })
}

export function useUpdateJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: UpdateJobRequest }) =>
      automationService.updateJob(jobId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduler-jobs'] })
    },
  })
}

export function useDeleteJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (jobId: string) => automationService.deleteJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduler-jobs'] })
    },
  })
}

export function useTriggerJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (jobId: string) => automationService.triggerJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduler-jobs'] })
    },
  })
}

export function useToggleJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (jobId: string) => automationService.toggleJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduler-jobs'] })
    },
  })
}

