import { config } from 'dotenv';
config(); // Load environment variables from .env

async function syncDatabase() {
    try {
        // Dynamic imports to ensure environment variables are loaded FIRST
        const { default: sequelize } = await import('../lib/sequelize');
        await import('../models'); // Import all models to ensure they are initialized

        console.log('🔄 Checking database connection...');
        await sequelize.authenticate();
        console.log('✅ Database connection established.');

        console.log('🔄 Synchronizing models with database (alter: true)...');
        await sequelize.sync({ alter: true });

        console.log('✅ Database synchronized successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error synchronizing database:', error);
        process.exit(1);
    }
}

syncDatabase();
