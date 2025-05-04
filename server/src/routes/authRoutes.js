import { login } from '../controllers/authController.js';

export default (api) => {
    api.post('/login', login);

    return api;
};