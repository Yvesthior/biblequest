import sequelize from '../lib/sequelize';

async function testConnection() {
    try {
        console.log('Testing connection to:', process.env.DATABASE_URL?.replace(/:[^:]*@/, ':****@')); // Mask password
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
}

testConnection();
