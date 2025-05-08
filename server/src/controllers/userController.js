import { generateUploadURL, getAvatarUrl } from "../services/s3Service.js";
import bcrypt from "bcryptjs";
import User from "../models/user.js";

export const updateProfile = async (req, res) => {
    try {
        const updates = Object.keys(req.body);
        const allowedUpdates = ['name'];
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).send({ error: 'Invalid updates!' });
        }

        updates.forEach(update => req.user[update] = req.body[update]);
        await req.user.save();
        res.json(req.user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const changePassword = async (req, res) => {
  try {
      const { oldPassword, newPassword } = req.body;

      const userId = req.user.id;

      const user = await User.findByPk(userId);
      if (!user) return res.response({ error: 'User not found' }).code(404);

      if (!oldPassword || !newPassword) {
          return res.status(400).json({ error: 'Old password and new password are required.' });
      }
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
          return res.status(400).json({ error: 'Old password is incorrect.' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await user.update({
        password: hashedPassword,
        lastPasswordChange: new Date(),
      });

      res.status(200).json({ message: 'Password updated successfully.' });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    const uploadURL = await generateUploadURL(req.user.id);
    res.json({ uploadURL });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAvatar = async (req, res) => {
  try {
    const { userId } = req.params;
    const avatarUrl = await getAvatarUrl(userId);
    
    res.json({ avatarUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get avatar' });
  }
};