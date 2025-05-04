import { updateProfile, uploadAvatar, changePassword } from "../controllers/userController.js";

export default (api) => {
    api.post('/updateProfile', updateProfile);
    api.post('/uploadAvatar', uploadAvatar);
    api.post('/changePassword', changePassword);

    return api;
};