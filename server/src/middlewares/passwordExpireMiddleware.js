import User from "../models/user.js";

export const checkPasswordExpiry = async (req, res, next) => {
    const user = await User.findByPk(req.user.id);

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMinutes(threeMonthsAgo.getMinutes() - 20);

    if (user.lastPasswordChange < threeMonthsAgo) {
        return res.status(403).json({
            code: 'PASSWORD_EXPIRED',
            message: 'Password needs to be changed every 3 months',
            lastPasswordChange: user.lastPasswordChange
        });
    }

    next();
};