import { DataTypes, Model } from 'sequelize';
import sequelize from '@/lib/sequelize';
import User from './User';
import Quiz from './Quiz';

// --- Feedback ---
export class Feedback extends Model { }

Feedback.init({
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'OPEN',
    },
    quizId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Quiz, key: 'id' }
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: { model: User, key: 'id' }
    },
    reportedQuestionIdsJson: {
        type: DataTypes.TEXT('long'),
        allowNull: false,
    },
}, {
    sequelize,
    modelName: 'Feedback',
    tableName: 'feedback',
    timestamps: false,
});

Feedback.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
Feedback.belongsTo(Quiz, { foreignKey: 'quizId', onDelete: 'CASCADE' });
User.hasMany(Feedback, { foreignKey: 'userId' });
Quiz.hasMany(Feedback, { foreignKey: 'quizId' });


// --- ErrorLog ---
export class ErrorLog extends Model { }

ErrorLog.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    stack: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    route: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    sequelize,
    modelName: 'ErrorLog',
    tableName: 'errorlog',
    timestamps: false,
});
