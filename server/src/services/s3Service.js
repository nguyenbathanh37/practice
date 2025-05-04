import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";
dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
});

export const generateUploadURL = async (userId) => {
  const avatarKey = `avatars/${userId}/${Date.now()}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: avatarKey,
    ContentType: "image/*",
  });

  const uploadURL = await getSignedUrl(s3Client, command, {
    expiresIn: 3600,
  });

  await User.update(
    { avatarUrl: `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${avatarKey}` },
    { where: { id: userId } }
  );

  return uploadURL;
};