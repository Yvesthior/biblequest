import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
    const quiz = await prisma.quiz.create({
      data: {
        title,
        description,
        category,
        difficulty,
        questions: {
          create: questions.map(q => ({
            questionText: q.questionText,
            options: q.options,
            correctOptionIndex: q.correctOptionIndex,
            explanation: q.explanation,
            reference: q.reference,
          })),
        },
      },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

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