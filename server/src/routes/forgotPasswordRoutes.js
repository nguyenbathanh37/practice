import { forgotPassword } from "../controllers/authController.js";

export default (api) => {
    api.post('/forgot-password', forgotPassword);

    return api;
};