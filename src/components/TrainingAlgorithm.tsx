import type { ConsultationData, WorkoutPlan } from '@/types/training'

export interface WorkoutFeedback {
  workoutId: string
  rating: number // 1-5 scale
  effortLevel: number // 1-10 scale (RPE)
  energyLevel: number // 1-10 scale
  mood: string // 'great' | 'good' | 'okay' | 'tired' | 'exhausted'
  feedbackText: string
  completedDistance?: number
  completedDuration?: number
  injuries?: string[]
  timestamp: string
}

export interface TrainingState {
  currentWeek: number
  totalWeeks: number
  weeklyMileage: number
  baseWeeklyMileage: number
  peakWeeklyMileage: number
  recentFeedback: WorkoutFeedback[]
  adaptationScore: number // -2 to +2, affects training load
  injuryRisk: number // 0-10 scale
  fitnessLevel: number // 0-10 scale, improves over time
}

export class TrainingAlgorithm {
  private consultationData: ConsultationData
  private trainingState: TrainingState

  constructor(consultationData: ConsultationData, currentWeek: number = 1) {
    this.consultationData = consultationData
    this.trainingState = {
      currentWeek,
      totalWeeks: 20,
      weeklyMileage: consultationData.current_weekly_mileage || 15,
      baseWeeklyMileage: consultationData.current_weekly_mileage || 15,
      peakWeeklyMileage: Math.min((consultationData.current_weekly_mileage || 15) * 2.5, 45),
      recentFeedback: [],
      adaptationScore: 0,
      injuryRisk: 0,
      fitnessLevel: this.calculateInitialFitness()
    }
  }

  private calculateInitialFitness(): number {
    const experience = this.consultationData.running_experience
    const weeklyMileage = this.consultationData.current_weekly_mileage || 0
    
    let baseScore = 3 // Default moderate fitness
    
    // Adjust based on experience
    switch (experience) {
      case 'beginner':
        baseScore = 2
        break
      case 'intermediate':
        baseScore = 5
        break
      case 'advanced':
        baseScore = 8
        break
    }
    
    // Adjust based on current mileage
    if (weeklyMileage > 30) baseScore += 2
    else if (weeklyMileage > 20) baseScore += 1
    else if (weeklyMileage < 10) baseScore -= 1
    
    return Math.max(1, Math.min(10, baseScore))
  }

  public addWorkoutFeedback(feedback: WorkoutFeedback): void {
    this.trainingState.recentFeedback.push(feedback)
    
    // Keep only last 10 workouts for analysis
    if (this.trainingState.recentFeedback.length > 10) {
      this.trainingState.recentFeedback = this.trainingState.recentFeedback.slice(-10)
    }
    
    this.updateAdaptationScore()
    this.updateInjuryRisk()
    this.updateFitnessLevel()
  }

  private updateAdaptationScore(): void {
    if (this.trainingState.recentFeedback.length === 0) return
    
    const recentFeedback = this.trainingState.recentFeedback.slice(-5) // Last 5 workouts
    const avgRating = recentFeedback.reduce((sum, f) => sum + f.rating, 0) / recentFeedback.length
    const avgEffort = recentFeedback.reduce((sum, f) => sum + f.effortLevel, 0) / recentFeedback.length
    const avgEnergy = recentFeedback.reduce((sum, f) => sum + f.energyLevel, 0) / recentFeedback.length
    
    // Calculate adaptation score based on feedback
    let adaptationScore = 0
    
    // Good ratings and energy levels suggest we can increase load
    if (avgRating >= 4 && avgEnergy >= 7) {
      adaptationScore += 1
    } else if (avgRating >= 3.5 && avgEnergy >= 6) {
      adaptationScore += 0.5
    }
    
    // High effort with low ratings suggests overreaching
    if (avgEffort >= 8 && avgRating <= 2.5) {
      adaptationScore -= 1.5
    } else if (avgEffort >= 7 && avgRating <= 3) {
      adaptationScore -= 1
    }
    
    // Low energy consistently suggests fatigue
    if (avgEnergy <= 4) {
      adaptationScore -= 1
    }
    
    // Smooth the adaptation score
    this.trainingState.adaptationScore = (this.trainingState.adaptationScore * 0.7) + (adaptationScore * 0.3)
    this.trainingState.adaptationScore = Math.max(-2, Math.min(2, this.trainingState.adaptationScore))
  }

  private updateInjuryRisk(): void {
    if (this.trainingState.recentFeedback.length === 0) return
    
    const recentFeedback = this.trainingState.recentFeedback.slice(-3)
    let riskScore = 0
    
    // Check for injury mentions
    const hasInjuries = recentFeedback.some(f => f.injuries && f.injuries.length > 0)
    if (hasInjuries) riskScore += 3
    
    // Check for consistently high effort with low ratings
    const highEffortLowRating = recentFeedback.filter(f => f.effortLevel >= 8 && f.rating <= 2).length
    riskScore += highEffortLowRating * 1.5
    
    // Check for fatigue patterns
    const lowEnergyCount = recentFeedback.filter(f => f.energyLevel <= 4).length
    riskScore += lowEnergyCount * 0.5
    
    // Check for negative mood patterns
    const negativeMoodCount = recentFeedback.filter(f => ['tired', 'exhausted'].includes(f.mood)).length
    riskScore += negativeMoodCount * 0.5
    
    this.trainingState.injuryRisk = Math.max(0, Math.min(10, riskScore))
  }

  private updateFitnessLevel(): void {
    if (this.trainingState.recentFeedback.length === 0) return
    
    const recentFeedback = this.trainingState.recentFeedback.slice(-5)
    const avgRating = recentFeedback.reduce((sum, f) => sum + f.rating, 0) / recentFeedback.length
    const avgEnergy = recentFeedback.reduce((sum, f) => sum + f.energyLevel, 0) / recentFeedback.length
    
    // Gradual fitness improvement based on consistent good performance
    if (avgRating >= 4 && avgEnergy >= 7) {
      this.trainingState.fitnessLevel += 0.1
    } else if (avgRating >= 3.5 && avgEnergy >= 6) {
      this.trainingState.fitnessLevel += 0.05
    } else if (avgRating <= 2.5 || avgEnergy <= 4) {
      this.trainingState.fitnessLevel -= 0.05
    }
    
    this.trainingState.fitnessLevel = Math.max(1, Math.min(10, this.trainingState.fitnessLevel))
  }

  public generateWeeklyPlan(week: number): WorkoutPlan[] {
    this.trainingState.currentWeek = week
    
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const trainingDays = this.consultationData.training_days_per_week || 4
    
    // Calculate weekly mileage with periodization and adaptation
    const weeklyMileage = this.calculateWeeklyMileage(week)
    
    const workouts: WorkoutPlan[] = daysOfWeek.map((day, index) => {
      const date = new Date()
      date.setDate(date.getDate() + index)
      
      return this.generateDayWorkout(day, index, weeklyMileage, trainingDays, date)
    })
    
    return workouts
  }

  private calculateWeeklyMileage(week: number): number {
    const { baseWeeklyMileage, peakWeeklyMileage, totalWeeks, adaptationScore, injuryRisk } = this.trainingState
    
    // Base periodization (build up to peak, then taper)
    let progressionFactor: number
    
    if (week <= 2) {
      // Easy start
      progressionFactor = 0.7
    } else if (week <= 12) {
      // Build phase
      progressionFactor = 0.7 + (week - 2) * 0.03
    } else if (week <= 16) {
      // Peak phase
      progressionFactor = 1.0
    } else {
      // Taper phase
      progressionFactor = 1.0 - (week - 16) * 0.15
    }
    
    let targetMileage = baseWeeklyMileage + (peakWeeklyMileage - baseWeeklyMileage) * progressionFactor
    
    // Apply adaptation adjustments
    const adaptationMultiplier = 1 + (adaptationScore * 0.1) // ±20% max adjustment
    targetMileage *= adaptationMultiplier
    
    // Reduce mileage if injury risk is high
    if (injuryRisk >= 6) {
      targetMileage *= 0.8
    } else if (injuryRisk >= 4) {
      targetMileage *= 0.9
    }
    
    return Math.max(baseWeeklyMileage * 0.5, targetMileage)
  }

  private generateDayWorkout(
    day: string, 
    dayIndex: number, 
    weeklyMileage: number, 
    trainingDays: number, 
    date: Date
  ): WorkoutPlan {
    const { currentWeek, injuryRisk, fitnessLevel } = this.trainingState
    
    // Determine if this is a training day
    const isTrainingDay = dayIndex < trainingDays
    
    if (!isTrainingDay) {
      return {
        id: `week${currentWeek}-day${dayIndex}`,
        user_id: 'user',
        week_number: currentWeek,
        date: date.toISOString().split('T')[0],
        workout_type: 'rest',
        distance: 0,
        duration: 0,
        intensity: 'low',
        description: injuryRisk >= 4 ? 
          'Rest day - focus on recovery and injury prevention' : 
          'Rest day - light stretching or walking optional',
        completed: false,
        created_at: new Date().toISOString()
      }
    }
    
    // Distribute weekly mileage across training days
    const workoutTypes = this.getWorkoutTypeDistribution(trainingDays, currentWeek)
    const workoutType = workoutTypes[dayIndex] || 'easy_run'
    
    return this.createSpecificWorkout(workoutType, dayIndex, weeklyMileage, trainingDays, date)
  }

  private getWorkoutTypeDistribution(trainingDays: number, week: number): (WorkoutPlan['workout_type'])[] {
    const { injuryRisk, fitnessLevel } = this.trainingState
    
    // Base distribution patterns
    const patterns: Record<number, (WorkoutPlan['workout_type'])[]> = {
      3: ['easy_run', 'tempo_run', 'long_run'],
      4: ['easy_run', 'intervals', 'easy_run', 'long_run'],
      5: ['easy_run', 'intervals', 'easy_run', 'tempo_run', 'long_run'],
      6: ['easy_run', 'intervals', 'recovery', 'tempo_run', 'easy_run', 'long_run'],
      7: ['easy_run', 'intervals', 'recovery', 'tempo_run', 'easy_run', 'long_run', 'recovery']
    }
    
    let distribution = patterns[Math.min(trainingDays, 7)] || patterns[4]
    
    // Modify based on injury risk
    if (injuryRisk >= 6) {
      // Replace high-intensity workouts with recovery
      distribution = distribution.map(type => 
        ['intervals', 'tempo_run'].includes(type) ? 'recovery' : type
      )
    } else if (injuryRisk >= 4) {
      // Reduce one high-intensity workout
      const intensiveIndex = distribution.findIndex(type => type === 'intervals')
      if (intensiveIndex !== -1) {
        distribution[intensiveIndex] = 'easy_run'
      }
    }
    
    // Add strength training if gym access and appropriate fitness level
    if (this.consultationData.gym_access && fitnessLevel >= 4 && week >= 3) {
      const easyRunIndex = distribution.findIndex(type => type === 'easy_run')
      if (easyRunIndex !== -1 && Math.random() > 0.5) {
        distribution[easyRunIndex] = 'strength'
      }
    }
    
    return distribution
  }

  private createSpecificWorkout(
    workoutType: WorkoutPlan['workout_type'],
    dayIndex: number,
    weeklyMileage: number,
    trainingDays: number,
    date: Date
  ): WorkoutPlan {
    const { currentWeek, fitnessLevel, adaptationScore } = this.trainingState
    
    let distance = 0
    let duration = 0
    let intensity: 'low' | 'moderate' | 'high' = 'low'
    let description = ''
    
    // Base calculations
    const avgDailyMileage = weeklyMileage / trainingDays
    const fitnessMultiplier = 0.8 + (fitnessLevel / 10) * 0.4 // 0.8 to 1.2
    const adaptationMultiplier = 1 + (adaptationScore * 0.1)
    
    switch (workoutType) {
      case 'easy_run':
        distance = avgDailyMileage * 0.8 * fitnessMultiplier
        duration = distance * 9 // ~9 min/mile easy pace
        intensity = 'low'
        description = 'Easy conversational pace run to build aerobic base'
        break
        
      case 'long_run':
        distance = Math.min(avgDailyMileage * 2.2, weeklyMileage * 0.4) * fitnessMultiplier
        duration = distance * 9.5 // Slightly slower for long runs
        intensity = 'moderate'
        description = `Long steady run to build endurance - ${distance.toFixed(1)} miles`
        break
        
      case 'tempo_run': {
        const tempoDistance = Math.min(avgDailyMileage * 1.2, 8) * fitnessMultiplier
        distance = tempoDistance + 2 // Include warm-up/cool-down
        duration = 15 + (tempoDistance * 7.5) + 15 // WU + tempo + CD
        intensity = 'moderate'
        description = `${tempoDistance.toFixed(1)}mi tempo at half-marathon pace (with warm-up/cool-down)`
        break
      }
        
      case 'intervals': {
        distance = avgDailyMileage * 1.1 * fitnessMultiplier
        duration = 45 + (currentWeek * 2) // Progressive interval sessions
        intensity = 'high'
        const intervalType = currentWeek <= 8 ? '800m' : '1000m'
        description = `${Math.ceil(currentWeek / 3)}x${intervalType} intervals at 5K pace with recovery`
        break
      }
        
      case 'strength':
        distance = 0
        duration = 45 + (fitnessLevel * 2) // Longer sessions for fitter athletes
        intensity = 'moderate'
        description = 'Runner-specific strength: core, glutes, single-leg stability, and power'
        break
        
      case 'recovery':
        distance = avgDailyMileage * 0.5 * fitnessMultiplier
        duration = distance * 10 // Very easy pace
        intensity = 'low'
        description = 'Recovery run or active recovery with dynamic stretching'
        break
        
      default:
        distance = 0
        duration = 0
        intensity = 'low'
        description = 'Rest day - focus on recovery'
    }
    
    // Apply final adaptations
    distance *= adaptationMultiplier
    duration *= adaptationMultiplier
    
    // Round to reasonable values
    distance = Math.round(distance * 10) / 10
    duration = Math.round(duration)
    
    return {
      id: `week${currentWeek}-day${dayIndex}`,
      user_id: 'user',
      week_number: currentWeek,
      date: date.toISOString().split('T')[0],
      workout_type: workoutType,
      distance,
      duration,
      intensity,
      description,
      completed: false,
      created_at: new Date().toISOString()
    }
  }

  public getTrainingInsights(): {
    adaptationStatus: string
    injuryRiskLevel: string
    fitnessProgress: string
    recommendations: string[]
  } {
    const { adaptationScore, injuryRisk, fitnessLevel } = this.trainingState
    
    let adaptationStatus = 'Maintaining'
    if (adaptationScore > 0.5) adaptationStatus = 'Progressing well'
    else if (adaptationScore < -0.5) adaptationStatus = 'Need recovery'
    
    let injuryRiskLevel = 'Low'
    if (injuryRisk >= 6) injuryRiskLevel = 'High'
    else if (injuryRisk >= 4) injuryRiskLevel = 'Moderate'
    
    let fitnessProgress = 'Steady'
    if (fitnessLevel >= 8) fitnessProgress = 'Excellent'
    else if (fitnessLevel >= 6) fitnessProgress = 'Good'
    else if (fitnessLevel <= 3) fitnessProgress = 'Building'
    
    const recommendations: string[] = []
    
    if (injuryRisk >= 6) {
      recommendations.push('Focus on recovery and consider reducing training intensity')
      recommendations.push('Schedule a rest day or easy recovery run')
    } else if (adaptationScore > 1) {
      recommendations.push('Your body is adapting well - consider a slight increase in training load')
    } else if (adaptationScore < -1) {
      recommendations.push('Signs of fatigue detected - prioritize sleep and nutrition')
    }
    
    if (fitnessLevel >= 7 && injuryRisk < 3) {
      recommendations.push('Great fitness progress! You can handle more challenging workouts')
    }
    
    return {
      adaptationStatus,
      injuryRiskLevel,
      fitnessProgress,
      recommendations
    }
  }

  public getTrainingState(): TrainingState {
    return { ...this.trainingState }
  }
}