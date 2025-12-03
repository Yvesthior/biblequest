"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, CheckCircle2, XCircle, Loader2, Download, ArrowLeft, FileJson } from "lucide-react"

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
  logs?: string[]
  errors?: string[]
}

export function BulkUploadPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"csv" | "json">("csv")
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [jsonContent, setJsonContent] = useState("")
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
    if (droppedFile) {
      if (activeTab === "csv" && droppedFile.name.endsWith(".csv")) {
        setFile(droppedFile)
        setError("")
        setSuccess(null)
      } else if (activeTab === "json" && droppedFile.name.endsWith(".json")) {
        setFile(droppedFile)
        droppedFile.text().then((text) => {
          setJsonContent(text)
        })
        setError("")
        setSuccess(null)
      } else {
        setError(
          activeTab === "csv"
            ? "Veuillez déposer un fichier CSV"
            : "Veuillez déposer un fichier JSON"
        )
      }
    }
  }, [activeTab])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (selectedFile) {
        if (activeTab === "csv" && selectedFile.name.endsWith(".csv")) {
          setFile(selectedFile)
          setError("")
          setSuccess(null)
        } else if (activeTab === "json" && selectedFile.name.endsWith(".json")) {
          setFile(selectedFile)
          selectedFile.text().then((text) => {
            setJsonContent(text)
          })
          setError("")
          setSuccess(null)
        } else {
          setError(
            activeTab === "csv"
              ? "Le fichier doit être au format CSV"
              : "Le fichier doit être au format JSON"
          )
        }
      }
    },
    [activeTab]
  )

  const handleCSVUpload = async () => {
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

  const handleJSONUpload = async () => {
    if (!jsonContent.trim()) {
      setError("Veuillez entrer ou sélectionner un fichier JSON")
      return
    }

    setIsUploading(true)
    setError("")
    setSuccess(null)

    try {
      // Valider le JSON
      let parsedData
      try {
        parsedData = JSON.parse(jsonContent)
      } catch (parseError) {
        throw new Error("Le JSON est invalide. Veuillez vérifier la syntaxe.")
      }

      const response = await fetch("/api/admin/quizzes/bulk-upload-json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsedData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'upload")
      }

      setSuccess(data)

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
    setJsonContent("")
    setError("")
    setSuccess(null)
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground">Import en masse</h1>
              <p className="text-muted-foreground">
                Importez plusieurs quiz et leurs questions depuis un fichier CSV ou JSON
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => {
          setActiveTab(v as "csv" | "json")
          handleClear()
        }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="csv">
              <FileText className="h-4 w-4 mr-2" />
              Import CSV
            </TabsTrigger>
            <TabsTrigger value="json">
              <FileJson className="h-4 w-4 mr-2" />
              Import JSON
            </TabsTrigger>
          </TabsList>

          {/* CSV Tab */}
          <TabsContent value="csv" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Import CSV
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
                    <li>Utilisez le template CSV disponible ci-dessous</li>
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
                        <label htmlFor="csv-upload">
                          <input
                            id="csv-upload"
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

                {/* Upload Button */}
                {file && !success && (
                  <Button
                    onClick={handleCSVUpload}
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
                        Importer le fichier CSV
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* JSON Tab */}
          <TabsContent value="json" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileJson className="h-5 w-5" />
                  Import JSON
                </CardTitle>
                <CardDescription>
                  Importez plusieurs quiz et leurs questions depuis un fichier JSON
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Instructions */}
                <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                  <p className="font-medium">Format JSON attendu :</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Le format JSON est similaire au CSV : chaque objet représente une question. Les questions avec le même <code className="bg-background px-1 rounded">quiz_title</code> seront regroupées dans un même quiz.
                  </p>
                  <pre className="bg-background p-3 rounded text-xs overflow-x-auto">
{`[
  {
    "quiz_title": "Au Commencement",
    "quiz_description": "Un quiz sur la création...",
    "quiz_category": "Ancien Testament",
    "quiz_difficulty": "Facile",
    "question_text": "Texte de la question",
    "option_1": "Option 1",
    "option_2": "Option 2",
    "option_3": "Option 3",
    "option_4": "Option 4",
    "correct_option_index": 1,
    "explanation": "Explication",
    "reference": "Genèse 1:1"
  }
]`}
                  </pre>
                </div>

                {/* Download Template Link */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Téléchargez le template JSON pour connaître le format attendu
                    </span>
                  </div>
                  <a href="/templates/quiz_questions_template.json" download>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Template JSON
                    </Button>
                  </a>
                </div>

                {/* File Upload or Text Area */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">
                      Vous pouvez soit téléverser un fichier JSON, soit coller le contenu directement
                    </span>
                    <label htmlFor="json-upload">
                      <input
                        id="json-upload"
                        type="file"
                        accept=".json"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button variant="outline" size="sm" asChild>
                        <span>Sélectionner un fichier</span>
                      </Button>
                    </label>
                  </div>

                  <textarea
                    value={jsonContent}
                    onChange={(e) => {
                      setJsonContent(e.target.value)
                      setError("")
                      setSuccess(null)
                    }}
                    placeholder="Collez votre JSON ici ou sélectionnez un fichier..."
                    className="w-full min-h-[300px] p-4 border rounded-lg font-mono text-sm"
                  />
                </div>

                {/* Upload Button */}
                {jsonContent.trim() && !success && (
                  <Button
                    onClick={handleJSONUpload}
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
                        Importer le JSON
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mt-4">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert with Logs */}
        {success && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950/10 mt-4">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <div className="space-y-3">
                <p className="font-medium">{success.message}</p>
                <div className="text-sm space-y-1">
                  <p>
                    <strong>{success.totalQuizzes}</strong> quiz créé(s) •{" "}
                    <strong>{success.totalQuestions}</strong> question(s) importée(s)
                  </p>
                  {success.results && success.results.length > 0 && (
                    <ul className="list-disc list-inside space-y-1">
                      {success.results.map((result) => (
                        <li key={result.quizId}>
                          ✓ {result.title} ({result.questionsCount} question{result.questionsCount > 1 ? "s" : ""})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {/* Logs */}
                {success.logs && success.logs.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-green-300 dark:border-green-800">
                    <p className="font-medium mb-2">Logs :</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      {success.logs.map((log, index) => (
                        <li key={index}>{log}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Errors */}
                {success.errors && success.errors.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-red-300 dark:border-red-800">
                    <p className="font-medium mb-2 text-red-600 dark:text-red-400">Erreurs :</p>
                    <ul className="list-disc list-inside space-y-1 text-xs text-red-600 dark:text-red-400">
                      {success.errors.map((err, index) => (
                        <li key={index}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
