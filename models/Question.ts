import { DataTypes, Model } from 'sequelize';
import sequelize from '@/lib/sequelize';
import Quiz from './Quiz';

export class Question extends Model {
    public id!: number;
    public quizId!: number;
    public questionText!: string;
    public options!: string[]; // Stored as JSON
    public correctOptionIndex!: number;
    public explanation!: string | null;
    public reference!: string | null;
}

Question.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    quizId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Quiz,
            key: 'id'
        }
    },
    questionText: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    options: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    correctOptionIndex: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    explanation: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    reference: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    sequelize,
    modelName: 'Question',
    tableName: 'question',
    timestamps: false,
});

Question.belongsTo(Quiz, { foreignKey: 'quizId', onDelete: 'CASCADE' });
Quiz.hasMany(Question, { foreignKey: 'quizId' });

export default Question;
