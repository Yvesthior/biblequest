import { DataTypes, Model } from 'sequelize';
import sequelize from '@/lib/sequelize';

export class User extends Model {
    public id!: string;
    public name!: string | null;
    public email!: string;
    public password!: string;
    public emailVerified!: Date | null;
    public image!: string | null;
    public role!: string;
    public username!: string | null;
    public createdAt!: Date;
    public updatedAt!: Date;
}

User.init({
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    emailVerified: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    role: {
        type: DataTypes.STRING,
        defaultValue: 'USER',
    },
    username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true,
    },
}, {
    sequelize,
    modelName: 'User',
    tableName: 'user', // Match existing table name
});

export default User;
