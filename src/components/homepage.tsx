"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  ExternalLink,
  Plus,
  Calendar,
  Clock,
  Brain,
  Info,
  BookOpen,
  Target,
  Zap,
  HelpCircle,
  TrendingUp,
  Award,
} from "lucide-react"

interface Problem {
  id: string
  url: string
  title: string
  easinessFactor: number
  interval: number
  repetition: number
  nextReview: Date
  lastReviewed?: Date
}

// SM-2 Algorithm implementation (updated to handle grade 0)
function calculateNextReview(problem: Problem, grade: number): Problem {
  let { easinessFactor, interval, repetition } = problem

  if (grade >= 3) {
    if (repetition === 0) {
      interval = 1
    } else if (repetition === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * easinessFactor)
    }
    repetition += 1
  } else {
    repetition = 0
    interval = 1
  }

  easinessFactor = easinessFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
  if (easinessFactor < 1.3) {
    easinessFactor = 1.3
  }

  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + interval)

  return {
    ...problem,
    easinessFactor,
    interval,
    repetition,
    nextReview,
    lastReviewed: new Date(),
  }
}

function extractLeetCodeTitle(url: string): string {
  try {
    const match = url.match(/leetcode\.com\/problems\/([^/]+)/)
    if (match) {
      return match[1]
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    }
  } catch (e) {
    // ignore
  }
  return "LeetCode Problem"
}

const gradingSystem = [
  {
    grade: 0,
    label: "No Clue",
    description: "Zero clue how to do it",
    color: "bg-slate-600 hover:bg-slate-700 active:bg-slate-800",
    textColor: "text-slate-600",
  },
  {
    grade: 1,
    label: "Vague Recall",
    description: "Didn't solve, but had guesses / vaguely recalled solution",
    color: "bg-red-500 hover:bg-red-600 active:bg-red-700",
    textColor: "text-red-600",
  },
  {
    grade: 2,
    label: "Right Idea",
    description: "Didn't solve, but had mostly the right idea",
    color: "bg-orange-500 hover:bg-orange-600 active:bg-orange-700",
    textColor: "text-orange-600",
  },
  {
    grade: 3,
    label: "Solved Hard",
    description: "Solved, but took significant effort / many attempts",
    color: "bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700",
    textColor: "text-yellow-600",
  },
  {
    grade: 4,
    label: "Solved OK",
    description: "Solved, but felt tricky or was not the best solution",
    color: "bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700",
    textColor: "text-emerald-600",
  },
  {
    grade: 5,
    label: "Solved Easy",
    description: "Solved smoothly and easily",
    color: "bg-green-500 hover:bg-green-600 active:bg-green-700",
    textColor: "text-green-600",
  },
]

export default function LeetCodeSpacedRepetition() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [newProblemUrl, setNewProblemUrl] = useState("")
  const [showExplanation, setShowExplanation] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Load problems from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("leetcode-problems")
    if (saved) {
      const parsed = JSON.parse(saved)
      // Convert date strings back to Date objects
      const problemsWithDates = parsed.map((p: any) => ({
        ...p,
        nextReview: new Date(p.nextReview),
        lastReviewed: p.lastReviewed ? new Date(p.lastReviewed) : undefined,
      }))
      setProblems(problemsWithDates)
    }
  }, [])

  // Save problems to localStorage whenever problems change
  useEffect(() => {
    localStorage.setItem("leetcode-problems", JSON.stringify(problems))
  }, [problems])

  const addProblem = async () => {
    if (!newProblemUrl.trim()) return

    setIsLoading(true)
    // Simulate a brief loading state for better UX
    await new Promise((resolve) => setTimeout(resolve, 300))

    const newProblem: Problem = {
      id: Date.now().toString(),
      url: newProblemUrl.trim(),
      title: extractLeetCodeTitle(newProblemUrl.trim()),
      easinessFactor: 2.5,
      interval: 1,
      repetition: 0,
      nextReview: new Date(), // Due immediately
    }

    setProblems((prev) => [...prev, newProblem])
    setNewProblemUrl("")
    setIsLoading(false)
  }

  const gradeProblem = (problemId: string, grade: number) => {
    setProblems((prev) =>
      prev.map((problem) => (problem.id === problemId ? calculateNextReview(problem, grade) : problem)),
    )
  }

  const deleteProblem = (problemId: string) => {
    setProblems((prev) => prev.filter((p) => p.id !== problemId))
  }

  const now = new Date()
  const dueProblems = problems.filter((p) => p.nextReview <= now)
  const upcomingProblems = problems
    .filter((p) => p.nextReview > now)
    .sort((a, b) => a.nextReview.getTime() - b.nextReview.getTime())

  const formatDate = (date: Date) => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow"
    } else {
      return date.toLocaleDateString()
    }
  }

  const totalReviews = problems.reduce((sum, p) => sum + p.repetition, 0)

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-indigo-50/20"></div>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.15) 1px, transparent 0)",
              backgroundSize: "20px 20px",
            }}
          ></div>
        </div>

        <div className="relative max-w-7xl mx-auto p-3 sm:p-6 space-y-6 sm:space-y-10">
          {/* Mobile-Optimized Hero Section */}
          <div className="text-center space-y-4 sm:space-y-8 py-8 sm:py-16">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-4 sm:mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl sm:rounded-3xl blur-xl opacity-25 animate-pulse"></div>
                <div className="relative p-3 sm:p-5 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-2xl sm:rounded-3xl shadow-2xl border border-blue-500/20">
                  <Brain className="w-8 h-8 sm:w-12 sm:h-12 text-white drop-shadow-lg" />
                </div>
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent leading-tight tracking-tight">
                  LeetCode Mastery
                </h1>
                <p className="text-base sm:text-xl text-slate-500 font-semibold tracking-wide">
                  Spaced Repetition System
                </p>
              </div>
            </div>

            <div className="max-w-4xl mx-auto space-y-3 sm:space-y-6 px-4">
              <p className="text-lg sm:text-2xl text-slate-700 leading-relaxed font-light">
                Transform your coding interview preparation with scientifically-proven spaced repetition
              </p>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                Master algorithmic problems efficiently and build lasting intuition through optimized review scheduling
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 pt-4 sm:pt-6">
              <Button
                variant="outline"
                onClick={() => setShowExplanation(!showExplanation)}
                className="w-full sm:w-auto border-2 border-blue-300 text-blue-800 hover:bg-blue-50 hover:border-blue-400 active:bg-blue-100 font-semibold px-6 sm:px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-base hover:scale-105 active:scale-95 transform"
              >
                <Info className="w-5 h-5 mr-3" />
                {showExplanation ? "Hide Guide" : "How It Works"}
              </Button>

              {problems.length > 0 && (
                <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-lg">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                    <span className="font-semibold text-slate-800 text-sm sm:text-base">{totalReviews}</span>
                    <span className="text-slate-600 text-sm sm:text-base">reviews completed</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile-Optimized Explanation Section */}
          {showExplanation && (
            <Card className="bg-white/95 backdrop-blur-2xl border-2 border-blue-100 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border-b border-blue-100 p-4 sm:p-6">
                <CardTitle className="flex items-center gap-3 text-blue-900 text-lg sm:text-xl">
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                  Complete Guide to Spaced Repetition Learning
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-8 space-y-6 sm:space-y-8">
                <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-slate-800">Spaced Repetition</h3>
                    </div>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                      A learning technique that increases intervals between reviews based on how well you know the
                      material. It exploits the psychological spacing effect to dramatically improve long-term retention
                      and reduce study time.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Target className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-slate-800">SM-2 Algorithm</h3>
                    </div>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                      Developed in the 1980s by Piotr Wozniak, the SM-2 algorithm calculates optimal review intervals
                      based on your performance. Problems you find easier are shown less frequently, while difficult
                      ones appear more often.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-slate-800">Usage Workflow</h3>
                    </div>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                      Add LeetCode problems, solve them when due, then rate your performance using our detailed 0-5
                      scale. The algorithm schedules optimal review times to maximize retention and minimize forgetting.
                    </p>
                  </div>
                </div>

                <Separator className="bg-gradient-to-r from-transparent via-blue-200 to-transparent" />

                <div className="bg-gradient-to-r from-slate-50 to-blue-50/50 rounded-2xl p-4 sm:p-6 border border-slate-200">
                  <div className="flex items-center gap-2 mb-4 sm:mb-6">
                    <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                    <h4 className="text-base sm:text-lg font-semibold text-slate-800">Detailed Grading System</h4>
                  </div>

                  <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {gradingSystem.map((item) => (
                      <div
                        key={item.grade}
                        className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-center gap-3 mb-2 sm:mb-3">
                          <div
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${item.color} text-white text-sm font-bold flex items-center justify-center shadow-sm`}
                          >
                            {item.grade}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm sm:text-base">{item.label}</p>
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.description}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="text-xs sm:text-sm text-blue-800 font-medium text-center">
                      💡 <strong>Pro Tip:</strong> Grades 0-2 reset the problem to restart the learning cycle, while
                      grades 3-5 increase the review interval
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mobile-Optimized Add Problem Section */}
          <Card className="bg-white/95 backdrop-blur-2xl border-2 border-slate-200 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 border-b border-emerald-100 p-4 sm:p-6">
              <CardTitle className="flex items-center gap-3 text-emerald-800 text-lg sm:text-xl">
                <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                Add New Problem
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1">
                  <Label htmlFor="problem-url" className="text-sm font-medium text-slate-700 mb-2 block">
                    LeetCode Problem URL
                  </Label>
                  <Input
                    id="problem-url"
                    placeholder="https://leetcode.com/problems/two-sum/"
                    value={newProblemUrl}
                    onChange={(e) => setNewProblemUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addProblem()}
                    className="border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 h-12 text-base rounded-xl"
                    disabled={isLoading}
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <Button
                    onClick={addProblem}
                    disabled={!newProblemUrl.trim() || isLoading}
                    className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:from-emerald-700 active:to-teal-800 text-white px-6 sm:px-8 h-12 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 transform"
                  >
                    {isLoading ? "Adding..." : "Add Problem"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 sm:gap-8 xl:grid-cols-2">
            {/* Mobile-Optimized Due Problems */}
            <Card className="bg-white/95 backdrop-blur-2xl border-2 border-slate-200 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-red-50/80 to-orange-50/80 border-b border-red-100 p-4 sm:p-6">
                <CardTitle className="flex items-center justify-between text-red-800 text-lg sm:text-xl">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="hidden sm:inline">Due for Review</span>
                    <span className="sm:hidden">Due</span>
                  </div>
                  <Badge variant="secondary" className="bg-red-100 text-red-800 font-semibold px-2 sm:px-3 py-1">
                    {dueProblems.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {dueProblems.length === 0 ? (
                  <div className="text-center py-12 sm:py-16">
                    <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                      <TrendingUp className="w-8 h-8 sm:w-12 sm:h-12 text-green-600" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2 sm:mb-3">All Caught Up! 🎉</h3>
                    <p className="text-sm sm:text-base text-slate-600 mb-1 sm:mb-2">
                      No problems due for review right now.
                    </p>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Excellent work staying consistent with your studies!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-6">
                    {dueProblems.map((problem) => (
                      <div
                        key={problem.id}
                        className="bg-gradient-to-r from-slate-50 to-slate-100/50 border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 hover:shadow-lg transition-all duration-300"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-2 sm:mb-3 break-words">
                              {problem.title}
                            </h3>
                            <a
                              href={problem.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 active:text-blue-900 font-medium transition-all duration-200 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 px-3 py-2 rounded-lg hover:scale-105 active:scale-95 transform"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span className="hidden sm:inline">Open Problem</span>
                              <span className="sm:hidden">Open</span>
                            </a>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteProblem(problem.id)}
                            className="text-red-600 hover:text-red-800 active:text-red-900 hover:bg-red-50 active:bg-red-100 rounded-lg hover:scale-105 active:scale-95 transform transition-all duration-200 flex-shrink-0"
                          >
                            Delete
                          </Button>
                        </div>

                        <Separator className="bg-slate-300" />

                        <div>
                          <p className="text-sm font-medium mb-3 sm:mb-4 text-slate-700">Rate your performance:</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                            {gradingSystem.map((item) => (
                              <Tooltip key={item.grade}>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    onClick={() => gradeProblem(problem.id, item.grade)}
                                    className={`${item.color} text-white font-semibold transition-all duration-200 hover:scale-110 active:scale-95 hover:shadow-lg rounded-xl h-14 sm:h-12 flex flex-col gap-1 transform touch-manipulation`}
                                  >
                                    <span className="text-base sm:text-base">{item.grade}</span>
                                    <span className="text-xs opacity-90 hidden sm:block">{item.label}</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <p className="font-medium">{item.label}</p>
                                  <p className="text-sm opacity-90">{item.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mobile-Optimized Upcoming Problems */}
            <Card className="bg-white/95 backdrop-blur-2xl border-2 border-slate-200 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border-b border-blue-100 p-4 sm:p-6">
                <CardTitle className="flex items-center justify-between text-blue-800 text-lg sm:text-xl">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="hidden sm:inline">Upcoming Reviews</span>
                    <span className="sm:hidden">Upcoming</span>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 font-semibold px-2 sm:px-3 py-1">
                    {upcomingProblems.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {upcomingProblems.length === 0 ? (
                  <div className="text-center py-12 sm:py-16">
                    <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                      <Calendar className="w-8 h-8 sm:w-12 sm:h-12 text-blue-600" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2 sm:mb-3">Ready to Begin</h3>
                    <p className="text-sm sm:text-base text-slate-600 mb-1 sm:mb-2">
                      No upcoming reviews scheduled yet.
                    </p>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Add some problems above to start your learning journey!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {upcomingProblems.slice(0, 12).map((problem) => (
                      <div
                        key={problem.id}
                        className="flex items-center justify-between gap-3 p-3 sm:p-4 bg-gradient-to-r from-white to-slate-50/50 border border-slate-200 rounded-xl hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-800 mb-2 text-sm sm:text-base break-words">
                            {problem.title}
                          </h4>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                            <Badge
                              variant="outline"
                              className="text-xs bg-blue-50 text-blue-700 border-blue-200 font-medium"
                            >
                              📅 {formatDate(problem.nextReview)}
                            </Badge>
                            {problem.repetition > 0 && (
                              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 font-medium">
                                Review #{problem.repetition}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteProblem(problem.id)}
                          className="text-red-600 hover:text-red-800 active:text-red-900 hover:bg-red-50 active:bg-red-100 rounded-lg hover:scale-105 active:scale-95 transform transition-all duration-200 flex-shrink-0"
                        >
                          <span className="hidden sm:inline">Delete</span>
                          <span className="sm:hidden text-xs">Del</span>
                        </Button>
                      </div>
                    ))}
                    {upcomingProblems.length > 12 && (
                      <div className="text-center pt-3 sm:pt-4">
                        <Badge variant="outline" className="text-slate-600 bg-slate-50 px-3 sm:px-4 py-2">
                          ... and {upcomingProblems.length - 12} more scheduled
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Mobile-Optimized Stats Footer */}
          {problems.length > 0 && (
            <Card className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border-indigo-200 shadow-2xl">
              <CardContent className="p-4 sm:p-8">
                <div className="text-center space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm sm:text-base">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-sm"></div>
                      <span className="text-slate-700">
                        Total Problems: <strong className="text-slate-900">{problems.length}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-red-500 to-orange-500 rounded-full shadow-sm"></div>
                      <span className="text-slate-700">
                        Due Today: <strong className="text-slate-900">{dueProblems.length}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full shadow-sm"></div>
                      <span className="text-slate-700">
                        Total Reviews: <strong className="text-slate-900">{totalReviews}</strong>
                      </span>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 max-w-3xl mx-auto leading-relaxed">
                    The SM-2 algorithm optimizes your learning by scheduling reviews at the perfect moment—just before
                    you're likely to forget.
                    <strong className="text-slate-800">
                      {" "}
                      Stay consistent for maximum retention and accelerated mastery!
                    </strong>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}