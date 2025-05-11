import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const ses = new SESClient({ region: 'ap-southeast-1' });

export const sendNewPassword = async (email, password) => {

  const newPassword = password || Math.random().toString(36).slice(-8);
  const hashedPassword = await bcrypt.hash(newPassword, 10);


  const user = await User.findOne({ where: { email } });
  if (!user) return;

  await user.update({
    password: hashedPassword,
    lastPasswordChange: new Date()
  });

  let emailSend = email

  if (!user.isRealEmail) {
    emailSend = user.contactEmail
  }

  const templateResetPassword = `
            <h1>Password Reset</h1>
            <p>Your new temporary password: <strong>${newPassword}</strong></p>
            <p>Please login and change it immediately.</p>
            <p><small>This is an automated message. Do not reply.</small></p>
          `
  const templateCreateUser = `
            <h1>Create User</h1>
            <p>Your temporary password: <strong>${newPassword}</strong></p>
            <p>Please login and change it immediately.</p>
            <p><small>This is an automated message. Do not reply.</small></p>
          `
  const params = {
    Source: process.env.SES_FROM_EMAIL,
    Destination: { ToAddresses: [emailSend] },
    Message: {
      Subject: { Data: 'Your New Password' },
      Body: {
        Html: {
          Data: password ? templateCreateUser : templateResetPassword,
        },
      },
    },
  };

  await ses.send(new SendEmailCommand(params));
};