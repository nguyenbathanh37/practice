import User from "../models/user.js";
import { Op } from "sequelize";
import bcrypt from "bcryptjs";
import { sendNewPassword } from "../services/sesService.js";
import * as yup from 'yup';

const createUserSchema = yup.object().shape({
    email: yup.string().email().required(),
    name: yup.string().required(),
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

        const where = {
            isDelete: false,
            id: { [Op.ne]: req.user.id }
        };
        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } }
            ];
        }

        const order = [];
        if (sort) {
            const [field, direction] = sort.split('_');
            order.push([field, direction.toUpperCase()]);
        } else {
            order.push(['createdAt', 'DESC']);
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
        const { email, name, isRealEmail, contactEmail } = req.body;

        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const user = await User.create({
            email,
            name,
            isRealEmail,
            contactEmail,
            password: hashedPassword,
            lastPasswordChange: new Date()
        });

        await sendNewPassword(email, tempPassword);

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
        const { name, isRealEmail, contactEmail } = req.body;

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        await user.update({ name, isRealEmail, contactEmail });

        const { password, ...userWithoutPassword } = user.toJSON();
        return res.status(201).json(userWithoutPassword);
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

        user.isDelete = true;
        await user.save();

        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};