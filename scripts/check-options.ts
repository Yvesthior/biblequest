
import { quizRepository } from "../shared/repositories/QuizRepository";
import sequelize from "../lib/sequelize";
import fs from "fs";

async function main() {
    try {
        const quizzes = await quizRepository.findAll({ page: 1, limit: 1 });
        if (quizzes.quizzes.length === 0) {
            console.log("No quizzes found");
            return;
        }
        const quizId = quizzes.quizzes[0].id;
        console.log(`Checking quiz ${quizId}`);

        const quiz = await quizRepository.findByIdWithQuestions(quizId);
        if (!quiz) {
            console.log("Quiz not found");
            return;
        }

        if (quiz.questions && quiz.questions.length > 0) {
            const q = quiz.questions[0];
            const output = `
Question options type: ${typeof q.options}
Question options value: ${JSON.stringify(q.options, null, 2)}
Is array?: ${Array.isArray(q.options)}
        `;
            fs.writeFileSync("output.txt", output);
            console.log("Output written to output.txt");
        } else {
            console.log("No questions in quiz");
            fs.writeFileSync("output.txt", "No questions in quiz");
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await sequelize.close();
    }
}

main();
