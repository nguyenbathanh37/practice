const api = require('lambda-api');

const authRoutes = require('./routes/authRoutes');
// const userRoutes = require('./routes/userRoutes');
const healthRoutes = require('./routes/healthRoutes');

// // Middleware xử lý JSON
// api.use(async (req, res, next) => {
//   try {
//     if (req.body && typeof req.body === 'string') {
//       req.body = JSON.parse(req.body);
//     }
//   } catch (err) {
//     res.status(400).json({ message: 'Invalid JSON body' });
//   }
//   next();
// });

// // Mount routes
// authRoutes(api);
// // userRoutes(api);
// healthRoutes(api);

api.register(authRoutes, { prefix: '/auth' });
api.register(healthRoutes, { prefix: '/auth' });

exports.handler = async (event, context) => {
  return await api.run(event, context);
};
