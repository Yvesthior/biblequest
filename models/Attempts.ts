import { DataTypes, Model } from 'sequelize';
import sequelize from '@/lib/sequelize';
import User from './User';
import Quiz from './Quiz';
import Question from './Question';

// --- QuizAttempt ---
export class QuizAttempt extends Model {
    public id!: number;
    public userId!: string;
    public quizId!: number;
    public score!: number;
    public totalQuestions!: number;
    public answers!: string; // JSON string
    public completedAt!: Date;
}

QuizAttempt.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: { model: User, key: 'id' }
    },
    quizId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Quiz, key: 'id' }
    },
    score: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    totalQuestions: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    answers: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    completedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    sequelize,
    modelName: 'QuizAttempt',
    tableName: 'quizattempt',
    timestamps: false,
});

QuizAttempt.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
QuizAttempt.belongsTo(Quiz, { foreignKey: 'quizId', onDelete: 'CASCADE' });
User.hasMany(QuizAttempt, { foreignKey: 'userId', as: 'quizAttempts' });
Quiz.hasMany(QuizAttempt, { foreignKey: 'quizId', as: 'quizAttempts' });


// --- AttemptAnswer ---
export class AttemptAnswer extends Model { }

AttemptAnswer.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    attemptId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: QuizAttempt, key: 'id' }
    },
    questionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Question, key: 'id' }
    },
    selectedOption: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    isCorrect: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    sequelize,
    modelName: 'AttemptAnswer',
    tableName: 'attemptanswer',
    timestamps: false,
});

AttemptAnswer.belongsTo(QuizAttempt, { foreignKey: 'attemptId', onDelete: 'CASCADE' });
AttemptAnswer.belongsTo(Question, { foreignKey: 'questionId', onDelete: 'CASCADE' });
QuizAttempt.hasMany(AttemptAnswer, { foreignKey: 'attemptId' });
Question.hasMany(AttemptAnswer, { foreignKey: 'questionId' }); // Optional: generally we query answers by attempt
