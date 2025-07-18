import { useState, useEffect } from 'react'
import { ConsultationChat } from '@/components/ConsultationChat'
import { TrainingDashboard } from '@/components/TrainingDashboard'
import { WorkoutDetail } from '@/components/WorkoutDetail'
import { PostWorkoutDebrief } from '@/components/PostWorkoutDebrief'
import { NutritionPlanner } from '@/components/NutritionPlanner'
import { TestingBackdoor } from '@/components/TestingBackdoor'
import { blink } from '@/blink/client'
import type { ConsultationData, WorkoutPlan } from '@/types/training'

type AppView = 'consultation' | 'dashboard' | 'workout' | 'debrief' | 'nutrition'

interface WorkoutFeedback {
  rating: number
  effortLevel: number
  energyLevel: number
  mood: string
  feedbackText: string
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [consultationComplete, setConsultationComplete] = useState(false)
  const [consultationData, setConsultationData] = useState<ConsultationData>({})
  const [currentView, setCurrentView] = useState<AppView>('consultation')
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutPlan | null>(null)
  const [currentWeek, setCurrentWeek] = useState(1)
  const [showTestingBackdoor, setShowTestingBackdoor] = useState(false)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  // Global testing backdoor keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault()
        setShowTestingBackdoor(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleConsultationComplete = (data: ConsultationData) => {
    setConsultationData(data)
    setConsultationComplete(true)
    setCurrentView('dashboard')
  }

  const handleStartWorkout = (workout: WorkoutPlan) => {
    setSelectedWorkout(workout)
    setCurrentView('workout')
  }

  const handleWorkoutComplete = (workoutId: string) => {
    setCurrentView('debrief')
  }

  const handleDebriefComplete = (feedback: WorkoutFeedback) => {
    console.log('Workout feedback:', feedback)
    // TODO: Save feedback to database
    setCurrentView('dashboard')
  }

  const handleDebriefSkip = () => {
    setCurrentView('dashboard')
  }

  const handleBackToDashboard = () => {
    setCurrentView('dashboard')
  }

  const handleViewNutrition = () => {
    setCurrentView('nutrition')
  }

  const handleTestingProfileGenerate = (profileData: ConsultationData) => {
    // Skip consultation and go straight to dashboard with generated profile
    setConsultationData(profileData)
    setConsultationComplete(true)
    setCurrentView('dashboard')
    setShowTestingBackdoor(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your training companion...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">AI Half-Marathon Training Companion</h1>
            <p className="text-slate-600 mb-6">Your intelligent training partner for half-marathon success</p>
            <button
              onClick={() => blink.auth.login()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
        
        {/* Global Testing Backdoor */}
        {showTestingBackdoor && (
          <TestingBackdoor
            onClose={() => setShowTestingBackdoor(false)}
            onGenerateProfile={handleTestingProfileGenerate}
          />
        )}
      </>
    )
  }

  if (!consultationComplete) {
    return (
      <>
        <ConsultationChat onComplete={handleConsultationComplete} />
        
        {/* Global Testing Backdoor */}
        {showTestingBackdoor && (
          <TestingBackdoor
            onClose={() => setShowTestingBackdoor(false)}
            onGenerateProfile={handleTestingProfileGenerate}
          />
        )}
      </>
    )
  }

  // Render different views based on current state
  const renderCurrentView = () => {
    switch (currentView) {
      case 'workout':
        return selectedWorkout ? (
          <WorkoutDetail 
            workout={selectedWorkout}
            onComplete={handleWorkoutComplete}
            onBack={handleBackToDashboard}
          />
        ) : (
          <TrainingDashboard 
            consultationData={consultationData} 
            onStartWorkout={handleStartWorkout}
            onViewNutrition={handleViewNutrition}
            currentWeek={currentWeek}
            onWeekChange={setCurrentWeek}
          />
        )
      
      case 'debrief':
        return selectedWorkout ? (
          <PostWorkoutDebrief
            workout={selectedWorkout}
            onComplete={handleDebriefComplete}
            onSkip={handleDebriefSkip}
          />
        ) : (
          <TrainingDashboard 
            consultationData={consultationData} 
            onStartWorkout={handleStartWorkout}
            onViewNutrition={handleViewNutrition}
            currentWeek={currentWeek}
            onWeekChange={setCurrentWeek}
          />
        )
      
      case 'nutrition':
        return (
          <div className="min-h-screen bg-slate-50">
            {/* Navigation Header */}
            <div className="bg-white border-b border-slate-200 p-4">
              <div className="max-w-6xl mx-auto flex items-center gap-4">
                <button
                  onClick={handleBackToDashboard}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  ← Back to Dashboard
                </button>
                <h1 className="text-xl font-semibold text-slate-900">Nutrition & Supplements</h1>
              </div>
            </div>
            <NutritionPlanner 
              consultationData={consultationData}
              currentWeek={currentWeek}
            />
          </div>
        )
      
      case 'dashboard':
      default:
        return (
          <TrainingDashboard 
            consultationData={consultationData} 
            onStartWorkout={handleStartWorkout}
            onViewNutrition={handleViewNutrition}
            currentWeek={currentWeek}
            onWeekChange={setCurrentWeek}
          />
        )
    }
  }

  return (
    <>
      {renderCurrentView()}
      
      {/* Global Testing Backdoor */}
      {showTestingBackdoor && (
        <TestingBackdoor
          onClose={() => setShowTestingBackdoor(false)}
          onGenerateProfile={handleTestingProfileGenerate}
        />
      )}
    </>
  )
}

export default App