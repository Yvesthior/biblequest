import { DataTypes, Model } from 'sequelize';
import sequelize from '@/lib/sequelize';
import User from './User';

export class Account extends Model { }

Account.init({
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    provider: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    providerAccountId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    refresh_token: DataTypes.STRING,
    access_token: DataTypes.STRING,
    expires_at: DataTypes.INTEGER,
    token_type: DataTypes.STRING,
    scope: DataTypes.STRING,
    id_token: DataTypes.STRING,
    session_state: DataTypes.STRING,
}, {
    sequelize,
    modelName: 'Account',
    tableName: 'account',
    timestamps: false, // Assuming Account doesn't have timestamps in Prisma schema
});

// Association defined in a central init file or here if keeping it simple
Account.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(Account, { foreignKey: 'userId' });

export default Account;
