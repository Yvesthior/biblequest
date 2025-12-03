// prisma/seed.ts
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Start seeding...")

  // Create or update admin user
  const hashedPassword = await bcrypt.hash("admin123@", 12)
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@yvesthior.com" },
    update: {
      name: "Admin",
      password: hashedPassword,
      role: "ADMIN",
    },
    create: {
      email: "admin@yvesthior.com",
      name: "Admin",
      password: hashedPassword,
      role: "ADMIN",
    },
  })
  console.log(`✅ Admin user created/updated: ${adminUser.email}`)

  // Clear existing data
  await prisma.quizAttempt.deleteMany()
  await prisma.question.deleteMany()
  await prisma.quiz.deleteMany()

  const quiz1 = await prisma.quiz.create({
    data: {
      title: "Les Débuts de la Genèse",
      description: "Un quiz sur les premiers chapitres de la Genèse.",
      category: "Ancien Testament",
      difficulty: "Facile",
      questions: {
        create: [
          {
            questionText: "Combien de jours a duré la création du monde selon le premier récit de la Genèse ?",
            options: ["5 jours", "6 jours", "7 jours", "12 jours"],
            correctOptionIndex: 1,
            explanation: "Dieu créa le monde en 6 jours et se reposa le septième.",
            reference: "Genèse 1:31 - 2:2",
          },
          {
            questionText: "Quel est le nom du premier homme créé par Dieu ?",
            options: ["Abel", "Caïn", "Adam", "Noé"],
            correctOptionIndex: 2,
            explanation: "Adam fut le premier homme, créé à l'image de Dieu.",
            reference: "Genèse 1:27",
          },
          {
            questionText: "Vrai ou Faux : Le serpent dans le jardin d'Éden était un simple animal.",
            options: ["Vrai", "Faux"],
            correctOptionIndex: 1,
            explanation:
              "Le serpent est décrit comme 'le plus rusé de tous les animaux des champs', et symbolise la tentation et le mal.",
            reference: "Genèse 3:1",
          },
          {
            questionText: "Quel fruit Adam et Ève ont-ils mangé dans le jardin d'Éden ?",
            options: [
              "Le fruit de l'arbre de la connaissance du bien et du mal",
              "Une pomme rouge",
              "Une figue",
              "Un raisin",
            ],
            correctOptionIndex: 0,
            explanation:
              "La Bible ne précise pas le type de fruit, mais parle de l'arbre de la connaissance du bien et du mal.",
            reference: "Genèse 2:17",
          },
          {
            questionText: "Qui étaient les deux fils d'Adam et Ève mentionnés en premier ?",
            options: ["Caïn et Abel", "Seth et Caïn", "Abel et Seth", "Noé et Abraham"],
            correctOptionIndex: 0,
            explanation: "Caïn et Abel furent les deux premiers fils d'Adam et Ève.",
            reference: "Genèse 4:1-2",
          },
        ],
      },
    },
  })

  const quiz2 = await prisma.quiz.create({
    data: {
      title: "L'Arche de Noé",
      description: "Testez vos connaissances sur l'histoire de Noé et du déluge.",
      category: "Ancien Testament",
      difficulty: "Moyen",
      questions: {
        create: [
          {
            questionText: "Combien de temps a duré le déluge selon la Bible ?",
            options: ["40 jours et 40 nuits", "7 jours", "100 jours", "1 an"],
            correctOptionIndex: 0,
            explanation: "Il plut pendant 40 jours et 40 nuits.",
            reference: "Genèse 7:12",
          },
          {
            questionText: "Combien d'animaux de chaque espèce Noé a-t-il pris dans l'arche ?",
            options: ["Un couple (mâle et femelle)", "Trois couples", "Sept couples", "Dix couples"],
            correctOptionIndex: 0,
            explanation: "Noé prit un couple de chaque espèce d'animaux impurs, et sept couples d'animaux purs.",
            reference: "Genèse 7:2-3",
          },
          {
            questionText: "Quel oiseau Noé a-t-il envoyé pour vérifier si les eaux s'étaient retirées ?",
            options: ["Un aigle", "Une colombe", "Un corbeau", "Un faucon"],
            correctOptionIndex: 1,
            explanation: "Noé envoya d'abord un corbeau, puis une colombe.",
            reference: "Genèse 8:8",
          },
        ],
      },
    },
  })

  const quiz3 = await prisma.quiz.create({
    data: {
      title: "Les Paraboles de Jésus",
      description: "Testez vos connaissances sur les paraboles les plus célèbres de Jésus.",
      category: "Nouveau Testament",
      difficulty: "Moyen",
      questions: {
        create: [
          {
            questionText: "Dans la parabole du bon samaritain, qui a aidé l'homme blessé ?",
            options: ["Un prêtre", "Un lévite", "Un samaritain", "Un pharisien"],
            correctOptionIndex: 2,
            explanation: "Le bon samaritain a aidé l'homme blessé, montrant l'amour du prochain.",
            reference: "Luc 10:25-37",
          },
          {
            questionText: "Que représente la graine de moutarde dans la parabole de Jésus ?",
            options: ["La foi", "Le royaume de Dieu", "L'amour", "L'espérance"],
            correctOptionIndex: 1,
            explanation: "Jésus compare le royaume de Dieu à une graine de moutarde qui devient un grand arbre.",
            reference: "Matthieu 13:31-32",
          },
        ],
      },
    },
  })

  const quiz4 = await prisma.quiz.create({
    data: {
      title: "Les Apôtres",
      description: "Connaissez-vous les douze apôtres de Jésus ?",
      category: "Nouveau Testament",
      difficulty: "Difficile",
      questions: {
        create: [
          {
            questionText: "Quel apôtre était pêcheur avant de suivre Jésus ?",
            options: ["Matthieu", "Pierre", "Judas", "Thomas"],
            correctOptionIndex: 1,
            explanation: "Pierre était pêcheur sur le lac de Galilée avant que Jésus l'appelle.",
            reference: "Matthieu 4:18-20",
          },
          {
            questionText: "Quel apôtre était collecteur d'impôts ?",
            options: ["Pierre", "Jean", "Matthieu", "André"],
            correctOptionIndex: 2,
            explanation: "Matthieu était collecteur d'impôts avant de suivre Jésus.",
            reference: "Matthieu 9:9",
          },
        ],
      },
    },
  })

  console.log(`Seeding finished. Created quizzes with ids: ${quiz1.id}, ${quiz2.id}, ${quiz3.id}, ${quiz4.id}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
