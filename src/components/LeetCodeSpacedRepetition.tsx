import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ExternalLink, Plus, Calendar, Clock, Brain, Info, BookOpen, Target, Zap } from "lucide-react"

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

// SM-2 Algorithm implementation
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

export default function LeetCodeSpacedRepetition() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [newProblemUrl, setNewProblemUrl] = useState("")
  const [showExplanation, setShowExplanation] = useState(false)

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

  const addProblem = () => {
    if (!newProblemUrl.trim()) return

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

  const getDifficultyColor = (grade: number) => {
    const colors = {
      1: "bg-red-500 hover:bg-red-600",
      2: "bg-orange-500 hover:bg-orange-600",
      3: "bg-yellow-500 hover:bg-yellow-600",
      4: "bg-emerald-500 hover:bg-emerald-600",
      5: "bg-green-500 hover:bg-green-600",
    }
    return colors[grade as keyof typeof colors] || "bg-gray-500"
  }

  const getDifficultyLabel = (grade: number) => {
    const labels = {
      1: "Very Hard",
      2: "Hard",
      3: "Medium",
      4: "Easy",
      5: "Very Easy",
    }
    return labels[grade as keyof typeof labels] || ""
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto p-4 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              LeetCode Spaced Repetition
            </h1>
          </div>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Master coding problems through systematic review using the scientifically-proven SM-2 algorithm
          </p>
          <Button
            variant="outline"
            onClick={() => setShowExplanation(!showExplanation)}
            className="mt-4 border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <Info className="w-4 h-4 mr-2" />
            {showExplanation ? "Hide" : "How does this work?"}
          </Button>
        </div>

        {/* Explanation Section */}
        {showExplanation && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <BookOpen className="w-5 h-5" />
                Understanding Spaced Repetition & SM-2
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-slate-800">What is Spaced Repetition?</h3>
                  </div>
                  <p className="text-sm text-slate-600">
                    A learning technique that increases intervals between reviews of material based on how well you know
                    it. It exploits the psychological spacing effect to improve long-term retention.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-slate-800">The SM-2 Algorithm</h3>
                  </div>
                  <p className="text-sm text-slate-600">
                    Developed in the 1980s, SM-2 calculates optimal review intervals based on your performance. Easy
                    problems are shown less frequently, difficult ones more often.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-orange-600" />
                    <h3 className="font-semibold text-slate-800">How to Use This App</h3>
                  </div>
                  <p className="text-sm text-slate-600">
                    Add LeetCode problems, solve them when due, then rate difficulty 1-5. The algorithm will schedule
                    optimal review times to maximize retention.
                  </p>
                </div>
              </div>

              <Separator className="bg-blue-200" />

              <div className="bg-white/50 rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 mb-3">Grading Scale:</h4>
                <div className="grid grid-cols-5 gap-2 text-center">
                  {[1, 2, 3, 4, 5].map((grade) => (
                    <div key={grade} className="space-y-2">
                      <div
                        className={`w-8 h-8 rounded-full ${getDifficultyColor(grade)} text-white text-sm font-bold flex items-center justify-center mx-auto`}
                      >
                        {grade}
                      </div>
                      <p className="text-xs text-slate-600">{getDifficultyLabel(grade)}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-3 text-center">
                  Grades 1-2 reset the problem, 3+ increase the review interval
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add New Problem */}
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
            <CardTitle className="flex items-center gap-2 text-emerald-800">
              <Plus className="w-5 h-5" />
              Add New Problem
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="problem-url" className="sr-only">
                  LeetCode Problem URL
                </Label>
                <Input
                  id="problem-url"
                  placeholder="https://leetcode.com/problems/two-sum/"
                  value={newProblemUrl}
                  onChange={(e) => setNewProblemUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addProblem()}
                  className="border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              <Button
                onClick={addProblem}
                disabled={!newProblemUrl.trim()}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6"
              >
                Add Problem
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Due Problems */}
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
              <CardTitle className="flex items-center gap-2 text-red-800">
                <Clock className="w-5 h-5" />
                Due for Review ({dueProblems.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {dueProblems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">All caught up!</h3>
                  <p className="text-slate-600 mb-1">No problems due for review.</p>
                  <p className="text-sm text-slate-500">Great job staying on top of your studies.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dueProblems.map((problem) => (
                    <div
                      key={problem.id}
                      className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-5 space-y-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-800 mb-2">{problem.title}</h3>
                          <a
                            href={problem.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Open Problem
                          </a>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteProblem(problem.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      </div>

                      <Separator className="bg-slate-300" />

                      <div>
                        <p className="text-sm text-slate-700 font-medium mb-3">How difficult was this problem?</p>
                        <div className="grid grid-cols-5 gap-2">
                          {[1, 2, 3, 4, 5].map((grade) => (
                            <Button
                              key={grade}
                              size="sm"
                              onClick={() => gradeProblem(problem.id, grade)}
                              className={`${getDifficultyColor(grade)} text-white font-semibold transition-all hover:scale-105`}
                            >
                              {grade}
                            </Button>
                          ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-2 text-center">1 = Very Hard → 5 = Very Easy</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Problems */}
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Calendar className="w-5 h-5" />
                Upcoming Reviews ({upcomingProblems.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {upcomingProblems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">No upcoming reviews</h3>
                  <p className="text-slate-600 mb-1">Add some problems to get started!</p>
                  <p className="text-sm text-slate-500">Your learning journey begins here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingProblems.slice(0, 10).map((problem) => (
                    <div
                      key={problem.id}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-slate-50 border border-slate-200 rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-800 mb-2">{problem.title}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            {formatDate(problem.nextReview)}
                          </Badge>
                          {problem.repetition > 0 && (
                            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                              Review #{problem.repetition}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteProblem(problem.id)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                  {upcomingProblems.length > 10 && (
                    <div className="text-center pt-3">
                      <Badge variant="outline" className="text-slate-600">
                        ... and {upcomingProblems.length - 10} more
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Footer */}
        {problems.length > 0 && (
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                    <span className="text-slate-700">
                      Total Problems: <strong>{problems.length}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-full"></div>
                    <span className="text-slate-700">
                      Due Today: <strong>{dueProblems.length}</strong>
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 max-w-2xl mx-auto">
                  The SM-2 algorithm optimizes your learning by scheduling reviews at the perfect moment - just before
                  you're likely to forget. Stay consistent for maximum retention!
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 