import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Zap, User, Target, Clock, MapPin } from 'lucide-react'
import { blink } from '@/blink/client'
import type { ConsultationData } from '@/types/training'

interface TestingBackdoorProps {
  onClose: () => void
  onGenerateProfile: (data: ConsultationData) => void
}

const SAMPLE_PROFILES = [
  {
    name: "Beginner Sarah",
    description: "New to running, wants to finish her first half-marathon",
    data: {
      name: 'Sarah',
      goal_type: 'finish' as const,
      current_weekly_mileage: 5,
      typical_pace: '11:00',
      running_experience: 'beginner' as const,
      training_days_per_week: 3,
      preferred_training_time: 'morning' as const,
      gym_access: true,
      dietary_restrictions: 'None'
    }
  },
  {
    name: "Intermediate Mike",
    description: "Regular runner aiming for sub-2:00 half-marathon",
    data: {
      name: 'Mike',
      goal_type: 'time_target' as const,
      target_time: '1:55:00',
      current_weekly_mileage: 15,
      typical_pace: '8:30',
      running_experience: 'intermediate' as const,
      training_days_per_week: 4,
      preferred_training_time: 'evening' as const,
      gym_access: true,
      past_injuries: 'Minor knee pain last year, fully recovered'
    }
  },
  {
    name: "Advanced Emma",
    description: "Experienced runner targeting sub-1:30 competitive time",
    data: {
      name: 'Emma',
      goal_type: 'time_target' as const,
      target_time: '1:28:00',
      current_weekly_mileage: 25,
      typical_pace: '7:15',
      running_experience: 'advanced' as const,
      training_days_per_week: 6,
      preferred_training_time: 'morning' as const,
      gym_access: true,
      dietary_restrictions: 'Vegetarian, focuses on high-protein meals'
    }
  },
  {
    name: "Comeback Runner",
    description: "Returning to running after injury, cautious approach",
    data: {
      name: 'Alex',
      goal_type: 'finish' as const,
      current_weekly_mileage: 8,
      typical_pace: '10:30',
      running_experience: 'intermediate' as const,
      past_injuries: 'IT band syndrome 6 months ago, cleared by PT',
      training_days_per_week: 3,
      preferred_training_time: 'afternoon' as const,
      gym_access: false,
      dietary_restrictions: 'Gluten-free'
    }
  }
]

export function TestingBackdoor({ onClose, onGenerateProfile }: TestingBackdoorProps) {
  const [customPrompt, setCustomPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleQuickProfile = (profile: typeof SAMPLE_PROFILES[0]) => {
    onGenerateProfile(profile.data)
    onClose()
  }

  const handleCustomGenerate = async () => {
    if (!customPrompt.trim()) return
    
    setIsGenerating(true)
    try {
      const prompt = `Generate a realistic user profile for half-marathon training based on this description: "${customPrompt}"

Return a JSON object with these exact fields:
{
  "name": "first name only",
  "goal_type": "finish" or "time_target",
  "target_time": "HH:MM:SS" (only if goal_type is time_target),
  "current_weekly_mileage": number (miles per week),
  "typical_pace": "MM:SS" (pace per mile),
  "running_experience": "beginner", "intermediate", or "advanced",
  "past_injuries": "description or null",
  "training_days_per_week": number (3-6),
  "preferred_training_time": "morning", "afternoon", or "evening",
  "gym_access": boolean,
  "dietary_restrictions": "description or null"
}

Make it realistic and consistent with the user description.`

      const { text } = await blink.ai.generateText({
        prompt,
        model: 'gpt-4o-mini',
        maxTokens: 400
      })

      try {
        const profileData = JSON.parse(text)
        onGenerateProfile(profileData)
        onClose()
      } catch (parseError) {
        console.error('Failed to parse generated profile:', parseError)
        // Fallback to a basic profile
        onGenerateProfile({
          name: 'Runner',
          goal_type: 'finish',
          current_weekly_mileage: 10,
          typical_pace: '9:30',
          running_experience: 'intermediate',
          training_days_per_week: 4,
          preferred_training_time: 'morning',
          gym_access: true
        })
        onClose()
      }
    } catch (error) {
      console.error('Error generating custom profile:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Testing Backdoor
            </CardTitle>
            <p className="text-sm text-slate-600 mt-1">
              Quickly generate sample user profiles to test the app
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Quick Profiles */}
          <div>
            <h3 className="font-medium text-slate-900 mb-3">Quick Sample Profiles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SAMPLE_PROFILES.map((profile, index) => (
                <Card key={index} className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleQuickProfile(profile)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-slate-900">{profile.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {profile.data.running_experience}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{profile.description}</p>
                    
                    <div className="flex flex-wrap gap-2 text-xs">
                      <div className="flex items-center gap-1 text-slate-500">
                        <Target className="w-3 h-3" />
                        {profile.data.goal_type === 'time_target' ? profile.data.target_time : 'Finish'}
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3 h-3" />
                        {profile.data.current_weekly_mileage}mi/week
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3 h-3" />
                        {profile.data.typical_pace}/mi
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Custom Profile Generator */}
          <div className="border-t pt-6">
            <h3 className="font-medium text-slate-900 mb-3">Custom Profile Generator</h3>
            <p className="text-sm text-slate-600 mb-4">
              Describe a user profile and AI will generate the consultation data
            </p>
            
            <div className="space-y-4">
              <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Example: A 35-year-old office worker who used to run in college but hasn't been active for 5 years. Wants to get back into shape and complete their first half-marathon. Has some old knee issues but cleared by doctor. Can train 4 days a week in the evenings."
                className="min-h-[100px]"
              />
              
              <Button 
                onClick={handleCustomGenerate} 
                disabled={!customPrompt.trim() || isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Generating Profile...
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 mr-2" />
                    Generate Custom Profile
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">How to Access</h4>
            <p className="text-sm text-blue-700">
              Press <kbd className="px-2 py-1 bg-blue-100 rounded text-xs">Ctrl + Shift + T</kbd> (or <kbd className="px-2 py-1 bg-blue-100 rounded text-xs">Cmd + Shift + T</kbd> on Mac) from anywhere in the app to open this testing backdoor.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}