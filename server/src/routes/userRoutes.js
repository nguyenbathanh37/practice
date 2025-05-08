import { updateProfile, uploadAvatar, changePassword, getMe, getAvatar } from "../controllers/userController.js";
import { listUsers, createUser, updateUser, deleteUser } from "../controllers/userManagementController.js";
import { forgotPassword } from "../controllers/authController.js";

export default (api) => {
    api.post('/updateProfile', updateProfile);
    api.post('/uploadAvatar', uploadAvatar);
    api.post('/changePassword', changePassword);
    api.get('/listUsers', listUsers);
    api.post('/createUser', createUser);
    api.put('/updateUser/:id', updateUser);
    api.delete('/deleteUser/:id', deleteUser);
    api.get('/getMe', getMe);
    api.get('/getAvatar/:userId', getAvatar);
    api.post('/forgotPassword', forgotPassword);

    return api;
};