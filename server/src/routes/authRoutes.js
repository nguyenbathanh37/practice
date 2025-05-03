import { login } from '../controllers/authController.js';

export default (api) => {
    api.post('/login', login);
    //   api.post('/register', register);
    //   api.post('/forgot-password', forgotPassword);
    //   api.post('/change-password', changePassword);

    return api;
};