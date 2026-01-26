import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-user"
import { Quiz, Question } from "@/models"

interface QuestionData {
  quiz_title: string
  quiz_description?: string
  quiz_category?: string
  quiz_difficulty?: string
  question_text: string
  option_1: string
  option_2: string
  option_3?: string
  option_4?: string
  correct_option_index: number
  explanation?: string
  reference?: string
}

export async function POST(request: Request) {
  const logs: string[] = []
  const errors: string[] = []
  const results: Array<{ quizId: number; title: string; questionsCount: number }> = []

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
    logs.push("📥 Début du traitement JSON...")

    const body = await request.json()

    // Valider que c'est un tableau
    if (!Array.isArray(body)) {
      errors.push("Le JSON doit être un tableau de quiz")
      logs.push("❌ Format invalide : le JSON doit être un tableau")
      return NextResponse.json(
        { error: "Le JSON doit être un tableau de quiz", logs, errors },
        { status: 400 }
      )
    }

    logs.push(`📋 ${body.length} question(s) trouvée(s) dans le fichier JSON`)

    // Grouper les questions par quiz
    const quizMap = new Map<string, QuestionData[]>()
    let processedQuestions = 0
    let skippedQuestions = 0

    logs.push(`🔄 Groupement des questions par quiz...`)

    // Traiter chaque question et les grouper par quiz_title
    for (let i = 0; i < body.length; i++) {
      const questionData: QuestionData = body[i]
      const questionIndex = i + 1

      try {
        // Validation
        if (!questionData.quiz_title?.trim()) {
          errors.push(`Question ${questionIndex} : le titre du quiz est requis`)
          logs.push(`❌ Question ${questionIndex} : titre de quiz manquant`)
          skippedQuestions++
          continue
        }

        const quizTitle = questionData.quiz_title.trim()

        if (!quizMap.has(quizTitle)) {
          quizMap.set(quizTitle, [])
          logs.push(`📝 Nouveau quiz détecté : "${quizTitle}"`)
        }

        // Validation de la question
        if (!questionData.question_text?.trim()) {
          errors.push(`Question ${questionIndex} (quiz: "${quizTitle}") : le texte de la question est requis`)
          logs.push(`❌ Question ${questionIndex} : texte manquant`)
          skippedQuestions++
          continue
        }

        // Construire le tableau d'options
        const options: string[] = []
        if (questionData.option_1?.trim()) options.push(questionData.option_1.trim())
        if (questionData.option_2?.trim()) options.push(questionData.option_2.trim())
        if (questionData.option_3?.trim()) options.push(questionData.option_3.trim())
        if (questionData.option_4?.trim()) options.push(questionData.option_4.trim())

        if (options.length < 2) {
          errors.push(`Question ${questionIndex} (quiz: "${quizTitle}") : au moins 2 options sont requises (trouvé: ${options.length})`)
          logs.push(`❌ Question ${questionIndex} : pas assez d'options (${options.length})`)
          skippedQuestions++
          continue
        }

        // Valider l'index de la bonne réponse
        const correctIndex = questionData.correct_option_index
        if (
          typeof correctIndex !== "number" ||
          correctIndex < 1 ||
          correctIndex > options.length
        ) {
          errors.push(
            `Question ${questionIndex} (quiz: "${quizTitle}") : index de réponse correcte invalide (doit être entre 1 et ${options.length}, trouvé: ${correctIndex})`
          )
          logs.push(`❌ Question ${questionIndex} : index invalide (${correctIndex})`)
          skippedQuestions++
          continue
        }

        // Ajouter la question au quiz
        quizMap.get(quizTitle)!.push(questionData)
        processedQuestions++
        logs.push(`✅ Question ${questionIndex} ajoutée au quiz "${quizTitle}" (${options.length} option(s))`)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Erreur inconnue"
        errors.push(`Question ${questionIndex} : ${errorMsg}`)
        logs.push(`❌ Erreur lors du traitement de la question ${questionIndex} : ${errorMsg}`)
        console.error(`Error processing question ${questionIndex}:`, error)
        skippedQuestions++
      }
    }

    logs.push(`\n📊 Parsing terminé : ${processedQuestions} question(s) traitée(s), ${skippedQuestions} question(s) ignorée(s)`)
    logs.push(`📝 ${quizMap.size} quiz(s) unique(s) détecté(s)`)

    // Créer les quiz avec leurs questions
    let quizIndex = 0
    for (const [quizTitle, questions] of quizMap.entries()) {
      quizIndex++

      if (questions.length === 0) {
        errors.push(`Quiz "${quizTitle}" : aucune question valide`)
        logs.push(`⚠️ Quiz ${quizIndex} "${quizTitle}" ignoré : aucune question valide`)
        continue
      }

      logs.push(`\n🔄 Traitement du quiz ${quizIndex}/${quizMap.size} : "${quizTitle}" (${questions.length} question(s))`)

      try {
        // Récupérer les métadonnées du quiz depuis la première question
        const firstQuestion = questions[0]
        const quizDescription = firstQuestion.quiz_description?.trim() || null
        const quizCategory = firstQuestion.quiz_category?.trim() || null
        const quizDifficulty = firstQuestion.quiz_difficulty?.trim() || null

        // Transformer les questions au format attendu par Prisma
        const validQuestions = questions.map((q) => {
          const options: string[] = []
          if (q.option_1?.trim()) options.push(q.option_1.trim())
          if (q.option_2?.trim()) options.push(q.option_2.trim())
          if (q.option_3?.trim()) options.push(q.option_3.trim())
          if (q.option_4?.trim()) options.push(q.option_4.trim())

          return {
            questionText: q.question_text.trim(),
            options: JSON.stringify(options), // Stringified for Sequelize
            correctOptionIndex: q.correct_option_index - 1, // Convertir de 1-based à 0-based
            explanation: q.explanation?.trim() || null,
            reference: q.reference?.trim() || null,
          }
        })

        // Vérifier si le quiz existe déjà
        const existingQuiz = await Quiz.findOne({
          where: { title: quizTitle },
          include: [{ model: Question }]
        })

        let quiz
        if (existingQuiz) {
          logs.push(`🔄 Quiz "${quizTitle}" existe déjà, mise à jour...`)
          const oldQuestionsCount = existingQuiz.dataValues.Questions ? existingQuiz.dataValues.Questions.length : 0;
          logs.push(`🗑️ Suppression de ${oldQuestionsCount} ancienne(s) question(s)`)

          // Supprimer les anciennes questions
          await Question.destroy({
            where: { quizId: existingQuiz.id },
          })

          // Mettre à jour le quiz
          quiz = await existingQuiz.update({
            title: quizTitle,
            description: quizDescription,
            category: quizCategory,
            difficulty: quizDifficulty,
          })

          const newQuestions = validQuestions.map(q => ({ ...q, quizId: quiz.id }));
          await Question.bulkCreate(newQuestions);

          logs.push(`✅ Quiz "${quizTitle}" mis à jour avec succès (${validQuestions.length} question(s))`)
        } else {
          logs.push(`✨ Création du nouveau quiz "${quizTitle}"...`)
          // Créer un nouveau quiz
          quiz = await Quiz.create({
            title: quizTitle,
            description: quizDescription,
            category: quizCategory,
            difficulty: quizDifficulty,
          })

          const newQuestions = validQuestions.map(q => ({ ...q, quizId: quiz.id }));
          await Question.bulkCreate(newQuestions);

          logs.push(`✅ Quiz "${quizTitle}" créé avec succès (${validQuestions.length} question(s))`)
        }

        results.push({
          quizId: quiz.id,
          title: quiz.title,
          questionsCount: validQuestions.length,
        })

        logs.push(`✅ Quiz ${quizIndex} traité avec succès : ${validQuestions.length} question(s)`)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Erreur inconnue"
        errors.push(`Quiz "${quizTitle}" : ${errorMsg}`)
        logs.push(`❌ Erreur lors du traitement du quiz "${quizTitle}" : ${errorMsg}`)
        console.error(`Error processing quiz "${quizTitle}":`, error)
      }
    }

    logs.push(`\n📊 Résumé final : ${results.length} quiz(s) créé(s)/mis à jour, ${errors.length} erreur(s), ${skippedQuestions} question(s) ignorée(s)`)

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
      message: `${results.length} quiz(s) traité(s) avec succès`,
      results,
      totalQuizzes: results.length,
      totalQuestions: results.reduce((sum, r) => sum + r.questionsCount, 0),
      logs,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erreur interne du serveur"
    logs.push(`❌ Erreur fatale : ${errorMsg}`)
    console.error("Erreur lors du bulk upload JSON:", error)
    return NextResponse.json(
      { error: errorMsg, logs, errors },
      { status: 500 }
    )
  }
}
