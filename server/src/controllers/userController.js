import { generateUploadURL, getAvatarUrl } from "../services/s3Service.js";
import bcrypt from "bcryptjs";
import Admin from "../models/admin.js";

import * as yup from 'yup';

const updateProfileSchema = yup.object().shape({
  adminName: yup.string().strict().max(30).required(),
  isRealEmail: yup.boolean().required(),
  contactEmail: yup.string().strict().email().max(111).nullable().optional(),
});

const changePasswordSchema = yup.object().shape({
  oldPassword: yup.string().strict().min(10).required(),
  newPassword: yup.string().strict().min(10).required(),
});

export const updateProfile = async (req, res) => {
  try {
    await updateProfileSchema.validate(req.body);

    const updates = Object.keys(req.body);
    const allowedUpdates = ['adminName', 'isRealEmail', 'contactEmail'];
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
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, admin.password);
    if (!isOldPasswordValid) {
      return res.status(400).json({ error: 'Old password is incorrect.' });
    }

    // Check if new password is same as current
    const isSameAsCurrent = await bcrypt.compare(newPassword, admin.password);
    if (isSameAsCurrent) {
      return res.status(400).json({
        error: 'New password must be different from current password.'
      });
    }

    // Check against last 3 passwords
    const passwordHistory = admin.passwordHistory;
    const isUsedBefore = await Promise.all(
      passwordHistory.slice(0, 3).map(async oldHash =>
        await bcrypt.compare(newPassword, oldHash)
      )
    );

    if (isUsedBefore.includes(true)) {
      return res.status(400).json({
        error: 'New password cannot be the same as any of your last 3 passwords.'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password history (keep max 3 entries)
    const updatedHistory = [
      admin.password, // current password becomes first in history
      ...passwordHistory.slice(0, 2) // keep only 2 most recent
    ];

    await admin.update({
      password: hashedPassword,
      lastPasswordChange: new Date(),
      passwordHistory: updatedHistory
    });

    return res.status(200).json({ message: 'Password updated successfully.' });

  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Password change error:', error);
    return res.status(500).json({ error: 'Internal server error' });
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