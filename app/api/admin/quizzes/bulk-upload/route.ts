import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-user"
import { Quiz, Question } from "@/models"

export async function POST(request: Request) {
  const logs: string[] = []
  const errors: string[] = []

  try {
    const user = await getCurrentUser()

    if (!user) {
      logs.push("❌ Authentification requise")
      return NextResponse.json({ error: "Non authentifié", logs }, { status: 401 })
    }

    if (user.role !== "ADMIN") {
      logs.push("❌ Accès non autorisé")
      return NextResponse.json({ error: "Non autorisé", logs }, { status: 403 })
    }

    logs.push("✅ Authentification réussie")
    logs.push("📥 Début du traitement CSV...")

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      errors.push("Aucun fichier fourni")
      logs.push("❌ Aucun fichier fourni")
      return NextResponse.json({ error: "Aucun fichier fourni", logs, errors }, { status: 400 })
    }

    logs.push(`📄 Fichier reçu : ${file.name} (${(file.size / 1024).toFixed(2)} KB)`)

    // Vérifier le type de fichier
    if (!file.name.endsWith(".csv")) {
      errors.push("Le fichier doit être au format CSV")
      logs.push("❌ Format de fichier invalide (attendu: .csv)")
      return NextResponse.json({ error: "Le fichier doit être au format CSV", logs, errors }, { status: 400 })
    }

    logs.push("✅ Format CSV valide")

    // Lire le contenu du fichier
    let text = await file.text()
    // Normaliser les fins de ligne (gérer Windows \r\n, Unix \n, Mac \r)
    text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
    const lines = text.split("\n").filter((line) => line.trim())

    logs.push(`📋 ${lines.length} ligne(s) trouvée(s) dans le fichier`)

    if (lines.length < 2) {
      errors.push("Le fichier CSV doit contenir au moins une ligne de données (après l'en-tête)")
      logs.push("❌ Pas assez de lignes dans le fichier")
      return NextResponse.json(
        { error: "Le fichier CSV doit contenir au moins une ligne de données (après l'en-tête)", logs, errors },
        { status: 400 }
      )
    }

    // Parser le CSV avec support complet du format Excel (RFC 4180)
    // Format Excel: champs peuvent être entourés de guillemets, guillemets doublés pour échapper
    // Gère aussi le format spécial où chaque champ commence par "" au lieu de "
    const parseCSVLine = (line: string): string[] => {
      const values: string[] = []
      let current = ""
      let inQuotes = false
      let i = 0

      while (i < line.length) {
        const char = line[i]
        const nextChar = i < line.length - 1 ? line[i + 1] : ""
        const nextNextChar = i < line.length - 2 ? line[i + 2] : ""

        // Gérer les guillemets
        if (char === '"') {
          if (inQuotes) {
            // On est dans un champ entre guillemets
            if (nextChar === '"') {
              // Double guillemet peut être :
              // 1. Un guillemet échappé dans le contenu (Excel format: "")
              // 2. La fin du champ suivie d'un nouveau champ commençant par ""
              if (nextNextChar === ",") {
                // Fin du champ actuel (suivi de ",")
                inQuotes = false
                i += 3 // Skip """,
                values.push(current)
                current = ""
                // Le prochain champ commence juste après
                if (i < line.length && line[i] === '"') {
                  inQuotes = true
                  i++
                }
                continue
              } else if (nextNextChar === '"') {
                // Triple guillemet - probablement """" qui signifie guillemet échappé puis fin de champ
                // Mais cela semble peu probable, traiter comme guillemet échappé
                current += '"'
                i += 2
                continue
              } else {
                // Guillemet échappé dans le contenu
                current += '"'
                i += 2
                continue
              }
            } else if (nextChar === "," || nextChar === "\r" || nextChar === "\n" || nextChar === "" || i === line.length - 1) {
              // Fin du champ entre guillemets (suivi de virgule, retour à la ligne ou fin de fichier)
              inQuotes = false
              i++ // Skip le guillemet de fermeture
              if (nextChar === ",") {
                i++ // Skip aussi la virgule
              }
              // Terminer le champ actuel
              values.push(current)
              current = ""
              continue
            } else {
              // Cas étrange : guillemet à l'intérieur sans être doublé
              current += char
              i++
            }
          } else {
            // Début d'un champ entre guillemets
            // Vérifier si c'est le format spécial "" (double guillemet au début)
            if (nextChar === '"') {
              // Format spécial : "" au début du champ
              inQuotes = true
              i += 2 // Skip les deux guillemets
              continue
            } else {
              // Format standard : " au début du champ
              inQuotes = true
              i++ // Skip le guillemet d'ouverture
              continue
            }
          }
        } else if (char === ",") {
          if (inQuotes) {
            // Virgule à l'intérieur d'un champ entre guillemets - faire partie du contenu
            current += char
            i++
          } else {
            // Séparateur de champ
            values.push(current)
            current = ""
            i++
            continue
          }
        } else {
          // Caractère normal à ajouter au champ actuel
          current += char
          i++
        }
      }

      // Ajouter le dernier champ (même si on est encore dans des guillemets)
      if (current.length > 0 || values.length === 0) {
        values.push(current)
      }

      return values
    }

    // Parser l'en-tête et les lignes
    // L'en-tête n'a généralement pas de guillemets
    const headerLine = lines[0]
    const headers = headerLine.split(",").map((h) => h.trim())

    // Parser les lignes de données avec le parser CSV complet
    const rows = lines.slice(1).map((line) => {
      const parsed = parseCSVLine(line)
      // S'assurer que toutes les colonnes sont présentes
      while (parsed.length < headers.length) {
        parsed.push("")
      }
      return parsed.slice(0, headers.length) // Ne garder que les colonnes correspondant aux en-têtes
    })

    logs.push(`📊 ${headers.length} colonne(s) détectée(s) : ${headers.join(", ")}`)

    // Valider les colonnes requises
    const requiredColumns = ["quiz_title", "question_text", "option_1", "option_2", "correct_option_index"]
    const missingColumns = requiredColumns.filter((col) => !headers.includes(col))
    if (missingColumns.length > 0) {
      errors.push(`Colonnes manquantes: ${missingColumns.join(", ")}`)
      logs.push(`❌ Colonnes requises manquantes: ${missingColumns.join(", ")}`)
      return NextResponse.json(
        { error: `Colonnes manquantes: ${missingColumns.join(", ")}`, logs, errors },
        { status: 400 }
      )
    }

    logs.push("✅ Toutes les colonnes requises sont présentes")

    logs.push(`🔄 Parsing de ${rows.length} ligne(s) de données...`)

    // Grouper les questions par quiz
    const quizMap = new Map<string, any[]>()
    let processedRows = 0
    let skippedRows = 0

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex]
      const rowData: any = {}

      // Parser les données de la ligne
      // Le parser a déjà géré les guillemets, on a juste besoin de trimmer
      headers.forEach((header, index) => {
        const rawValue = row[index] || ""
        // Les valeurs sont déjà nettoyées par le parser (guillemets externes enlevés, "" remplacés par ")
        rowData[header] = rawValue.trim()
      })

      const quizTitle = rowData.quiz_title?.trim()
      if (!quizTitle) {
        skippedRows++
        logs.push(`⚠️ Ligne ${rowIndex + 2} ignorée : titre de quiz manquant`)
        continue // Ignorer les lignes sans titre de quiz
      }

      if (!quizMap.has(quizTitle)) {
        quizMap.set(quizTitle, [])
        logs.push(`📝 Nouveau quiz détecté : "${quizTitle}"`)
      }

      const options: string[] = []
      for (let i = 1; i <= 4; i++) {
        const option = rowData[`option_${i}`]?.trim()
        if (option && option !== '""' && option !== '' && option !== '"') {
          options.push(option)
        }
      }

      if (options.length < 2) {
        const errorMsg = `Ligne ${rowIndex + 2} avec le quiz "${quizTitle.substring(0, 50)}..." : au moins 2 options sont requises (trouvé: ${options.length})`
        errors.push(errorMsg)
        logs.push(`❌ ${errorMsg}`)
        skippedRows++
        continue // Passer à la ligne suivante au lieu de retourner une erreur
      }

      logs.push(`✅ Ligne ${rowIndex + 2} : ${options.length} option(s) trouvée(s) pour "${quizTitle}"`)

      const correctIndex = parseInt(rowData.correct_option_index?.trim() || "0")
      if (isNaN(correctIndex) || correctIndex < 1 || correctIndex > options.length) {
        const errorMsg = `Ligne ${rowIndex + 2} avec le quiz "${quizTitle}" : index de réponse correcte invalide (doit être entre 1 et ${options.length}, trouvé: ${correctIndex})`
        errors.push(errorMsg)
        logs.push(`❌ ${errorMsg}`)
        skippedRows++
        continue
      }

      quizMap.get(quizTitle)!.push({
        questionText: rowData.question_text?.trim() || "",
        options,
        correctOptionIndex: correctIndex - 1, // Convertir de 1-based à 0-based
        explanation: rowData.explanation?.trim() || "",
        reference: rowData.reference?.trim() || null,
      })
      processedRows++
    }

    logs.push(`\n📊 Parsing terminé : ${processedRows} ligne(s) traitée(s), ${skippedRows} ligne(s) ignorée(s)`)
    logs.push(`📝 ${quizMap.size} quiz(s) unique(s) détecté(s)`)

    // Créer les quiz avec leurs questions
    const results = []
    let quizIndex = 0
    for (const [quizTitle, questions] of quizMap.entries()) {
      quizIndex++
      if (questions.length === 0) {
        errors.push(`Quiz "${quizTitle}" : aucune question valide`)
        logs.push(`⚠️ Quiz ${quizIndex} "${quizTitle}" ignoré : aucune question valide`)
        continue
      }

      logs.push(`\n🔄 Traitement du quiz ${quizIndex}/${quizMap.size} : "${quizTitle}" (${questions.length} question(s))`)

      // Trouver les métadonnées du quiz depuis la première ligne de ce quiz
      const firstRowIndex = rows.findIndex((row) => {
        const rowData: any = {}
        headers.forEach((header, index) => {
          rowData[header] = row[index]?.replace(/^"|"$/g, "") || ""
        })
        return rowData.quiz_title?.trim() === quizTitle
      })
      const firstRow = rows[firstRowIndex]
      const quizData: any = {}
      headers.forEach((header, index) => {
        quizData[header] = (firstRow[index] || "").replace(/^"|"$/g, "").trim()
      })

      // Vérifier si le quiz existe déjà
      const existingQuiz = await Quiz.findOne({
        where: { title: quizTitle },
        include: [{ model: Question }]
      })

      let quiz
      if (existingQuiz) {
        logs.push(`🔄 Quiz "${quizTitle}" existe déjà, mise à jour...`)
        // Helper to count old questions
        const oldQuestionsCount = existingQuiz.dataValues.Questions ? existingQuiz.dataValues.Questions.length : 0;
        logs.push(`🗑️ Suppression de ${oldQuestionsCount} ancienne(s) question(s)`)

        // Supprimer les anciennes questions
        await Question.destroy({
          where: { quizId: existingQuiz.id },
        })

        // Mettre à jour le quiz
        quiz = await existingQuiz.update({
          title: quizTitle,
          description: quizData.quiz_description?.trim() || null,
          category: quizData.quiz_category?.trim() || null,
          difficulty: quizData.quiz_difficulty?.trim() || null,
        })

        // Créer les nouvelles questions
        // Ensure questions are valid objects for creation
        const newQuestions = questions.map(q => ({
          ...q,
          quizId: quiz.id,
          // Options are handled by setter in Model if defined, or should be stringified?
          // The previous code passes array `options`.
          // If model expects array (JSON), it's fine. If text, model handles stringify via setter.
          // Based on my review of the plan, I should trust the model or just pass it ensuring it matches model expectation.
        }));
        await Question.bulkCreate(newQuestions);

        logs.push(`✅ Quiz "${quizTitle}" mis à jour avec succès (${questions.length} question(s))`)
      } else {
        logs.push(`✨ Création du nouveau quiz "${quizTitle}"...`)
        // Créer un nouveau quiz
        quiz = await Quiz.create({
          title: quizTitle,
          description: quizData.quiz_description?.trim() || null,
          category: quizData.quiz_category?.trim() || null,
          difficulty: quizData.quiz_difficulty?.trim() || null,
        }, {
          // Create with association? Or separately?
          // Since we have the logic separated above, let's allow separate creation for consistency or use nested create.
          // Nested create is cleaner.
          // But we need to map the alias carefully.
        })

        const newQuestions = questions.map(q => ({
          ...q,
          quizId: quiz.id
        }));
        await Question.bulkCreate(newQuestions);

        logs.push(`✅ Quiz "${quizTitle}" créé avec succès (${questions.length} question(s))`)
      }

      results.push({
        quizId: quiz.id,
        title: quiz.title,
        questionsCount: questions.length,
      })
    }

    logs.push(`\n📊 Résumé final : ${results.length} quiz(s) créé(s)/mis à jour, ${errors.length} erreur(s), ${skippedRows} ligne(s) ignorée(s)`)

    if (results.length === 0) {
      logs.push("❌ Aucun quiz n'a pu être créé")
      return NextResponse.json(
        {
          error: "Aucun quiz n'a pu être créé",
          logs,
          errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: `${results.length} quiz(s) créé(s)/mis à jour avec succès`,
      results,
      totalQuizzes: results.length,
      totalQuestions: results.reduce((sum, r) => sum + r.questionsCount, 0),
      logs,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erreur interne du serveur"
    logs.push(`❌ Erreur fatale : ${errorMsg}`)
    console.error("Erreur lors du bulk upload CSV:", error)
    return NextResponse.json(
      { error: errorMsg, logs, errors },
      { status: 500 }
    )
  }
}
