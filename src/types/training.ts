export interface UserProfile {
  id: string
  user_id: string
  name: string
  email: string
  goal_type: 'finish' | 'time_target'
  target_time?: string
  current_weekly_mileage: number
  typical_pace: string
  running_experience: 'beginner' | 'intermediate' | 'advanced'
  past_injuries?: string
  training_days_per_week: number
  preferred_training_time: 'morning' | 'afternoon' | 'evening'
  gym_access: boolean
  dietary_restrictions?: string
  race_date: string
  created_at: string
  updated_at: string
}

export interface WorkoutPlan {
  id: string
  user_id: string
  week_number: number
  date: string
  workout_type: 'easy_run' | 'long_run' | 'tempo_run' | 'intervals' | 'strength' | 'rest' | 'recovery'
  distance?: number
  duration?: number
  intensity: 'low' | 'moderate' | 'high'
  description: string
  completed: boolean
  feedback?: string
  created_at: string
}

export interface ChatMessage {
  id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  consultation_step?: string
}

export interface ConsultationData {
  name?: string
  goal_type?: 'finish' | 'time_target'
  target_time?: string
  current_weekly_mileage?: number
  typical_pace?: string
  running_experience?: 'beginner' | 'intermediate' | 'advanced'
  past_injuries?: string
  training_days_per_week?: number
  preferred_training_time?: 'morning' | 'afternoon' | 'evening'
  gym_access?: boolean
  dietary_restrictions?: string
}