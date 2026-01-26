import { DataTypes, Model } from 'sequelize';
import sequelize from '@/lib/sequelize';

export class VerificationToken extends Model { }

VerificationToken.init({
    identifier: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    token: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    expires: {
        type: DataTypes.DATE,
        allowNull: false,
    },
}, {
    sequelize,
    modelName: 'VerificationToken',
    tableName: 'verificationtoken',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['identifier', 'token']
        }
    ]
});

export default VerificationToken;
