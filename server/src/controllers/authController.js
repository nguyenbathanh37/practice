import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/user.js';
import dotenv from 'dotenv';
import { sendNewPassword } from '../services/sesService.js';
import * as yup from 'yup';

dotenv.config();

const secret = process.env.JWT_SECRET;

const loginSchema = yup.object().shape({
  email: yup.string().strict().email().required(),
  password: yup.string().strict().min(8).required(),
});

const forgotPasswordSchema = yup.object().shape({
  email: yup.string().strict().email().required(),
});

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const unHashedPassword = Buffer.from(password, 'base64').toString('utf-8');
    await loginSchema.validate({ email, password: unHashedPassword });
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(unHashedPassword, user.password);
    console.log(`Comparing passwords: ${unHashedPassword} with ${user.password}`);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: '1h' });
    return res.json({ token });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    await forgotPasswordSchema.validate({ email });

    await sendNewPassword(email);
    return { success: true };
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    return res.response({ error: 'Failed to process request' }).code(500);
  }
};