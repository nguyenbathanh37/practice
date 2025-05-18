import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Admin from '../models/admin.js';
import dotenv from 'dotenv';
import { sendResetPassword } from '../services/sesService.js';
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

    const admin = await Admin.findOne({ where: { loginId: email } });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const isMatch = await bcrypt.compare(unHashedPassword, admin.password);

    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: admin.id }, secret, { expiresIn: '10m' });
    const refreshToken = jwt.sign({ id: admin.id }, secret, { expiresIn: '30m' });

    return res.json({ token, refreshToken });
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

    await sendResetPassword(email);
    return { success: true };
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    return res.response({ error: 'Failed to process request' }).code(500);
  }
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, secret);
    const admin = await Admin.findByPk(decoded.id);

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await admin.update({
      password: hashedPassword,
      lastPasswordChange: new Date(),
    });

    return res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (err) {
    return res.status(400).json({ error: 'Invalid or expired token' });
  }
};


export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  try {
    if (!refreshToken) return res.status(400).json({ message: "refreshToken is required" });

    jwt.verify(refreshToken, secret, (err, decoded) => {
      if (err) return res.status(401).json({ message: "Invalid or expired refreshToken" });

      const newToken = jwt.sign({ id: decoded.id, email: decoded.email }, secret, { expiresIn: '10m' });
      const newRefreshToken = jwt.sign({ id: decoded.id, email: decoded.email }, secret, { expiresIn: '30m' });

      return res.json({ token: newToken, refreshToken: newRefreshToken });
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};