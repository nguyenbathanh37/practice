import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import User from '../models/user.js';
import Admin from '../models/admin.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';

const ses = new SESClient({ region: 'ap-southeast-1' });

export const sendResetPassword = async (email) => {

  const admin = await Admin.findOne({ where: { loginId: email } });
  if (!admin) return;

  let emailSend = email

  if (!admin.isRealEmail) {
    emailSend = admin.contactEmail
  }

  const token = jwt.sign({id: admin.id, loginId: emailSend}, process.env.JWT_SECRET, {
    expiresIn: '10m',
  });

  const resetLink = `https://main.d1f1g3lb2shy3p.amplifyapp.com/reset-password?token=${token}`;

  const emailTemplate = `
      <h2>Reset your password</h2>
      <p>You requested a password reset. Click the link below:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>This link is valid for 1 hour.</p>
    `;
  const params = {
    Source: process.env.SES_FROM_EMAIL,
    Destination: { ToAddresses: [emailSend] },
    Message: {
      Subject: { Data: 'Password Reset Request' },
      Body: { Html: { Data: emailTemplate } },
    },
  };

  await ses.send(new SendEmailCommand(params));
};