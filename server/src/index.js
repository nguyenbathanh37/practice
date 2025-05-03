import lambdaApi from 'lambda-api';

import authRoutes from './routes/authRoutes.js';
import healthRoutes from './routes/healthRoutes.js';

const api = lambdaApi();

api.register(authRoutes, { prefix: '/auth' });
api.register(healthRoutes, { prefix: '/auth' });

export const handler = async (event, context) => {
  return await api.run(event, context);
};