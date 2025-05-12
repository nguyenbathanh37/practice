import lambdaApi from 'lambda-api';

import { authenticate } from './middlewares/authMiddleware.js';
import { checkPasswordExpiry } from './middlewares/passwordExpireMiddleware.js';
import { corsMiddleware } from './middlewares/corsMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import userRoutes from './routes/userRoutes.js';
import exportRoutes from './routes/exportRoutes.js';
import changePasswordExpiredRoutes from './routes/changePasswordExpiredRoutes.js';

const api = lambdaApi();

api.use(corsMiddleware);

api.register(authRoutes, { prefix: '/auth' });
api.register(healthRoutes, { prefix: '/auth' });

api.use(authenticate);
api.register(changePasswordExpiredRoutes, { prefix: '/auth' });
api.use(checkPasswordExpiry);
api.register(userRoutes, { prefix: '/auth' });
api.register(exportRoutes, { prefix: '/auth' });

export const handler = async (event, context) => {
  return await api.run(event, context);
};