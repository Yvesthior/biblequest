import { DataTypes, Model } from 'sequelize';
import sequelize from '@/lib/sequelize';
import User from './User';

export class Session extends Model { }

Session.init({
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    sessionToken: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    expires: {
        type: DataTypes.DATE,
        allowNull: false,
    },
}, {
    sequelize,
    modelName: 'Session',
    tableName: 'session',
    timestamps: false,
});

Session.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(Session, { foreignKey: 'userId' });

export default Session;
