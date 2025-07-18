import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Apple, 
  Coffee, 
  Utensils, 
  Zap, 
  Target,
  Plus,
  Clock,
  TrendingUp,
  Droplets,
  Pill
} from 'lucide-react'
import { blink } from '@/blink/client'
import type { ConsultationData } from '@/types/training'

interface NutritionPlannerProps {
  consultationData: ConsultationData
  currentWeek: number
}

interface MealPlan {
  id: string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout'
  foodItem: string
  calories: number
  carbs: number
  protein: number
  fat: number
  notes?: string
}

interface SupplementRecommendation {
  id: string
  name: string
  dosage: string
  timing: string
  purpose: string
  active: boolean
}

export function NutritionPlanner({ consultationData, currentWeek }: NutritionPlannerProps) {
  const [dailyMeals, setDailyMeals] = useState<MealPlan[]>([])
  const [supplements, setSupplements] = useState<SupplementRecommendation[]>([])
  const [dailyTargets, setDailyTargets] = useState({
    calories: 2200,
    carbs: 275,
    protein: 110,
    fat: 73,
    water: 8
  })
  const [currentIntake, setCurrentIntake] = useState({
    calories: 0,
    carbs: 0,
    protein: 0,
    fat: 0,
    water: 0
  })
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePersonalizedPlan = useCallback(async () => {
    setIsGenerating(true)
    
    try {
      // Always start with default plan to ensure UI works
      generateDefaultPlan()
      
      const prompt = `Create a personalized daily nutrition plan for a half-marathon runner.

Runner Profile:
- Goal: ${consultationData.goal_type || 'Complete half-marathon'}
- Training days per week: ${consultationData.training_days_per_week || 4}
- Current weekly mileage: ${consultationData.current_weekly_mileage || 15}
- Dietary restrictions: ${consultationData.dietary_restrictions || 'None'}
- Current training week: ${currentWeek}

Generate a JSON response with:
1. Daily calorie and macro targets
2. 6 meals (breakfast, lunch, dinner, 2 snacks, pre/post workout)
3. Each meal should include specific foods, calories, and macros

Format:
{
  "targets": { "calories": 2200, "carbs": 275, "protein": 110, "fat": 73 },
  "meals": [
    {
      "mealType": "breakfast",
      "foodItem": "Oatmeal with banana and almonds",
      "calories": 350,
      "carbs": 45,
      "protein": 12,
      "fat": 14,
      "notes": "Great pre-run fuel"
    }
  ]
}`

      const { text } = await blink.ai.generateText({
        prompt,
        model: 'gpt-4o-mini',
        maxTokens: 800
      })

      try {
        // Extract JSON from response (in case there's extra text)
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const nutritionPlan = JSON.parse(jsonMatch[0])
          if (nutritionPlan.targets && nutritionPlan.meals) {
            setDailyTargets(nutritionPlan.targets)
            setDailyMeals(nutritionPlan.meals.map((meal: any, index: number) => ({
              id: `meal-${index}`,
              ...meal
            })))
          }
        }
      } catch (parseError) {
        console.error('Error parsing nutrition plan:', parseError)
        // Keep default plan that was already set
      }
    } catch (error) {
      console.error('Error generating nutrition plan:', error)
      // Keep default plan that was already set
    } finally {
      setIsGenerating(false)
    }
  }, [consultationData, currentWeek])

  const generateDefaultPlan = () => {
    const defaultMeals: MealPlan[] = [
      {
        id: 'breakfast',
        mealType: 'breakfast',
        foodItem: 'Oatmeal with banana and almonds',
        calories: 350,
        carbs: 45,
        protein: 12,
        fat: 14,
        notes: 'Great pre-run fuel'
      },
      {
        id: 'lunch',
        mealType: 'lunch',
        foodItem: 'Grilled chicken salad with quinoa',
        calories: 450,
        carbs: 35,
        protein: 35,
        fat: 18,
        notes: 'Balanced recovery meal'
      },
      {
        id: 'dinner',
        mealType: 'dinner',
        foodItem: 'Salmon with sweet potato and vegetables',
        calories: 500,
        carbs: 40,
        protein: 30,
        fat: 22,
        notes: 'Anti-inflammatory dinner'
      },
      {
        id: 'snack1',
        mealType: 'snack',
        foodItem: 'Greek yogurt with berries',
        calories: 180,
        carbs: 20,
        protein: 15,
        fat: 6,
        notes: 'High protein snack'
      },
      {
        id: 'pre-workout',
        mealType: 'pre_workout',
        foodItem: 'Banana with peanut butter',
        calories: 200,
        carbs: 30,
        protein: 6,
        fat: 8,
        notes: 'Quick energy before training'
      },
      {
        id: 'post-workout',
        mealType: 'post_workout',
        foodItem: 'Chocolate milk and protein bar',
        calories: 300,
        carbs: 35,
        protein: 20,
        fat: 10,
        notes: 'Recovery within 30 minutes'
      }
    ]
    setDailyMeals(defaultMeals)
  }

  const generateSupplementRecommendations = useCallback(async () => {
    try {
      // Set default supplements first
      const defaultSupplements = [
        {
          id: 'vitamin-d',
          name: 'Vitamin D3',
          dosage: '2000 IU',
          timing: 'With breakfast',
          purpose: 'Bone health and immune function',
          active: true
        },
        {
          id: 'omega-3',
          name: 'Omega-3 Fish Oil',
          dosage: '1000mg EPA/DHA',
          timing: 'With dinner',
          purpose: 'Reduce inflammation and support recovery',
          active: true
        },
        {
          id: 'magnesium',
          name: 'Magnesium Glycinate',
          dosage: '400mg',
          timing: 'Before bed',
          purpose: 'Muscle recovery and sleep quality',
          active: true
        },
        {
          id: 'iron',
          name: 'Iron Bisglycinate',
          dosage: '18mg',
          timing: 'On empty stomach',
          purpose: 'Support oxygen transport and prevent fatigue',
          active: true
        }
      ]
      
      setSupplements(defaultSupplements)

      const prompt = `Recommend evidence-based supplements for a half-marathon runner.

Runner Profile:
- Goal: ${consultationData.goal_type || 'Complete half-marathon'}
- Training intensity: Week ${currentWeek} of 20
- Dietary restrictions: ${consultationData.dietary_restrictions || 'None'}

Provide 4-6 supplement recommendations in JSON format:
{
  "supplements": [
    {
      "name": "Vitamin D3",
      "dosage": "2000 IU",
      "timing": "With breakfast",
      "purpose": "Bone health and immune function",
      "active": true
    }
  ]
}`

      const { text } = await blink.ai.generateText({
        prompt,
        model: 'gpt-4o-mini',
        maxTokens: 400
      })

      try {
        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const supplementPlan = JSON.parse(jsonMatch[0])
          if (supplementPlan.supplements && Array.isArray(supplementPlan.supplements)) {
            setSupplements(supplementPlan.supplements.map((supp: any, index: number) => ({
              id: `supp-${index}`,
              ...supp
            })))
          }
        }
      } catch (parseError) {
        console.error('Error parsing supplement plan:', parseError)
        // Keep default supplements that were already set
      }
    } catch (error) {
      console.error('Error generating supplement recommendations:', error)
      // Keep default supplements
    }
  }, [consultationData, currentWeek])

  useEffect(() => {
    // Ensure we have default data first
    generateDefaultPlan()
    
    // Then try to generate personalized plans
    generatePersonalizedPlan().catch(console.error)
    generateSupplementRecommendations().catch(console.error)
  }, [generatePersonalizedPlan, generateSupplementRecommendations])

  useEffect(() => {
    // Calculate current intake from meals
    const intake = dailyMeals.reduce((acc, meal) => ({
      calories: acc.calories + meal.calories,
      carbs: acc.carbs + meal.carbs,
      protein: acc.protein + meal.protein,
      fat: acc.fat + meal.fat,
      water: acc.water
    }), { calories: 0, carbs: 0, protein: 0, fat: 0, water: 0 })
    
    setCurrentIntake(intake)
  }, [dailyMeals])

  const getMealIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast':
        return <Coffee className="w-4 h-4" />
      case 'lunch':
      case 'dinner':
        return <Utensils className="w-4 h-4" />
      case 'snack':
        return <Apple className="w-4 h-4" />
      case 'pre_workout':
        return <Zap className="w-4 h-4" />
      case 'post_workout':
        return <TrendingUp className="w-4 h-4" />
      default:
        return <Utensils className="w-4 h-4" />
    }
  }

  const getMealColor = (mealType: string) => {
    switch (mealType) {
      case 'breakfast':
        return 'bg-orange-100 text-orange-800'
      case 'lunch':
        return 'bg-green-100 text-green-800'
      case 'dinner':
        return 'bg-blue-100 text-blue-800'
      case 'snack':
        return 'bg-purple-100 text-purple-800'
      case 'pre_workout':
        return 'bg-red-100 text-red-800'
      case 'post_workout':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isGenerating && dailyMeals.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Generating Your Nutrition Plan</h2>
            <p className="text-slate-600">Creating personalized meal recommendations based on your training profile...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Nutrition & Supplements</h1>
          <p className="text-slate-600 mt-1">Fuel your training for optimal performance</p>
        </div>
        <Button onClick={generatePersonalizedPlan} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Generating...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Regenerate Plan
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="nutrition" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="nutrition">Daily Nutrition</TabsTrigger>
          <TabsTrigger value="supplements">Supplements</TabsTrigger>
        </TabsList>

        <TabsContent value="nutrition" className="space-y-6">
          {/* Daily Targets Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Calories</span>
                  <Target className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {currentIntake.calories}
                </div>
                <div className="text-sm text-slate-500">
                  of {dailyTargets.calories} kcal
                </div>
                <Progress 
                  value={(currentIntake.calories / dailyTargets.calories) * 100} 
                  className="h-2 mt-2" 
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Carbs</span>
                  <Zap className="w-4 h-4 text-orange-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {currentIntake.carbs}g
                </div>
                <div className="text-sm text-slate-500">
                  of {dailyTargets.carbs}g
                </div>
                <Progress 
                  value={(currentIntake.carbs / dailyTargets.carbs) * 100} 
                  className="h-2 mt-2" 
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Protein</span>
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {currentIntake.protein}g
                </div>
                <div className="text-sm text-slate-500">
                  of {dailyTargets.protein}g
                </div>
                <Progress 
                  value={(currentIntake.protein / dailyTargets.protein) * 100} 
                  className="h-2 mt-2" 
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Water</span>
                  <Droplets className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {currentIntake.water}
                </div>
                <div className="text-sm text-slate-500">
                  of {dailyTargets.water} glasses
                </div>
                <Progress 
                  value={(currentIntake.water / dailyTargets.water) * 100} 
                  className="h-2 mt-2" 
                />
              </CardContent>
            </Card>
          </div>

          {/* Meal Plan */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dailyMeals.map((meal) => (
              <Card key={meal.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium capitalize">
                      {meal.mealType.replace('_', ' ')}
                    </CardTitle>
                    <Badge className={getMealColor(meal.mealType)}>
                      {getMealIcon(meal.mealType)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-medium text-slate-900 mb-1">
                      {meal.foodItem}
                    </h4>
                    {meal.notes && (
                      <p className="text-xs text-slate-600">{meal.notes}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2 rounded">
                      <div className="font-medium text-slate-900">{meal.calories}</div>
                      <div className="text-slate-600">calories</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded">
                      <div className="font-medium text-slate-900">{meal.carbs}g</div>
                      <div className="text-slate-600">carbs</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded">
                      <div className="font-medium text-slate-900">{meal.protein}g</div>
                      <div className="text-slate-600">protein</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded">
                      <div className="font-medium text-slate-900">{meal.fat}g</div>
                      <div className="text-slate-600">fat</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="supplements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supplements.map((supplement) => (
              <Card key={supplement.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium">
                      {supplement.name}
                    </CardTitle>
                    <Badge className="bg-purple-100 text-purple-800">
                      <Pill className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">Dosage:</span>
                      <span className="text-slate-600">{supplement.dosage}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-green-600" />
                      <span className="font-medium">Timing:</span>
                      <span className="text-slate-600">{supplement.timing}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {supplement.purpose}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}