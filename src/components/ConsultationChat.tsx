import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Mic, MicOff, Send, Bot, User } from 'lucide-react'
import { blink } from '@/blink/client'
import { TestingBackdoor } from '@/components/TestingBackdoor'
import type { ChatMessage, ConsultationData } from '@/types/training'

interface ConsultationChatProps {
  onComplete: (data: ConsultationData) => void
}

export function ConsultationChat({ onComplete }: ConsultationChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [consultationData, setConsultationData] = useState<ConsultationData>({})
  const [currentStep, setCurrentStep] = useState('name')
  const [showTestingBackdoor, setShowTestingBackdoor] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Start with welcome message asking for name
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      user_id: 'ai',
      role: 'assistant',
      content: "Hi there! I'm your AI Running Expert, and I'm excited to help you prepare for your half-marathon in October 2025! \n\nI'll be creating a personalized training plan just for you, but first, I need to get to know you better. This isn't just a form - think of this as a conversation with a professional running coach.\n\nLet's start with something simple - what should I call you? What's your name?",
      timestamp: new Date().toISOString(),
      consultation_step: 'name'
    }
    setMessages([welcomeMessage])
  }, [])

  useEffect(() => {
    // Testing backdoor keyboard shortcut
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault()
        setShowTestingBackdoor(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleTestingProfileGenerate = (profileData: ConsultationData) => {
    // Skip the entire consultation and go straight to completion
    onComplete(profileData)
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      user_id: 'user',
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
      consultation_step: currentStep
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Generate AI response based on current step and user input
      const aiResponse = await generateAIResponse(input, currentStep, consultationData)
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        user_id: 'ai',
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date().toISOString(),
        consultation_step: aiResponse.nextStep
      }

      setMessages(prev => [...prev, assistantMessage])
      setConsultationData(aiResponse.updatedData)
      setCurrentStep(aiResponse.nextStep)

      // Check if consultation is complete
      if (aiResponse.nextStep === 'complete') {
        setTimeout(() => {
          onComplete(aiResponse.updatedData)
        }, 2000)
      }
    } catch (error) {
      console.error('Error generating AI response:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateAIResponse = async (userInput: string, step: string, data: ConsultationData) => {
    const prompt = `You are an expert running coach conducting a consultation for half-marathon training. 
    
Current step: ${step}
Current data collected: ${JSON.stringify(data)}
User's response: "${userInput}"

Based on the user's response, update the consultation data and provide the next question. Be conversational, encouraging, and professional. Ask follow-up questions when needed. If the user provides their name, use it in future responses to make the conversation more personal.

Steps to cover:
1. name - Ask for the user's name
2. goal - Ask about goal (finish vs time target)
3. goal_details - If time target, ask for specific time
4. experience - Ask about running history and current weekly mileage
5. pace - Ask about typical running pace
6. injuries - Ask about past injuries or concerns
7. schedule - Ask about training availability (days per week, preferred time)
8. gym - Ask about gym access for strength training
9. nutrition - Ask about dietary restrictions or preferences
10. complete - Summarize and confirm all details

Respond in JSON format:
{
  "content": "Your conversational response with next question",
  "nextStep": "next_step_name",
  "updatedData": { updated consultation data object }
}`

    const { text } = await blink.ai.generateText({
      prompt,
      model: 'gpt-4o-mini',
      maxTokens: 500
    })

    try {
      return JSON.parse(text)
    } catch {
      // Fallback response
      return {
        content: "I'd love to learn more about your running background. Could you tell me about your current weekly running routine?",
        nextStep: "experience",
        updatedData: data
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold text-slate-900">Initial Consultation</h1>
          <p className="text-slate-600 mt-1">Let's create your personalized half-marathon training plan</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <Avatar className="w-8 h-8 bg-blue-100">
                  <AvatarFallback>
                    <Bot className="w-4 h-4 text-blue-600" />
                  </AvatarFallback>
                </Avatar>
              )
              }
              
              <Card className={`max-w-2xl ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white'}`}>
                <CardContent className="p-4">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </div>
                  <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-100' : 'text-slate-500'}`}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </CardContent>
              </Card>

              {message.role === 'user' && (
                <Avatar className="w-8 h-8 bg-slate-100">
                  <AvatarFallback>
                    <User className="w-4 h-4 text-slate-600" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <Avatar className="w-8 h-8 bg-blue-100">
                <AvatarFallback>
                  <Bot className="w-4 h-4 text-blue-600" />
                </AvatarFallback>
              </Avatar>
              <Card className="bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-slate-500">AI Expert is thinking...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-slate-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your response..."
                className="pr-12"
                disabled={isLoading}
              />
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-1 top-1/2 -translate-y-1/2"
                onClick={() => setIsRecording(!isRecording)}
              >
                {isRecording ? (
                  <MicOff className="w-4 h-4 text-red-500" />
                ) : (
                  <Mic className="w-4 h-4 text-slate-500" />
                )}
              </Button>
            </div>
            <Button onClick={handleSendMessage} disabled={!input.trim() || isLoading}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      {/* Testing Backdoor */}
      {showTestingBackdoor && (
        <TestingBackdoor
          onClose={() => setShowTestingBackdoor(false)}
          onGenerateProfile={handleTestingProfileGenerate}
        />
      )}
    </div>
  )
}