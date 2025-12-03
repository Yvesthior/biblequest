"use client"

import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRight, BookOpen, Search, Filter, X, ChevronLeft, ChevronRight } from "lucide-react"
import { useDebouncedCallback } from "use-debounce"

interface Quiz {
  id: number
  title: string
  description: string | null
  category: string | null
  difficulty: string | null
  _count: {
    questions: number
  }
  isCompleted?: boolean
}

interface QuizListWithFiltersProps {
  quizzes: Quiz[]
  categories: string[]
  difficulties: string[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export function QuizListWithFilters({ quizzes, categories, difficulties, meta }: QuizListWithFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const searchTerm = searchParams.get("search") || ""
  const selectedCategory = searchParams.get("category") || "all"
  const selectedDifficulty = searchParams.get("difficulty") || "all"
  const currentPage = Number(searchParams.get("page")) || 1

  // Update URL helper
  const updateFilters = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "all") {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    // Reset page to 1 on filter change
    if (key !== "page") {
      params.set("page", "1")
    }
    router.push(`/quizzes?${params.toString()}`)
  }

  const handleSearch = useDebouncedCallback((term: string) => {
    updateFilters("search", term)
  }, 300)

  const clearFilters = () => {
    router.push("/quizzes")
  }

  const hasActiveFilters = searchTerm || (selectedCategory && selectedCategory !== "all") || (selectedDifficulty && selectedDifficulty !== "all")

  return (
    <div className="space-y-6">
      {/* Filters - Mobile First */}
      <div className="glass-card rounded-3xl p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Filtres</h2>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-xs">
              <X className="h-3 w-3" />
              Effacer
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un quiz..."
              defaultValue={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 glass border-border/50"
            />
          </div>

          {/* Filters Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-2 block text-foreground">Catégorie</label>
              <Select 
                value={selectedCategory} 
                onValueChange={(value) => updateFilters("category", value)}
              >
                <SelectTrigger className="glass border-border/50">
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-foreground">Difficulté</label>
              <Select 
                value={selectedDifficulty} 
                onValueChange={(value) => updateFilters("difficulty", value)}
              >
                <SelectTrigger className="glass border-border/50">
                  <SelectValue placeholder="Toutes les difficultés" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les difficultés</SelectItem>
                  {difficulties.map((difficulty) => (
                    <SelectItem key={difficulty} value={difficulty}>
                      {difficulty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            {meta.total} quiz trouvé{meta.total > 1 ? "s" : ""}
          </p>
        </div>

        {quizzes.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground text-lg">
              {hasActiveFilters
                ? "Aucun quiz ne correspond à vos critères de recherche."
                : "Aucun quiz disponible pour le moment."
              }
            </p>
          </div>
        ) : (
          <>
            {/* Quiz Grid - Mobile First */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {quizzes.map((quiz) => (
                <Link
                  key={quiz.id}
                  href={`/quizzes/${quiz.id}`}
                  className="glass-card rounded-3xl p-5 hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2">
                        {quiz.title}
                      </h3>
                      {quiz.isCompleted && (
                        <Badge variant="default" className="mb-2">Terminé</Badge>
                      )}
                      {quiz.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {quiz.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {quiz.category && (
                      <Badge variant="secondary" className="text-xs">
                        {quiz.category}
                      </Badge>
                    )}
                    {quiz.difficulty && (
                      <Badge
                        variant={
                          quiz.difficulty === "Facile"
                            ? "default"
                            : quiz.difficulty === "Moyen"
                            ? "secondary"
                            : "destructive"
                        }
                        className="text-xs"
                      >
                        {quiz.difficulty}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <span className="text-sm font-medium text-muted-foreground">
                      {quiz._count.questions} {quiz._count.questions > 1 ? "questions" : "question"}
                    </span>
                    <div className="flex items-center gap-1 text-primary font-semibold text-sm">
                      Commencer
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination - Mobile First */}
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilters("page", String(Math.max(currentPage - 1, 1)))}
                  disabled={currentPage === 1}
                  className="glass border-border/50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Précédent</span>
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => {
                    let page
                    if (meta.totalPages <= 5) {
                      page = i + 1
                    } else if (currentPage <= 3) {
                      page = i + 1
                    } else if (currentPage >= meta.totalPages - 2) {
                      page = meta.totalPages - 4 + i
                    } else {
                      page = currentPage - 2 + i
                    }
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateFilters("page", String(page))}
                        className={`w-10 h-10 p-0 ${currentPage === page ? "" : "glass border-border/50"}`}
                      >
                        {page}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilters("page", String(Math.min(currentPage + 1, meta.totalPages)))}
                  disabled={currentPage === meta.totalPages}
                  className="glass border-border/50"
                >
                  <span className="hidden sm:inline">Suivant</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}