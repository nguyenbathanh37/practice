import User from "../models/user.js";
import { Op } from "sequelize";
import bcrypt from "bcryptjs";
import { sendResetPassword } from "../services/sesService.js";
import * as yup from 'yup';

const createUserSchema = yup.object().shape({
    loginId: yup.string().email().required(),
    userName: yup.string().required(),
    isRealEmail: yup.boolean().optional(),
    contactEmail: yup.string().email().nullable().optional(),
});

const updateUserSchema = yup.object().shape({
    name: yup.string().strict().optional(),
    contactEmail: yup.string().strict().email().nullable().optional(),
    isRealEmail: yup.boolean().strict().optional(),
});

const listUsersSchema = yup.object().shape({
    page: yup.number().integer().min(1).optional(),
    limit: yup.number().integer().min(1).optional(),
    search: yup.string().optional(),
    sort: yup.string().matches(/^[a-zA-Z]+_(asc|desc)$/i, 'Sort must be in the format field_asc or field_desc').optional(),
});

export const listUsers = async (req, res) => {
    try {
        await listUsersSchema.validate(req.query);

        const { page = 1, limit = 10, search, sort } = req.query;

        const offset = (page - 1) * limit;

        const where = {};
        if (search) {
            where[Op.or] = [
                { userName: { [Op.like]: `%${search}%` } },
                { loginId: { [Op.like]: `%${search}%` } }
            ];
        }

        const order = [];
        if (sort) {
            const [field, direction] = sort.split('_');
            order.push([field, direction.toUpperCase()]);
        } else {
            order.push(['updatedAt', 'DESC']);
        }

        const { count, rows: users } = await User.findAndCountAll({
            where,
            order,
            limit: parseInt(limit),
            offset,
            attributes: { exclude: ['password'] }
        });

        return res.json({
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
            users
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: error.message });
    }
};

export const createUser = async (req, res) => {
    try {
        await createUserSchema.validate(req.body);
        const { employeeId, loginId, userName, isRealEmail, contactEmail } = req.body;

        if (loginId === contactEmail) {
            return res.status(400).json({ error: 'Login ID and Contact Email must not be the same.' });
        }

        const existingUser = await User.findOne({
            where: {
                [Op.or]: [
                    { employeeId },
                    { loginId }
                ]
            }
        });

        if (existingUser) {
            const duplicatedField = existingUser.employeeId === employeeId
                ? 'Employee ID'
                : 'Login ID';
            return res.status(409).json({ error: `${duplicatedField} already exists.` });
        }

        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const user = await User.create({
            employeeId,
            loginId,
            userName,
            isRealEmail,
            contactEmail,
            password: hashedPassword,
            lastPasswordChange: new Date()
        });

        // await sendNewPassword(email, tempPassword);

        const { password, ...userWithoutPassword } = user.toJSON();
        return res.status(201).json(userWithoutPassword);
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        return res.status(400).json({ error: error.message });
    }
};

export const updateUser = async (req, res) => {
    try {
        await updateUserSchema.validate(req.body);
        const { id } = req.params;
        const { userName, contactEmail } = req.body;

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.isRealEmail && contactEmail !== null) {
            return res.status(403).json({ error: 'Cannot update contactEmail when isRealEmail is true.' });
        }

        if (user.loginId === contactEmail) {
            return res.status(400).json({ error: 'Login ID and Contact Email must not be the same.' });
        }

        await user.update({ userName, contactEmail });

        const { password, ...userWithoutPassword } = user.toJSON();
        return res.status(200).json(userWithoutPassword);
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        return res.status(400).json({ error: error.message });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);

        if (!user) return res.status(404).json({ error: 'User not found' });

        // user.isDelete = true;
        // await user.save();
        user.destroy();

        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};