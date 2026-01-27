
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file FIRST
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from project root
const result = dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

if (result.error) {
    console.warn("Warning: .env file not found or failed to load:", result.error);
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error("Error: DATABASE_URL environment variable is not defined.");
    process.exit(1);
}

async function exportQuizzes() {
    try {
        console.log('Connecting to database...', dbUrl!.substring(0, 15) + '...');

        // Dynamic import to ensure process.env.DATABASE_URL is set before sequelize is instantiated
        const { default: db } = await import('../lib/db');
        const { Quiz } = await import('../models/Quiz');
        const { Question } = await import('../models/Question');

        await db.sequelize.authenticate();
        console.log('Database connection established successfully.');

        // target root directory: bible-master/quizzes
        const outputDir = path.resolve(__dirname, '..', '..', 'quizzes');
        console.log(`Target output directory: ${outputDir}`);

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Fetch all quizzes with their questions
        const quizzes = await Quiz.findAll({
            include: [{
                model: Question,
                as: 'Questions'
            }]
        });

        console.log(`Found ${quizzes.length} quizzes.`);

        for (const quizInstance of quizzes) {
            // Use get({ plain: true }) to resolve potential property shadowing or virtual fields
            const quiz = quizInstance.get({ plain: true });

            const quizData: any[] = [];
            // Access questions from the plain object
            // The alias 'Questions' should be preserved in the plain object
            const questions = quiz.Questions || (quiz as any).questions || [];

            if (!quiz.title) {
                console.warn(`Warning: Quiz ID ${quiz.id} has no title. Skipping or using default.`);
            }

            for (const question of questions) {
                // Parse options if stored as string, otherwise use as is
                let options = question.options;
                if (typeof options === 'string') {
                    try {
                        options = JSON.parse(options);
                    } catch (e) {
                        console.error(`Error parsing options for question ${question.id}:`, e);
                        options = [];
                    }
                }

                // Ensure options is an array (handle null/undefined)
                if (!Array.isArray(options)) {
                    options = [];
                }

                // Construct the JSON object for this question
                const quizJsonItem = {
                    quiz_title: quiz.title || `Quiz ${quiz.id}`,
                    quiz_description: quiz.description || "Un quiz biblique.",
                    quiz_category: quiz.category || "Général",
                    quiz_difficulty: quiz.difficulty || "Moyen",
                    question_text: question.questionText,
                    option_1: options[0] || "",
                    option_2: options[1] || "",
                    option_3: options[2] || "",
                    option_4: options[3] || "",
                    // Database is 0-indexed, but JSON format expects 1-indexed (Option 1 = 1)
                    correct_option_index: question.correctOptionIndex + 1,
                    explanation: question.explanation || "Pas d'explication disponible.",
                    reference: question.reference || ""
                };

                quizData.push(quizJsonItem);
            }

            // Create a filename based on the title
            const title = quiz.title || `quiz_${quiz.id}`;
            const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const fileName = `${sanitizedTitle}_${quiz.id}.json`;
            const filePath = path.join(outputDir, fileName);

            // Write to file only if we have data or at least a file to create
            fs.writeFileSync(filePath, JSON.stringify(quizData, null, 2));
            console.log(`Exported ${fileName}`);
        }

        console.log('Export completed successfully.');

    } catch (error) {
        console.error('Error exporting quizzes:', error);
    }
    process.exit(0);
}

exportQuizzes();
