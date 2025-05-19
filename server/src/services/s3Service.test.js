import { generateUploadURL, generateExport, getAvatarUrl } from './s3Service.js';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import Admin from '../models/admin.js';
import User from '../models/user.js';
import ExcelJS from 'exceljs';

// Mock all dependencies
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');
jest.mock('../models/admin.js');
jest.mock('../models/user.js');
jest.mock('exceljs');

describe('S3 Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      AWS_REGION: 'test-region',
      AWS_S3_BUCKET: 'test-bucket'
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('generateUploadURL', () => {
    it('should generate a presigned URL and update admin avatar', async () => {
      const mockUrl = 'https://presigned.url';
      const mockAdminId = '123';
      
      getSignedUrl.mockResolvedValue(mockUrl);
      Admin.update.mockResolvedValue([1]);

      const result = await generateUploadURL(mockAdminId);

      expect(S3Client).toHaveBeenCalledWith({ region: 'test-region' });
      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: `avatars/${mockAdminId}`,
        ContentType: 'image/*'
      });
      expect(getSignedUrl).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
        expiresIn: 3600
      });
      expect(Admin.update).toHaveBeenCalledWith(
        { avatarUrl: `https://test-bucket.s3.amazonaws.com/avatars/${mockAdminId}` },
        { where: { id: mockAdminId } }
      );
      expect(result).toBe(mockUrl);
    });

    it('should handle errors', async () => {
      getSignedUrl.mockRejectedValue(new Error('S3 error'));
      await expect(generateUploadURL('123')).rejects.toThrow('S3 error');
    });
  });

  describe('generateExport', () => {
    it('should generate and upload an Excel export', async () => {
      const mockUsers = [
        { userName: 'User1', loginId: 'user1@test.com', createdAt: new Date() },
        { userName: 'User2', loginId: 'user2@test.com', createdAt: new Date() }
      ];
      const mockDownloadUrl = 'https://download.url';
      const mockFileKey = 'exports/user-export-123.xlsx';

      User.findAll.mockResolvedValue(mockUsers);
      getSignedUrl.mockResolvedValue(mockDownloadUrl);
      
      const result = await generateExport();

      // Verify Excel generation
      expect(ExcelJS.Workbook).toHaveBeenCalled();
      expect(User.findAll).toHaveBeenCalledWith({
        attributes: ['userName', 'loginId', 'createdAt']
      });

      // Verify S3 upload
      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: expect.stringContaining('exports/user-export-'),
        Body: expect.any(Buffer),
        ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      // Verify signed URL generation
      expect(GetObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: expect.stringContaining('exports/user-export-')
      });
      expect(getSignedUrl).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
        expiresIn: 60
      });

      expect(result.downloadUrl).toBe(mockDownloadUrl);
    });

    it('should handle export errors', async () => {
      User.findAll.mockRejectedValue(new Error('DB error'));
      await expect(generateExport()).rejects.toThrow('DB error');
    });
  });

  describe('getAvatarUrl', () => {
    it('should generate a presigned URL for avatar', async () => {
      const mockUrl = 'https://avatar.url';
      const mockAdminId = '123';
      
      getSignedUrl.mockResolvedValue(mockUrl);

      const result = await getAvatarUrl(mockAdminId);

      expect(GetObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: `avatars/${mockAdminId}`
      });
      expect(getSignedUrl).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
        expiresIn: 3600
      });
      expect(result).toBe(mockUrl);
    });

    it('should handle avatar URL generation errors', async () => {
      getSignedUrl.mockRejectedValue(new Error('S3 error'));
      await expect(getAvatarUrl('123')).rejects.toThrow('S3 error');
    });
  });
});