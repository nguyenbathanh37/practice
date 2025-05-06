import lambdaApi from 'lambda-api';

import { authenticate } from './middlewares/authMiddleware.js';
import { checkPasswordExpiry } from './middlewares/passwordExpireMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import userRoutes from './routes/userRoutes.js';
import exportRoutes from './routes/exportRoutes.js';

const api = lambdaApi();

// Thêm middleware CORS thủ công
api.use(async (req, res, next) => {
  res.cors({
    origin: '*', // hoặc 'http://localhost:3000'
    credentials: false,
    headers: 'Content-Type, Authorization',
    methods: 'GET, POST, PUT, DELETE, OPTIONS'
  });

  // Nếu là preflight request (OPTIONS), trả luôn
  if (req.method === 'OPTIONS') {
    res.status(200);
    return res.send();
  }

  // Tiếp tục các middleware/route tiếp theo
  return next();
});

api.register(authRoutes, { prefix: '/auth' });
api.register(healthRoutes, { prefix: '/auth' });

api.use(authenticate);
api.use(checkPasswordExpiry);
api.register(userRoutes, { prefix: '/auth' });
api.register(exportRoutes, { prefix: '/auth' });

export const handler = async (event, context) => {
  return await api.run(event, context);
};