import { generateUploadURL, getAvatarUrl } from "../services/s3Service.js";
import bcrypt from "bcryptjs";
import Admin from "../models/admin.js";

import * as yup from 'yup';

const updateProfileSchema = yup.object().shape({
  name: yup.string().strict().optional(),
  contactEmail: yup.string().strict().email().nullable().optional(),
  isRealEmail: yup.boolean().strict().optional(),
});

const changePasswordSchema = yup.object().shape({
  oldPassword: yup.string().strict().required(),
  newPassword: yup.string().strict().min(8).required(),
});

export const updateProfile = async (req, res) => {
  try {
    await updateProfileSchema.validate(req.body);

    const updates = Object.keys(req.body);
    const allowedUpdates = ['adminName', 'contactEmail', 'isRealEmail'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).send({ error: 'Invalid updates!' });
    }

    updates.forEach(update => req.admin[update] = req.body[update]);
    await req.admin.save();
    res.json(req.admin);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    await changePasswordSchema.validate(req.body);

    const { oldPassword, newPassword } = req.body;

    const adminId = req.admin.id;

    const admin = await Admin.findByPk(adminId);
    if (!admin) return res.response({ error: 'Admin not found' }).code(404);

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old password and new password are required.' });
    }
    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Old password is incorrect.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await admin.update({
      password: hashedPassword,
      lastPasswordChange: new Date(),
    });

    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    const uploadURL = await generateUploadURL(req.admin.id);
    res.json({ uploadURL });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const admin = req.admin;

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found.' });
    }

    res.status(200).json(admin);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAvatar = async (req, res) => {
  try {
    const { adminId } = req.params;
    const avatarUrl = await getAvatarUrl(adminId);
    res.json({ avatarUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get avatar' });
  }
};