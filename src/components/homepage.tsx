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
    label: "No Pattern",
    description: "Couldn't identify any patterns or approaches to solve",
    color: "bg-slate-600 hover:bg-slate-700 active:bg-slate-800",
    textColor: "text-slate-600",
  },
  {
    grade: 1,
    label: "Pattern Glimpse",
    description: "Saw some patterns but couldn't form a complete solution",
    color: "bg-red-500 hover:bg-red-600 active:bg-red-700",
    textColor: "text-red-600",
  },
  {
    grade: 2,
    label: "Solution Path",
    description: "Identified the right approach but couldn't implement it correctly",
    color: "bg-orange-500 hover:bg-orange-600 active:bg-orange-700",
    textColor: "text-orange-600",
  },
  {
    grade: 3,
    label: "Working Solution",
    description: "Solved it with a suboptimal approach or needed hints",
    color: "bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700",
    textColor: "text-yellow-600",
  },
  {
    grade: 4,
    label: "Clean Solution",
    description: "Solved it efficiently with minimal help or hints",
    color: "bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700",
    textColor: "text-emerald-600",
  },
  {
    grade: 5,
    label: "Pattern Mastered",
    description: "Instantly recognized the pattern and implemented optimal solution",
    color: "bg-green-500 hover:bg-green-600 active:bg-green-700",
    textColor: "text-green-600",
  },
]

export default function LeetRepeat() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [newProblemUrl, setNewProblemUrl] = useState("")
  const [showExplanation, setShowExplanation] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Load problems from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("leetcode-problems")
      console.log("Loading from localStorage:", saved)
      if (saved) {
        const parsed = JSON.parse(saved)
        console.log("Parsed data:", parsed)
        // Convert date strings back to Date objects
        const problemsWithDates = parsed.map((p: any) => {
          try {
            return {
              ...p,
              nextReview: new Date(p.nextReview),
              lastReviewed: p.lastReviewed ? new Date(p.lastReviewed) : undefined,
            }
          } catch (e) {
            console.error("Error converting dates for problem:", p, e)
            return p
          }
        })
        console.log("Problems with dates:", problemsWithDates)
        setProblems(problemsWithDates)
      } else {
        console.log("No saved problems found in localStorage")
      }
    } catch (e) {
      console.error("Error loading from localStorage:", e)
    }
  }, [])

  // Save problems to localStorage whenever problems change
  useEffect(() => {
    try {
      console.log("Saving to localStorage:", problems)
      if (problems.length > 0) {
        const dataToSave = problems.map(p => ({
          ...p,
          nextReview: p.nextReview.toISOString(),
          lastReviewed: p.lastReviewed?.toISOString()
        }))
        console.log("Data being saved:", dataToSave)
        localStorage.setItem("leetcode-problems", JSON.stringify(dataToSave))
      } else {
        console.log("No problems to save")
      }
    } catch (e) {
      console.error("Error saving to localStorage:", e)
    }
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
      <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50">
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

        <div className="relative h-full max-w-7xl mx-auto p-2 sm:p-4 flex flex-col">
          <div className="flex-none">
            {/* Compact Hero Section */}
            <div className="text-center space-y-2 sm:space-y-4 py-2 sm:py-4">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-2 sm:mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl sm:rounded-2xl blur-xl opacity-25 animate-pulse"></div>
                  <div className="relative p-2 sm:p-3 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-xl sm:rounded-2xl shadow-xl border border-blue-500/20">
                    <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-white drop-shadow-lg" />
                  </div>
                </div>
                <div className="text-center">
                  <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent leading-tight tracking-tight">
                    LeetRepeat
                  </h1>
                  <p className="text-sm sm:text-base text-slate-500 font-semibold tracking-wide">
                    LeetCode Mastery Through Spaced Repetition
                  </p>
                </div>
              </div>

              <div className="max-w-4xl mx-auto space-y-1 sm:space-y-2 px-2">
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-light">
                  Transform your coding interview preparation with scientifically-proven spaced repetition
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="w-full sm:w-auto border-2 border-blue-300 text-blue-800 hover:bg-blue-50 hover:border-blue-400 active:bg-blue-100 font-semibold px-4 sm:px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm hover:scale-105 active:scale-95 transform"
                >
                  <Info className="w-4 h-4 mr-2" />
                  {showExplanation ? "Hide Guide" : "How It Works"}
                </Button>

                {problems.length > 0 && (
                  <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      <span className="font-semibold text-slate-800 text-sm">{totalReviews}</span>
                      <span className="text-slate-600 text-sm">reviews completed</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {/* Explanation Section */}
              {showExplanation && (
                <Card className="bg-white/95 backdrop-blur-2xl border-2 border-blue-100 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border-b border-blue-100 p-2 sm:p-4">
                    <CardTitle className="flex items-center gap-2 text-blue-900 text-base sm:text-lg">
                      <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                      Complete Guide to Spaced Repetition Learning
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-4 space-y-4">
                    <div className="grid gap-4 lg:grid-cols-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                          </div>
                          <h3 className="text-sm font-semibold text-slate-800">Pattern Recognition</h3>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          LeetCode problems often follow common patterns and techniques. Spaced repetition helps you build
                          pattern recognition skills by reviewing problems at optimal intervals, making it easier to identify
                          the right approach quickly.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                          </div>
                          <h3 className="text-sm font-semibold text-slate-800">SM-2 Algorithm</h3>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          The SM-2 algorithm adapts to your problem-solving ability. Problems you solve easily are reviewed
                          less frequently, while challenging ones appear more often. This helps you focus on patterns that
                          need more practice.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                          </div>
                          <h3 className="text-sm font-semibold text-slate-800">Learning Workflow</h3>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Add LeetCode problems you want to master. When reviewing, focus on pattern recognition and
                          implementation quality. Rate your performance based on how well you identified and applied the
                          solution pattern.
                        </p>
                      </div>
                    </div>

                    <Separator className="bg-gradient-to-r from-transparent via-blue-200 to-transparent" />

                    <div className="bg-gradient-to-r from-slate-50 to-blue-50/50 rounded-lg p-3 border border-slate-200">
                      <div className="flex items-center gap-2 mb-3">
                        <HelpCircle className="w-4 h-4 text-slate-600" />
                        <h4 className="text-sm font-semibold text-slate-800">Pattern Recognition Guide</h4>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {gradingSystem.map((item) => (
                          <div
                            key={item.grade}
                            className="bg-white rounded-lg p-2 border border-slate-200 hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <div
                                className={`w-6 h-6 rounded-full ${item.color} text-white text-xs font-bold flex items-center justify-center shadow-sm`}
                              >
                                {item.grade}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800 text-xs">{item.label}</p>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-600 leading-relaxed">{item.description}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-[10px] text-blue-800 font-medium text-center">
                          💡 <strong>Pro Tip:</strong> Focus on recognizing patterns rather than memorizing solutions. 
                          Grades 0-2 indicate you need more practice with this pattern, while grades 3-5 show you're 
                          mastering it.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Compact Add Problem Section */}
              <Card className="bg-white/95 backdrop-blur-2xl border-2 border-slate-200 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 border-b border-emerald-100 p-2 sm:p-4">
                  <CardTitle className="flex items-center gap-2 text-emerald-800 text-base sm:text-lg">
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    Add New Problem
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-4">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <div className="flex-1">
                      <Label htmlFor="problem-url" className="text-xs font-medium text-slate-700 mb-1 block">
                        LeetCode Problem URL
                      </Label>
                      <Input
                        id="problem-url"
                        placeholder="https://leetcode.com/problems/two-sum/"
                        value={newProblemUrl}
                        onChange={(e) => setNewProblemUrl(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addProblem()}
                        className="border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 h-9 text-sm rounded-lg"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="flex flex-col justify-end">
                      <Button
                        onClick={addProblem}
                        disabled={!newProblemUrl.trim() || isLoading}
                        className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:from-emerald-700 active:to-teal-800 text-white px-4 sm:px-6 h-9 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 transform text-sm"
                      >
                        {isLoading ? "Adding..." : "Add Problem"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex-1 mt-4">
            <div className="grid gap-3 sm:gap-4 xl:grid-cols-2">
              {/* Compact Due Problems */}
              <Card className="bg-white/95 backdrop-blur-2xl border-2 border-slate-200 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-red-50/80 to-orange-50/80 border-b border-red-100 p-2 sm:p-4">
                  <CardTitle className="flex items-center justify-between text-red-800 text-base sm:text-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Due for Review</span>
                    </div>
                    <Badge variant="secondary" className="bg-red-100 text-red-800 font-semibold px-2 py-0.5">
                      {dueProblems.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-4">
                  {dueProblems.length === 0 ? (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      </div>
                      <h3 className="text-base font-semibold text-slate-800 mb-1">All Caught Up! 🎉</h3>
                      <p className="text-xs text-slate-600">No problems due for review right now.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dueProblems.map((problem) => (
                        <div
                          key={problem.id}
                          className="bg-gradient-to-r from-slate-50 to-slate-100/50 border border-slate-200 rounded-lg p-2 sm:p-3 space-y-2 hover:shadow-md transition-all duration-300"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-slate-800 mb-1 break-words">
                                {problem.title}
                              </h3>
                              <a
                                href={problem.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 active:text-blue-900 font-medium transition-all duration-200 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 px-2 py-1 rounded-md hover:scale-105 active:scale-95 transform text-xs"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Open Problem
                              </a>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteProblem(problem.id)}
                              className="text-red-600 hover:text-red-800 active:text-red-900 hover:bg-red-50 active:bg-red-100 rounded-md hover:scale-105 active:scale-95 transform transition-all duration-200 flex-shrink-0 h-7 text-xs"
                            >
                              Delete
                            </Button>
                          </div>

                          <Separator className="bg-slate-300" />

                          <div>
                            <p className="text-xs font-medium mb-2 text-slate-700">Rate your performance:</p>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
                              {gradingSystem.map((item) => (
                                <Tooltip key={item.grade}>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      onClick={() => gradeProblem(problem.id, item.grade)}
                                      className={`${item.color} text-white font-semibold transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-md rounded-lg h-8 flex flex-col gap-0.5 transform touch-manipulation text-xs`}
                                    >
                                      <span>{item.grade}</span>
                                      <span className="text-[10px] opacity-90">{item.label}</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p className="font-medium">{item.label}</p>
                                    <p className="text-xs opacity-90">{item.description}</p>
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

              {/* Compact Upcoming Problems */}
              <Card className="bg-white/95 backdrop-blur-2xl border-2 border-slate-200 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border-b border-blue-100 p-2 sm:p-4">
                  <CardTitle className="flex items-center justify-between text-blue-800 text-base sm:text-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Upcoming Reviews</span>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 font-semibold px-2 py-0.5">
                      {upcomingProblems.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-4">
                  {upcomingProblems.length === 0 ? (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                        <Calendar className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="text-base font-semibold text-slate-800 mb-1">Ready to Begin</h3>
                      <p className="text-xs text-slate-600">Add some problems above to start your learning journey!</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {upcomingProblems.slice(0, 8).map((problem) => (
                        <div
                          key={problem.id}
                          className="flex items-center justify-between gap-2 p-2 bg-gradient-to-r from-white to-slate-50/50 border border-slate-200 rounded-lg hover:shadow-sm transition-all duration-200"
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-800 mb-1 text-xs break-words">
                              {problem.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 font-medium"
                              >
                                📅 {formatDate(problem.nextReview)}
                              </Badge>
                              {problem.repetition > 0 && (
                                <Badge variant="secondary" className="text-[10px] bg-purple-100 text-purple-700 font-medium">
                                  Review #{problem.repetition}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteProblem(problem.id)}
                            className="text-red-600 hover:text-red-800 active:text-red-900 hover:bg-red-50 active:bg-red-100 rounded-md hover:scale-105 active:scale-95 transform transition-all duration-200 flex-shrink-0 h-6 text-xs"
                          >
                            Del
                          </Button>
                        </div>
                      ))}
                      {upcomingProblems.length > 8 && (
                        <div className="text-center pt-2">
                          <Badge variant="outline" className="text-slate-600 bg-slate-50 px-2 py-1 text-xs">
                            ... and {upcomingProblems.length - 8} more scheduled
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}