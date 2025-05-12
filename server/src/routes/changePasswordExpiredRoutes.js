import { changePassword } from "../controllers/userController.js";

export default (api) => {
    api.post('/ChangePasswordExpired', changePassword);

    return api;
};