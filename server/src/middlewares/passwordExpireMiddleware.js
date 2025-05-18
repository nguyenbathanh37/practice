import Admin from "../models/admin.js";

export const checkPasswordExpiry = async (req, res, next) => {
    const admin = await Admin.findByPk(req.admin.id);

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    if (admin.lastPasswordChange < threeMonthsAgo) {
        return res.status(403).json({
            code: 'PASSWORD_EXPIRED',
            message: 'Password needs to be changed every 3 months',
            lastPasswordChange: admin.lastPasswordChange
        });
    }

    next();
};