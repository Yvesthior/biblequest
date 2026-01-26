import sequelize from './sequelize';
import * as models from '@/models';

const db = {
    sequelize,
    ...models,
};

export default db;
