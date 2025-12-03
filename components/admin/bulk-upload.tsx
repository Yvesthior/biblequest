"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, CheckCircle2, XCircle, Loader2, Download } from "lucide-react"
import Link from "next/link"

interface UploadResult {
  quizId: number
  title: string
  questionsCount: number
}

interface BulkUploadResponse {
  message: string
  results: UploadResult[]
  totalQuizzes: number
  totalQuestions: number
}

export function BulkUpload() {
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState<BulkUploadResponse | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.name.endsWith(".csv")) {
      setFile(droppedFile)
      setError("")
      setSuccess(null)
    } else {
      setError("Veuillez déposer un fichier CSV")
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.name.endsWith(".csv")) {
        setFile(selectedFile)
        setError("")
        setSuccess(null)
      } else {
        setError("Le fichier doit être au format CSV")
      }
    }
  }, [])

  const handleUpload = async () => {
    if (!file) {
      setError("Veuillez sélectionner un fichier CSV")
      return
    }

    setIsUploading(true)
    setError("")
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/admin/quizzes/bulk-upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'upload")
      }

      setSuccess(data)
      setFile(null)
      
      // Recharger la page après 2 secondes pour afficher les nouveaux quiz
      setTimeout(() => {
        router.refresh()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'upload")
    } finally {
      setIsUploading(false)
    }
  }

  const handleClear = () => {
    setFile(null)
    setError("")
    setSuccess(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import en masse (Bulk Upload)
        </CardTitle>
        <CardDescription>
          Importez plusieurs quiz et leurs questions depuis un fichier CSV
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Instructions */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
          <p className="font-medium">Instructions :</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Utilisez le template CSV disponible dans le dossier <code className="bg-background px-1 rounded">templates/</code></li>
            <li>Le fichier doit être au format CSV avec les colonnes requises</li>
            <li>Les questions avec le même <code className="bg-background px-1 rounded">quiz_title</code> seront regroupées dans un même quiz</li>
            <li>Les quiz existants avec le même titre seront mis à jour</li>
          </ul>
        </div>

        {/* Download Template Link */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Téléchargez le template CSV pour connaître le format attendu
            </span>
          </div>
          <a href="/templates/quiz_questions_template.csv" download>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Template CSV
            </Button>
          </a>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : file
              ? "border-green-500 bg-green-50/50 dark:bg-green-950/10"
              : "border-muted-foreground/25"
          }`}
        >
          {file ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-6 w-6" />
                <span className="font-medium">{file.name}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024).toFixed(2)} KB
              </p>
              <Button variant="outline" size="sm" onClick={handleClear}>
                Changer de fichier
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="text-sm font-medium mb-1">
                  Glissez-déposez votre fichier CSV ici
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  ou cliquez pour sélectionner
                </p>
                <label htmlFor="file-upload">
                  <input
                    id="file-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button asChild variant="outline" size="sm">
                    <span>Sélectionner un fichier</span>
                  </Button>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950/10">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <div className="space-y-2">
                <p className="font-medium">{success.message}</p>
                <div className="text-sm space-y-1">
                  <p>
                    <strong>{success.totalQuizzes}</strong> quiz créé(s) •{" "}
                    <strong>{success.totalQuestions}</strong> question(s) importée(s)
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    {success.results.map((result) => (
                      <li key={result.quizId}>
                        {result.title} ({result.questionsCount} question{result.questionsCount > 1 ? "s" : ""})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Upload Button */}
        {file && !success && (
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full"
            size="lg"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Upload en cours...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Importer le fichier
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
