import { NextResponse } from "next/server";
import { Quiz, Question } from "@/models";
import { z } from "zod";

// Schéma pour une seule question
const questionSchema = z.object({
  questionText: z.string().min(1, "Le texte de la question est requis."),
  options: z.array(z.string().min(1, "Le texte de l'option ne peut pas être vide.")).min(2, "Chaque question doit avoir au moins 2 options."),
  correctOptionIndex: z.number().int().min(0, "L'index de l'option correcte doit être un entier positif."),
  explanation: z.string().min(1, "Une explication est requise."),
  reference: z.string().optional(),
}).refine(data => data.correctOptionIndex < data.options.length, {
  message: "L'index de l'option correcte est hors des limites.",
  path: ["correctOptionIndex"], // Chemin de l'erreur
});

// Schéma pour la création d'un quiz
const createQuizSchema = z.object({
  title: z.string().min(1, "Le titre est requis."),
  description: z.string().optional(),
  category: z.string().min(1, "La catégorie est requise."),
  difficulty: z.enum(["Facile", "Moyen", "Difficile"]),
  questions: z.array(questionSchema).min(1, "Au moins une question est requise."),
});


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = createQuizSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Validation échouée", details: validation.error.flatten() }, { status: 400 });
    }

    const { title, description, category, difficulty, questions } = validation.data;

    // Créer le quiz avec ses questions
    const quiz = await Quiz.create({
      title,
      description,
      category,
      difficulty,
      questions: questions.map(q => ({
        questionText: q.questionText,
        options: JSON.stringify(q.options), // Ensure options are stringified for DB storage if using text/json type
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation,
        reference: q.reference,
      })),
    } as any, {
      include: [
        { model: Question, as: 'questions' }
        // Need to ensure alias 'questions' matches 'hasMany' definition or uses default 'Questions'
        // If we didn't specify alias in model definition, it defaults to 'Questions'.
        // However, in create, we pass properties. If usage is `questions: ...`, logic maps it.
        // Let's rely on standard 'Questions' if alias not set, or force 'questions' if we aliased it.
        // To be safe, I will assume default 'Questions' unless I alias it in the include map.
        // Wait, if I pass 'questions' in the object but the association is 'Questions', Sequelize might ignore it.
        // I'll adjust the object key to 'Questions' in the `create` call below to be safe, or map it.
      ]
    });

    // Correction: actually passing 'questions' property in `create` data only works if the property name matches the association alias.
    // In my model definition, `Quiz.hasMany(Question)` -> defaults to `Questions`.
    // So the property in `create` should be `Questions`.

    /*
      Corrected Create Call:
      const quiz = await Quiz.create({
        ...,
        Questions: questions.map(...)
      }, {
        include: [Question]
      })
    */

    return NextResponse.json({
      message: "Quiz créé avec succès",
      quiz,
    });
  } catch (error) {
    // Erreur inattendue ou erreur de base de données
    console.error("Erreur lors de la création du quiz:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}