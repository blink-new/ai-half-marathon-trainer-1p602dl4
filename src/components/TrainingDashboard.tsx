import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar, Clock, Target, TrendingUp, MapPin, Dumbbell, Apple, AlertTriangle, CheckCircle } from 'lucide-react'
import type { ConsultationData, WorkoutPlan } from '@/types/training'
import { TrainingAlgorithm, type WorkoutFeedback } from '@/components/TrainingAlgorithm'

interface TrainingDashboardProps {
  consultationData: ConsultationData
  onStartWorkout: (workout: WorkoutPlan) => void
  onViewNutrition: () => void
  currentWeek: number
  onWeekChange: (week: number) => void
}

export function TrainingDashboard({ 
  consultationData, 
  onStartWorkout, 
  onViewNutrition, 
  currentWeek, 
  onWeekChange 
}: TrainingDashboardProps) {
  const [weeklyPlan, setWeeklyPlan] = useState<WorkoutPlan[]>([])
  const [trainingAlgorithm, setTrainingAlgorithm] = useState<TrainingAlgorithm | null>(null)
  const [trainingInsights, setTrainingInsights] = useState({
    adaptationStatus: 'Maintaining',
    injuryRiskLevel: 'Low',
    fitnessProgress: 'Steady',
    recommendations: [] as string[]
  })
  const [stats, setStats] = useState({
    totalWeeks: 20,
    completedWorkouts: 0,
    totalDistance: 0,
    weeklyProgress: 0
  })

  // Initialize training algorithm
  useEffect(() => {
    const algorithm = new TrainingAlgorithm(consultationData, currentWeek)
    setTrainingAlgorithm(algorithm)
    
    // Load any existing feedback from localStorage
    const savedFeedback = localStorage.getItem('trainingFeedback')
    if (savedFeedback) {
      try {
        const feedback: WorkoutFeedback[] = JSON.parse(savedFeedback)
        feedback.forEach(f => algorithm.addWorkoutFeedback(f))
      } catch (error) {
        console.error('Error loading saved feedback:', error)
      }
    }
    
    setTrainingInsights(algorithm.getTrainingInsights())
  }, [consultationData, currentWeek])

  const generateWeeklyPlan = useCallback(() => {
    if (!trainingAlgorithm) return
    
    const workouts = trainingAlgorithm.generateWeeklyPlan(currentWeek)
    setWeeklyPlan(workouts)
    
    // Update insights after generating plan
    setTrainingInsights(trainingAlgorithm.getTrainingInsights())
    
    // Calculate stats
    const completedCount = workouts.filter(w => w.completed).length
    const totalDistance = workouts.reduce((sum, w) => sum + (w.distance || 0), 0)
    const trainingWorkouts = workouts.filter(w => w.workout_type !== 'rest').length
    const weeklyProgress = trainingWorkouts > 0 ? (completedCount / trainingWorkouts) * 100 : 0
    
    setStats(prev => ({
      ...prev,
      completedWorkouts: completedCount,
      totalDistance,
      weeklyProgress
    }))
  }, [currentWeek, trainingAlgorithm])

  useEffect(() => {
    generateWeeklyPlan()
  }, [generateWeeklyPlan])

  // Function to simulate workout feedback (for testing)
  const addSampleFeedback = (workoutId: string) => {
    if (!trainingAlgorithm) return
    
    const sampleFeedback: WorkoutFeedback = {
      workoutId,
      rating: Math.floor(Math.random() * 3) + 3, // 3-5 rating
      effortLevel: Math.floor(Math.random() * 4) + 5, // 5-8 effort
      energyLevel: Math.floor(Math.random() * 4) + 6, // 6-9 energy
      mood: ['good', 'great', 'okay'][Math.floor(Math.random() * 3)],
      feedbackText: 'Felt good during this workout',
      timestamp: new Date().toISOString()
    }
    
    trainingAlgorithm.addWorkoutFeedback(sampleFeedback)
    
    // Save to localStorage
    const existingFeedback = JSON.parse(localStorage.getItem('trainingFeedback') || '[]')
    existingFeedback.push(sampleFeedback)
    localStorage.setItem('trainingFeedback', JSON.stringify(existingFeedback))
    
    // Regenerate plan with new feedback
    generateWeeklyPlan()
  }

  const getWorkoutIcon = (type: WorkoutPlan['workout_type']) => {
    switch (type) {
      case 'easy_run':
      case 'long_run':
      case 'tempo_run':
        return <MapPin className="w-4 h-4" />
      case 'intervals':
        return <TrendingUp className="w-4 h-4" />
      case 'strength':
        return <Dumbbell className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getWorkoutColor = (type: WorkoutPlan['workout_type']) => {
    switch (type) {
      case 'easy_run':
        return 'bg-green-100 text-green-800'
      case 'long_run':
        return 'bg-blue-100 text-blue-800'
      case 'tempo_run':
        return 'bg-orange-100 text-orange-800'
      case 'intervals':
        return 'bg-red-100 text-red-800'
      case 'strength':
        return 'bg-purple-100 text-purple-800'
      case 'recovery':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const raceDate = new Date('2025-10-15') // October 2025
  const today = new Date()
  const daysUntilRace = Math.ceil((raceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const weeksUntilRace = Math.ceil(daysUntilRace / 7)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {consultationData.name ? `${consultationData.name}'s Training Dashboard` : 'Training Dashboard'}
              </h1>
              <p className="text-slate-600 mt-1">Your personalized half-marathon preparation</p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={onViewNutrition}
                className="flex items-center gap-2"
              >
                <Apple className="w-4 h-4" />
                Nutrition & Supplements
              </Button>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{daysUntilRace} days</div>
                <div className="text-sm text-slate-600">until race day</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Training Insights */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                AI Training Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    trainingInsights.adaptationStatus === 'Progressing well' ? 'bg-green-100' :
                    trainingInsights.adaptationStatus === 'Need recovery' ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    <CheckCircle className={`w-4 h-4 ${
                      trainingInsights.adaptationStatus === 'Progressing well' ? 'text-green-600' :
                      trainingInsights.adaptationStatus === 'Need recovery' ? 'text-red-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">{trainingInsights.adaptationStatus}</div>
                    <div className="text-sm text-slate-600">Adaptation Status</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    trainingInsights.injuryRiskLevel === 'Low' ? 'bg-green-100' :
                    trainingInsights.injuryRiskLevel === 'High' ? 'bg-red-100' : 'bg-yellow-100'
                  }`}>
                    <AlertTriangle className={`w-4 h-4 ${
                      trainingInsights.injuryRiskLevel === 'Low' ? 'text-green-600' :
                      trainingInsights.injuryRiskLevel === 'High' ? 'text-red-600' : 'text-yellow-600'
                    }`} />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">{trainingInsights.injuryRiskLevel} Risk</div>
                    <div className="text-sm text-slate-600">Injury Risk</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Target className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">{trainingInsights.fitnessProgress}</div>
                    <div className="text-sm text-slate-600">Fitness Progress</div>
                  </div>
                </div>
              </div>

              {trainingInsights.recommendations.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-slate-900 mb-2">AI Recommendations:</h4>
                  <ul className="space-y-1">
                    {trainingInsights.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-slate-700 flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">Week {currentWeek}</div>
                  <div className="text-sm text-slate-600">of {stats.totalWeeks}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Target className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{stats.completedWorkouts}</div>
                  <div className="text-sm text-slate-600">workouts completed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{stats.totalDistance.toFixed(1)}</div>
                  <div className="text-sm text-slate-600">miles logged</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{stats.weeklyProgress}%</div>
                  <div className="text-sm text-slate-600">weekly progress</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => onWeekChange(Math.max(1, currentWeek - 1))}
              disabled={currentWeek === 1}
            >
              Previous Week
            </Button>
            <h2 className="text-xl font-semibold text-slate-900">
              Week {currentWeek} Training Plan
            </h2>
            <Button
              variant="outline"
              onClick={() => onWeekChange(Math.min(stats.totalWeeks, currentWeek + 1))}
              disabled={currentWeek === stats.totalWeeks}
            >
              Next Week
            </Button>
          </div>
          <div className="text-sm text-slate-600">
            {weeksUntilRace} weeks until race
          </div>
        </div>

        {/* Weekly Plan */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {weeklyPlan.map((workout) => (
            <Card key={workout.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {new Date(workout.date).toLocaleDateString('en-US', { weekday: 'long' })}
                  </CardTitle>
                  <Badge className={getWorkoutColor(workout.workout_type)}>
                    {getWorkoutIcon(workout.workout_type)}
                    <span className="ml-1 capitalize">
                      {workout.workout_type.replace('_', ' ')}
                    </span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {workout.description}
                  </p>
                  
                  {workout.workout_type !== 'rest' && (
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      {workout.distance > 0 && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {workout.distance.toFixed(1)} mi
                        </div>
                      )}
                      {workout.duration > 0 && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {workout.duration} min
                        </div>
                      )}
                    </div>
                  )}

                  {workout.workout_type !== 'rest' && (
                    <div className="space-y-2">
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => onStartWorkout(workout)}
                        disabled={workout.completed}
                      >
                        {workout.completed ? 'Completed' : 'Start Workout'}
                      </Button>
                      
                      {/* Testing button for feedback simulation */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs"
                        onClick={() => addSampleFeedback(workout.id)}
                      >
                        Add Sample Feedback
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Weekly Progress */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Weekly Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Workouts completed this week</span>
                <span>{weeklyPlan.filter(w => w.completed).length} / {weeklyPlan.filter(w => w.workout_type !== 'rest').length}</span>
              </div>
              <Progress value={stats.weeklyProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}