import { login, refreshToken } from '../controllers/authController.js';

export default (api) => {
    api.post('/login', login);
    api.post('/refreshToken', refreshToken);

    return api;
};