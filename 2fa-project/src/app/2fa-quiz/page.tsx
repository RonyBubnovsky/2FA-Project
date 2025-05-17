'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import LoadingScreen from '../components/LoadingScreen'

interface Question {
  id: number
  question: string
  options: string[]
  correctAnswer: number
}

export default function QuizPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [quizStarted, setQuizStarted] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  
  // Check if we're in results view via the URL
  useEffect(() => {
    if (pathname?.includes('?results=true') && !showResult) {
      setShowResult(true);
    }
  }, [pathname, showResult]);

  const questions: Question[] = [
    {
      id: 1,
      question: "What does 2FA stand for?",
      options: [
        "Two-Factor Authentication",
        "Two-Factor Authorization",
        "Two-Form Authentication",
        "Two-Factor Access"
      ],
      correctAnswer: 0
    },
    {
      id: 2,
      question: "Which of the following is NOT typically used as a second factor in 2FA?",
      options: [
        "Fingerprint scan",
        "Email address",
        "SMS code",
        "Authentication app"
      ],
      correctAnswer: 1
    },
    {
      id: 3,
      question: "Why is 2FA more secure than just using a password?",
      options: [
        "It uses longer and more complex passwords",
        "It requires something you know AND something you have/are",
        "It automatically changes your password regularly",
        "It encrypts your login credentials on the server"
      ],
      correctAnswer: 1
    },
    {
      id: 4,
      question: "Which attack is 2FA specifically designed to prevent?",
      options: [
        "DDoS attacks",
        "Malware infections",
        "Account takeover after password compromise",
        "Cross-site scripting"
      ],
      correctAnswer: 2
    },
    {
      id: 5,
      question: "What is a potential vulnerability of SMS-based 2FA?",
      options: [
        "SIM swapping attacks",
        "Fingerprint spoofing",
        "Quantum computing attacks",
        "Rainbow table attacks"
      ],
      correctAnswer: 0
    },
    {
      id: 6,
      question: "What technology do most authenticator apps use to generate one-time codes?",
      options: [
        "RSA encryption",
        "TOTP (Time-based One-Time Password)",
        "Blockchain",
        "HTTPS certificates"
      ],
      correctAnswer: 1
    },
    {
      id: 7,
      question: "In 2025, which form of 2FA is generally considered more secure?",
      options: [
        "SMS-based codes",
        "Email verification links",
        "Hardware security keys",
        "Knowledge-based security questions"
      ],
      correctAnswer: 2
    },
    {
      id: 8,
      question: "Why are recovery codes important when setting up 2FA?",
      options: [
        "They help you reset your password",
        "They provide access if you lose your second factor device",
        "They encrypt your personal data",
        "They improve the strength of your password"
      ],
      correctAnswer: 1
    },
    {
      id: 9,
      question: "What is phishing-resistant 2FA?",
      options: [
        "2FA that uses anti-virus software",
        "2FA that can't be intercepted through fake websites",
        "2FA that changes codes every 30 seconds",
        "2FA that requires biometric verification"
      ],
      correctAnswer: 1
    },
    {
      id: 10,
      question: "Which organization recommends implementing 2FA for all sensitive accounts?",
      options: [
        "NIST (National Institute of Standards and Technology)",
        "WHO (World Health Organization)",
        "UNESCO",
        "INTERPOL"
      ],
      correctAnswer: 0
    }
  ]

  useEffect(() => {
    // Check authentication status first
    fetch('/api/auth/2fa-status')
      .then(r => {
        if (r.status === 401) {
          // User is not authenticated, redirect to login
          router.push('/login')
          return null
        }
        return r.json()
      })
      .then(data => {
        if (!data) return // Early return if redirect is happening
        if (!data.enabled) {
          // Redirect if 2FA is not enabled
          router.push('/dashboard?error=2fa-required')
          return
        }
        setIsLoading(false)
      })
      .catch((error) => {
        setError('Failed to check 2FA status')
        console.error(error)
        setIsLoading(false)
      })
  }, [router])

  function startQuiz() {
    setQuizStarted(true)
  }

  function handleAnswerSelect(answerIndex: number) {
    setSelectedAnswer(answerIndex)
  }

  function handleNextQuestion() {
    const isCorrect = selectedAnswer === questions[currentQuestionIndex].correctAnswer
    
    // Update score
    if (isCorrect) {
      setScore(prevScore => prevScore + 1)
    }
    
    // Save answer
    setAnswers(prev => [...prev, selectedAnswer !== null ? selectedAnswer : -1])
    
    // Move to next question or show results
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1)
      setSelectedAnswer(null)
    } else {
      // Update URL to use query parameter instead of path segment
      router.push('/2fa-quiz?results=true')
      setShowResult(true)
    }
  }

  function restartQuiz() {
    // Update URL to remove results parameter
    router.push('/2fa-quiz')
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setScore(0)
    setAnswers([])
    setShowResult(false)
  }

  if (isLoading) {
    return <LoadingScreen message="Checking 2FA status..." />
  }

  if (error) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="card bg-secondary-800 dark:bg-secondary-900 text-white p-8 shadow-lg">
            <div className="text-center">
              <h2 className="text-2xl font-display font-bold text-white">Error</h2>
              <p className="mt-2 text-sm text-secondary-200 dark:text-secondary-300">{error}</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="mt-6 btn btn-primary"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!quizStarted) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center py-12">
        <div className="w-full max-w-2xl">
          <div className="card bg-secondary-800 dark:bg-secondary-900 text-white p-8 shadow-lg">
            <div className="text-center">
              <h2 className="text-3xl font-display font-bold text-white">2FA Security Quiz</h2>
              <p className="mt-4 text-secondary-200 dark:text-secondary-300">
                Test your knowledge of Two-Factor Authentication with this interactive quiz. Answer 10 questions about 2FA security concepts, best practices, and emerging trends.
              </p>
              <div className="mt-8 flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
                <button
                  onClick={startQuiz}
                  className="btn btn-primary px-8 py-3 text-lg flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                  </svg>
                  Start Quiz
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="btn btn-secondary px-8 py-3 text-lg flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 1 1 1.06 1.06L9.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5Z" clipRule="evenodd" />
                  </svg>
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showResult) {
    const percentage = Math.round((score / questions.length) * 100)
    
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center py-12">
        <div className="w-full max-w-2xl">
          <div className="card bg-secondary-800 dark:bg-secondary-900 text-white p-8 shadow-lg">
            <div className="text-center">
              <h2 className="text-3xl font-display font-bold text-white">Quiz Results</h2>
              
              <div className="my-8">
                <div className="flex justify-center">
                  <div className="relative h-48 w-48">
                    <svg className="h-full w-full" viewBox="0 0 100 100">
                      <circle
                        className="text-secondary-700 stroke-current"
                        strokeWidth="10"
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                      ></circle>
                      <circle
                        className="text-primary-500 stroke-current"
                        strokeWidth="10"
                        strokeLinecap="round"
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        strokeDasharray={Math.PI * 80}
                        strokeDashoffset={Math.PI * 80 * (1 - percentage / 100)}
                      ></circle>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl font-bold">{percentage}%</span>
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-xl">
                  Your score: <span className="font-bold">{score}/{questions.length}</span>
                </p>
              </div>
              
              <div className="mt-8 p-4 bg-secondary-700 dark:bg-secondary-800 rounded-lg">
                <h3 className="text-xl font-bold mb-4">Review Your Answers</h3>
                <div className="space-y-4">
                  {questions.map((q, index) => (
                    <div key={index} className="flex flex-col p-3 rounded-lg border border-secondary-600">
                      <p className="font-medium">{q.question}</p>
                      <div className="mt-2 grid grid-cols-1 gap-2">
                        {q.options.map((option, optIndex) => (
                          <div 
                            key={optIndex} 
                            className={`p-2 rounded-md ${
                              answers[index] === optIndex 
                                ? answers[index] === q.correctAnswer 
                                  ? 'bg-green-600/20 border border-green-500' 
                                  : 'bg-red-600/20 border border-red-500'
                                : q.correctAnswer === optIndex
                                  ? 'bg-green-600/20 border border-green-500'
                                  : 'bg-secondary-700/50 border border-secondary-600'
                            }`}
                          >
                            {option}
                            {answers[index] === optIndex && answers[index] === q.correctAnswer && (
                              <span className="ml-2 text-green-400">✓</span>
                            )}
                            {answers[index] === optIndex && answers[index] !== q.correctAnswer && (
                              <span className="ml-2 text-red-400">✗</span>
                            )}
                            {answers[index] !== optIndex && q.correctAnswer === optIndex && (
                              <span className="ml-2 text-green-400">✓</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-8 flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
                <button
                  onClick={restartQuiz}
                  className="btn btn-primary px-8 py-3 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918Z" clipRule="evenodd" />
                  </svg>
                  Retake Quiz
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="btn btn-secondary px-8 py-3 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 1 1 1.06 1.06L9.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5Z" clipRule="evenodd" />
                  </svg>
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center py-12">
      <div className="w-full max-w-2xl">
        <div className="card bg-secondary-800 dark:bg-secondary-900 text-white p-8 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-sm text-secondary-300">Question {currentQuestionIndex + 1} of {questions.length}</p>
              <div className="w-full bg-secondary-700 h-2 rounded-full mt-2">
                <div 
                  className="bg-primary-500 h-2 rounded-full" 
                  style={{ width: `${((currentQuestionIndex) / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>
            <p className="text-sm text-secondary-300">Score: {score}</p>
          </div>
          
          <h3 className="text-xl font-bold mb-6">{currentQuestion.question}</h3>
          
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                className={`w-full text-left p-4 rounded-lg border ${
                  selectedAnswer === index 
                    ? 'border-primary-500 bg-primary-500/20' 
                    : 'border-secondary-600 bg-secondary-700 hover:bg-secondary-700/80'
                } transition-colors duration-200`}
                onClick={() => handleAnswerSelect(index)}
              >
                <div className="flex items-center">
                  <div className={`flex-shrink-0 h-5 w-5 border rounded-full mr-3 ${
                    selectedAnswer === index 
                      ? 'border-primary-500 bg-primary-500' 
                      : 'border-secondary-400'
                  }`}>
                    {selectedAnswer === index && (
                      <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <circle cx="10" cy="10" r="5" />
                      </svg>
                    )}
                  </div>
                  <span>{option}</span>
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-8 flex justify-between">
            <button
              onClick={() => router.push('/dashboard')}
              className="btn btn-secondary flex items-center px-4 py-2"
            >
              <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
              Exit Quiz
            </button>
            <button
              onClick={handleNextQuestion}
              disabled={selectedAnswer === null}
              className="btn btn-primary flex items-center px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentQuestionIndex === questions.length - 1 ? (
                <>
                  <span>Finish Quiz</span>
                  <svg className="w-5 h-5 ml-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                  </svg>
                </>
              ) : (
                <>
                  <span>Next Question</span>
                  <svg className="w-5 h-5 ml-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z" clipRule="evenodd" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 