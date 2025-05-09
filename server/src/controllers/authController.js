import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/user.js';
import dotenv from 'dotenv';
import { sendNewPassword } from '../services/sesService.js';
import { ulid } from "ulid";

dotenv.config();

const secret = process.env.JWT_SECRET;

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        const token = jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: '1h' });
        return res.json({ token });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
      await sendNewPassword(email);
      return { success: true };
    } catch (error) {
      return res.response({ error: 'Failed to process request' }).code(500);
    }
};