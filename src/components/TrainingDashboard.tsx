import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar, Clock, Target, TrendingUp, MapPin, Dumbbell, Apple } from 'lucide-react'
import type { ConsultationData, WorkoutPlan } from '@/types/training'

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
  const [stats, setStats] = useState({
    totalWeeks: 20,
    completedWorkouts: 0,
    totalDistance: 0,
    weeklyProgress: 0
  })

  const generateWeeklyPlan = useCallback(() => {
    // Generate a sample weekly plan based on consultation data
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const trainingDays = consultationData.training_days_per_week || 4
    
    const workouts: WorkoutPlan[] = daysOfWeek.map((day, index) => {
      const date = new Date()
      date.setDate(date.getDate() + index)
      
      // Determine workout type based on training schedule
      let workoutType: WorkoutPlan['workout_type'] = 'rest'
      let distance = 0
      let duration = 0
      let intensity: 'low' | 'moderate' | 'high' = 'low'
      let description = 'Rest day - focus on recovery'

      if (index < trainingDays) {
        switch (index) {
          case 0: // Monday - Easy run
            workoutType = 'easy_run'
            distance = 3 + (currentWeek * 0.2)
            duration = 25 + (currentWeek * 2)
            intensity = 'low'
            description = 'Easy conversational pace run to build aerobic base'
            break
          case 1: // Tuesday - Strength or intervals
            if (consultationData.gym_access) {
              workoutType = 'strength'
              duration = 45
              intensity = 'moderate'
              description = 'Runner-specific strength training: core, glutes, and leg power'
            } else {
              workoutType = 'intervals'
              distance = 4
              duration = 35
              intensity = 'high'
              description = '4x800m intervals at 5K pace with 2min recovery'
            }
            break
          case 2: // Wednesday - Easy run or recovery
            workoutType = index % 2 === 0 ? 'easy_run' : 'recovery'
            distance = 3
            duration = 25
            intensity = 'low'
            description = 'Recovery run or active recovery with stretching'
            break
          case 3: // Thursday - Tempo run
            workoutType = 'tempo_run'
            distance = 5 + (currentWeek * 0.3)
            duration = 35 + (currentWeek * 3)
            intensity = 'moderate'
            description = 'Tempo run at half-marathon pace effort'
            break
          case 4: // Friday - Easy run
            workoutType = 'easy_run'
            distance = 3
            duration = 25
            intensity = 'low'
            description = 'Easy shakeout run before long run'
            break
          case 5: // Saturday - Long run
            workoutType = 'long_run'
            distance = 6 + (currentWeek * 0.5)
            duration = 50 + (currentWeek * 5)
            intensity = 'moderate'
            description = 'Long steady run to build endurance'
            break
        }
      }

      return {
        id: `week${currentWeek}-day${index}`,
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
    })

    setWeeklyPlan(workouts)
  }, [currentWeek, consultationData])

  useEffect(() => {
    generateWeeklyPlan()
  }, [generateWeeklyPlan])

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
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => onStartWorkout(workout)}
                      disabled={workout.completed}
                    >
                      {workout.completed ? 'Completed' : 'Start Workout'}
                    </Button>
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