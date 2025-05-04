import User from "../models/user.js";
import { Op } from "sequelize";
import bcrypt from "bcryptjs";

export const listUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, sort } = req.query;

        const offset = (page - 1) * limit;

        const where = {};
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
        return res.status(500).json({ error: error.message });
    }
};

export const createUser = async (req, res) => {
    try {
        const { email, name } = req.body;

        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const user = await User.create({
            email,
            name,
            password: hashedPassword,
            lastPasswordChange: new Date()
        });

        // await sendTempPasswordEmail(email, tempPassword);

        const { password, ...userWithoutPassword } = user.toJSON();
        return res.status(201).json(userWithoutPassword);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        await user.update({ name });

        const { password, ...userWithoutPassword } = user.toJSON();
        return res.status(201).json(userWithoutPassword);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);

        if (!user) return res.status(404).json({ error: 'User not found' });

        await user.destroy();
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};