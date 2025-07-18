import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { 
  MessageCircle, 
  Star, 
  TrendingUp, 
  Heart, 
  Zap,
  CheckCircle,
  ArrowRight
} from 'lucide-react'
import { blink } from '@/blink/client'
import type { WorkoutPlan } from '@/types/training'

interface PostWorkoutDebriefProps {
  workout: WorkoutPlan
  onComplete: (feedback: WorkoutFeedback) => void
  onSkip: () => void
}

interface WorkoutFeedback {
  rating: number
  effortLevel: number
  energyLevel: number
  mood: string
  feedbackText: string
}

export function PostWorkoutDebrief({ workout, onComplete, onSkip }: PostWorkoutDebriefProps) {
  const [rating, setRating] = useState([3])
  const [effortLevel, setEffortLevel] = useState([5])
  const [energyLevel, setEnergyLevel] = useState([5])
  const [mood, setMood] = useState('')
  const [feedbackText, setFeedbackText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [aiResponse, setAiResponse] = useState('')
  const [showAiResponse, setShowAiResponse] = useState(false)

  const moods = [
    { value: 'amazing', label: 'Amazing', emoji: '🤩', color: 'bg-green-100 text-green-800' },
    { value: 'great', label: 'Great', emoji: '😊', color: 'bg-blue-100 text-blue-800' },
    { value: 'good', label: 'Good', emoji: '🙂', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'okay', label: 'Okay', emoji: '😐', color: 'bg-gray-100 text-gray-800' },
    { value: 'tough', label: 'Tough', emoji: '😤', color: 'bg-orange-100 text-orange-800' },
    { value: 'struggled', label: 'Struggled', emoji: '😓', color: 'bg-red-100 text-red-800' }
  ]

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    const feedback: WorkoutFeedback = {
      rating: rating[0],
      effortLevel: effortLevel[0],
      energyLevel: energyLevel[0],
      mood,
      feedbackText
    }

    try {
      // Generate AI response based on feedback
      const aiResponseText = await generateAIResponse(feedback)
      setAiResponse(aiResponseText)
      setShowAiResponse(true)
      
      // Save feedback to database (would be implemented with actual DB)
      // await saveFeedback(workout.id, feedback)
      
    } catch (error) {
      console.error('Error processing feedback:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const generateAIResponse = async (feedback: WorkoutFeedback) => {
    const prompt = `You are an expert running coach providing personalized feedback after a workout.

Workout Details:
- Type: ${workout.workout_type.replace('_', ' ')}
- Distance: ${workout.distance || 'N/A'} miles
- Duration: ${workout.duration || 'N/A'} minutes
- Intensity: ${workout.intensity}
- Description: ${workout.description}

User Feedback:
- Overall Rating: ${feedback.rating}/5 stars
- Effort Level: ${feedback.effortLevel}/10
- Energy Level: ${feedback.energyLevel}/10
- Mood: ${feedback.mood}
- Comments: "${feedback.feedbackText}"

Provide encouraging, personalized feedback that:
1. Acknowledges their effort and performance
2. Gives specific advice for future workouts
3. Suggests any adjustments to upcoming training if needed
4. Maintains a supportive, motivational tone

Keep response under 150 words and be conversational.`

    const { text } = await blink.ai.generateText({
      prompt,
      model: 'gpt-4o-mini',
      maxTokens: 200
    })

    return text
  }

  const handleFinish = () => {
    const feedback: WorkoutFeedback = {
      rating: rating[0],
      effortLevel: effortLevel[0],
      energyLevel: energyLevel[0],
      mood,
      feedbackText
    }
    onComplete(feedback)
  }

  if (showAiResponse) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Great Work!</CardTitle>
            <p className="text-slate-600">Your AI coach has some feedback for you</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-blue-900 mb-2">AI Coach Feedback</div>
                    <p className="text-blue-800 text-sm leading-relaxed">{aiResponse}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button onClick={handleFinish} className="flex-1">
                <ArrowRight className="w-4 h-4 mr-2" />
                Continue to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">How did that feel?</CardTitle>
          <p className="text-slate-600">
            Help your AI coach understand your workout experience
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Rating */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-900">
              Overall workout rating
            </label>
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating([star])}
                    className={`p-1 rounded ${
                      star <= rating[0] 
                        ? 'text-yellow-500' 
                        : 'text-gray-300 hover:text-yellow-400'
                    }`}
                  >
                    <Star className="w-6 h-6 fill-current" />
                  </button>
                ))}
              </div>
              <span className="text-sm text-slate-600">
                {rating[0]}/5 stars
              </span>
            </div>
          </div>

          {/* Effort Level */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              <label className="text-sm font-medium text-slate-900">
                Effort level (1 = very easy, 10 = maximum effort)
              </label>
            </div>
            <div className="space-y-2">
              <Slider
                value={effortLevel}
                onValueChange={setEffortLevel}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>Very Easy</span>
                <span className="font-medium">{effortLevel[0]}/10</span>
                <span>Maximum</span>
              </div>
            </div>
          </div>

          {/* Energy Level */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-600" />
              <label className="text-sm font-medium text-slate-900">
                Energy level after workout
              </label>
            </div>
            <div className="space-y-2">
              <Slider
                value={energyLevel}
                onValueChange={setEnergyLevel}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>Drained</span>
                <span className="font-medium">{energyLevel[0]}/10</span>
                <span>Energized</span>
              </div>
            </div>
          </div>

          {/* Mood Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-600" />
              <label className="text-sm font-medium text-slate-900">
                How are you feeling?
              </label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {moods.map((moodOption) => (
                <button
                  key={moodOption.value}
                  onClick={() => setMood(moodOption.value)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    mood === moodOption.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{moodOption.emoji}</div>
                  <div className="text-xs font-medium">{moodOption.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Additional Feedback */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-900">
              Any additional thoughts? (optional)
            </label>
            <Textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="How did your legs feel? Any discomfort? Thoughts on the pace or distance?"
              className="min-h-[100px]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onSkip}
              className="flex-1"
            >
              Skip for now
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !mood}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Get AI Feedback
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}