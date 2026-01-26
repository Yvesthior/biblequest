import { DataTypes, Model } from 'sequelize';
import sequelize from '@/lib/sequelize';

export class Quiz extends Model {
    public id!: number;
    public title!: string;
    public description!: string | null;
    public category!: string | null;
    public difficulty!: string | null;
    public createdAt!: Date;
    public updatedAt!: Date;
}

Quiz.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    category: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    difficulty: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    sequelize,
    modelName: 'Quiz',
    tableName: 'quiz',
});

// Associations will be defined in models/index.ts or imported
export default Quiz;
