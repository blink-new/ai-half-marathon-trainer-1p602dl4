import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  MapPin, 
  Target, 
  Heart,
  TrendingUp,
  CheckCircle,
  ArrowLeft
} from 'lucide-react'
import type { WorkoutPlan } from '@/types/training'

interface WorkoutDetailProps {
  workout: WorkoutPlan
  onComplete: (workoutId: string) => void
  onBack: () => void
}

export function WorkoutDetail({ workout, onComplete, onBack }: WorkoutDetailProps) {
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [currentDistance, setCurrentDistance] = useState(0)
  const [currentPace, setCurrentPace] = useState('0:00')

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isActive && !isPaused) {
      interval = setInterval(() => {
        setElapsedTime(time => time + 1)
      }, 1000)
    } else if (!isActive && elapsedTime !== 0) {
      if (interval) clearInterval(interval)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, isPaused, elapsedTime])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleStart = () => {
    setIsActive(true)
    setIsPaused(false)
  }

  const handlePause = () => {
    setIsPaused(!isPaused)
  }

  const handleStop = () => {
    setIsActive(false)
    setIsPaused(false)
    // Show completion dialog
    onComplete(workout.id)
  }

  const getWorkoutInstructions = () => {
    switch (workout.workout_type) {
      case 'easy_run':
        return {
          title: 'Easy Run Guidelines',
          instructions: [
            'Maintain a conversational pace - you should be able to talk while running',
            'Focus on time rather than speed',
            'Land midfoot and maintain good posture',
            'Breathe naturally and rhythmically'
          ]
        }
      case 'tempo_run':
        return {
          title: 'Tempo Run Guidelines',
          instructions: [
            'Run at your half-marathon race pace',
            'Should feel "comfortably hard" - sustainable but challenging',
            'Focus on maintaining consistent effort throughout',
            'Use controlled breathing (3:2 or 2:2 pattern)'
          ]
        }
      case 'intervals':
        return {
          title: 'Interval Training Guidelines',
          instructions: [
            'Warm up with 10-15 minutes easy running',
            'Run intervals at 5K pace with full recovery between',
            'Focus on form and consistent splits',
            'Cool down with 10-15 minutes easy running'
          ]
        }
      case 'long_run':
        return {
          title: 'Long Run Guidelines',
          instructions: [
            'Start slower than your easy run pace',
            'Gradually build to comfortable aerobic effort',
            'Practice race-day nutrition and hydration',
            'Focus on time on feet rather than speed'
          ]
        }
      case 'strength':
        return {
          title: 'Strength Training Guidelines',
          instructions: [
            'Focus on runner-specific movements',
            'Emphasize core stability and glute activation',
            'Include single-leg exercises for balance',
            'Maintain good form over heavy weights'
          ]
        }
      default:
        return {
          title: 'Workout Guidelines',
          instructions: ['Follow the workout description and listen to your body']
        }
    }
  }

  const workoutGuide = getWorkoutInstructions()
  const progress = workout.duration ? (elapsedTime / (workout.duration * 60)) * 100 : 0

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 capitalize">
                {workout.workout_type.replace('_', ' ')}
              </h1>
              <p className="text-slate-600">
                {new Date(workout.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Workout Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Workout Timer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Workout Timer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-6xl font-mono font-bold text-slate-900 mb-2">
                    {formatTime(elapsedTime)}
                  </div>
                  <div className="text-sm text-slate-600">
                    {workout.duration ? `Target: ${workout.duration} minutes` : 'No time target'}
                  </div>
                </div>

                {workout.duration && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Progress</span>
                      <span>{Math.min(100, Math.round(progress))}%</span>
                    </div>
                    <Progress value={Math.min(100, progress)} className="h-2" />
                  </div>
                )}

                <div className="flex justify-center gap-3">
                  {!isActive ? (
                    <Button onClick={handleStart} size="lg" className="px-8">
                      <Play className="w-5 h-5 mr-2" />
                      Start Workout
                    </Button>
                  ) : (
                    <>
                      <Button onClick={handlePause} variant="outline" size="lg">
                        {isPaused ? (
                          <>
                            <Play className="w-5 h-5 mr-2" />
                            Resume
                          </>
                        ) : (
                          <>
                            <Pause className="w-5 h-5 mr-2" />
                            Pause
                          </>
                        )}
                      </Button>
                      <Button onClick={handleStop} variant="destructive" size="lg">
                        <Square className="w-5 h-5 mr-2" />
                        Complete
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Workout Stats */}
            {workout.workout_type !== 'rest' && (
              <Card>
                <CardHeader>
                  <CardTitle>Workout Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {workout.distance && (
                      <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <MapPin className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-slate-900">
                          {workout.distance.toFixed(1)}
                        </div>
                        <div className="text-sm text-slate-600">miles</div>
                      </div>
                    )}
                    
                    {workout.duration && (
                      <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <Clock className="w-6 h-6 text-green-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-slate-900">
                          {workout.duration}
                        </div>
                        <div className="text-sm text-slate-600">minutes</div>
                      </div>
                    )}
                    
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <Target className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-slate-900 capitalize">
                        {workout.intensity}
                      </div>
                      <div className="text-sm text-slate-600">intensity</div>
                    </div>
                    
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <Heart className="w-6 h-6 text-red-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-slate-900">
                        {currentPace}
                      </div>
                      <div className="text-sm text-slate-600">pace</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Workout Description */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Workout</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className="mb-3 capitalize">
                  {workout.workout_type.replace('_', ' ')}
                </Badge>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {workout.description}
                </p>
              </CardContent>
            </Card>

            {/* Workout Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>{workoutGuide.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {workoutGuide.instructions.map((instruction, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      {instruction}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5" />
                  <span className="text-slate-600">
                    Listen to your body and adjust intensity as needed
                  </span>
                </div>
                <Separator />
                <div className="flex items-start gap-2 text-sm">
                  <Heart className="w-4 h-4 text-red-600 mt-0.5" />
                  <span className="text-slate-600">
                    Stay hydrated throughout your workout
                  </span>
                </div>
                <Separator />
                <div className="flex items-start gap-2 text-sm">
                  <Target className="w-4 h-4 text-orange-600 mt-0.5" />
                  <span className="text-slate-600">
                    Focus on form over speed
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}