import { login, refreshToken, resetPassword } from '../controllers/authController.js';

export default (api) => {
    api.post('/login', login);
    api.post('/refreshToken', refreshToken);
    api.post('/resetPassword', resetPassword);

    return api;
};