import { Sequelize } from 'sequelize';
import mysql2 from 'mysql2';

const sequelize = new Sequelize(process.env.DATABASE_URL as string, {
    dialect: 'mysql',
    dialectModule: mysql2,
    logging: false, // Set to true to see SQL queries in console
    dialectOptions: {
        // ssl: {
        //   require: true,
        //   rejectUnauthorized: false
        // }
    },
    define: {
        timestamps: true, // Adds createdAt and updatedAt by default
    }
});

export default sequelize;
