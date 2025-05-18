import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";
dotenv.config();
import User from "../models/user.js";
import Admin from "../models/admin.js";
import ExcelJS from 'exceljs';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
});

export const generateUploadURL = async (adminId) => {
  const avatarKey = `avatars/${adminId}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: avatarKey,
    ContentType: "image/*",
  });

  const uploadURL = await getSignedUrl(s3Client, command, {
    expiresIn: 3600,
  });

  await Admin.update(
    { avatarUrl: `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${avatarKey}` },
    { where: { id: adminId } }
  );

  return uploadURL;
};

export const generateExport = async () => {
  const users = await User.findAll({
    // where: { isDelete: false },
    attributes: ['userName', 'loginId', 'createdAt'],
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Users');
  
  worksheet.columns = [
    { header: 'User Name', key: 'userName', width: 30 },
    { header: 'Login Id', key: 'loginId', width: 30 },
    { header: 'Created At', key: 'createdAt', width: 20 },
  ];
  
  worksheet.addRows(users);
  const buffer = await workbook.xlsx.writeBuffer();
  
  const fileKey = `exports/user-export-${Date.now()}.xlsx`;
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileKey,
    Body: buffer,
    ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }));

  const downloadUrl = await getSignedUrl(s3Client, new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileKey
  }), { expiresIn: 60 });

  return {
    downloadUrl,
    fileKey // debug
  };
};

export const getAvatarUrl = async (adminId) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `avatars/${adminId}`,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
};