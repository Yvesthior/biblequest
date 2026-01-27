
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const quizzesDir = path.resolve(__dirname, '..', '..', 'quizzes');

function checkIndices() {
    if (!fs.existsSync(quizzesDir)) {
        console.error("Quizzes directory not found:", quizzesDir);
        return;
    }

    const files = fs.readdirSync(quizzesDir).filter(f => f.endsWith('.json'));
    console.log(`Checking ${files.length} files...`);

    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, other: 0 };

    for (const file of files) {
        const content = fs.readFileSync(path.join(quizzesDir, file), 'utf-8');
        try {
            const quiz = JSON.parse(content);
            if (!Array.isArray(quiz)) {
                continue;
            }

            quiz.forEach((q, i) => {
                const idx = q.correct_option_index;
                if (idx >= 1 && idx <= 4) {
                    counts[idx as keyof typeof counts]++;
                } else {
                    counts.other++;
                    console.error(`[${file}] Q${i + 1}: Invalid index ${idx}`);
                }
            });

        } catch (e) {
            console.error(`Error parsing ${file}:`, e);
        }
    }

    console.log("Index distribution:", counts);
    if (counts.other === 0) {
        console.log("No index errors found (bounds check 1-4).");
    } else {
        console.log(`Found ${counts.other} potential errors.`);
    }
}

checkIndices();
