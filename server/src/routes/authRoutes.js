const authController = require('../controllers/authController');

module.exports = (api) => {
    api.post('/login', authController.login);
    //   api.post('/register', authController.register);
    //   api.post('/forgot-password', authController.forgotPassword);
    //   api.post('/change-password', authController.changePassword);

    return api;
};
