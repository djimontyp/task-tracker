export interface NoiseClassification {
  id: string
  message_id: string
  author_name: string
  content: string
  is_signal: boolean
  confidence: number
  classified_at: string
  needs_review: boolean
  source: string
}

export interface NoiseSource {
  name: string
  count: number
}

export interface NoiseStats {
  total_messages: number
  signal_count: number
  noise_count: number
  signal_ratio: number
  needs_review: number
  trend: NoiseTrendData[]
  top_noise_sources: NoiseSource[]
}

export interface NoiseTrendData {
  date: string
  signal: number
  noise: number
  weak_signal: number
}

export interface NoiseFilters {
  start_date?: string
  end_date?: string
  source?: string
  needs_review?: boolean
}
