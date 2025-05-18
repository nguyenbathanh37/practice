import { sendResetPassword } from './sesService.js';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import Admin from '../models/admin.js';
import jwt from 'jsonwebtoken';

// Mock all dependencies
jest.mock('@aws-sdk/client-ses');
jest.mock('../models/admin.js');
jest.mock('jsonwebtoken');

describe('sesService', () => {
  let mockSend;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mock implementation for SESClient
    mockSend = jest.fn().mockResolvedValue({ MessageId: 'mock-message-id' });
    SESClient.prototype.send = mockSend;
  });

  describe('sendResetPassword', () => {
    it('should return early if admin not found', async () => {
      Admin.findOne.mockResolvedValue(null);
      
      const result = await sendResetPassword('nonexistent@example.com');
      
      expect(result).toBeUndefined();
      expect(Admin.findOne).toHaveBeenCalledWith({ where: { loginId: 'nonexistent@example.com' } });
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should use contactEmail when isRealEmail is false', async () => {
      const mockAdmin = {
        id: 1,
        loginId: 'admin@example.com',
        contactEmail: 'contact@example.com',
        isRealEmail: false
      };
      Admin.findOne.mockResolvedValue(mockAdmin);
      jwt.sign.mockReturnValue('mock-token');
      
      await sendResetPassword('admin@example.com');
      
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Destination: {
              ToAddresses: ['contact@example.com']
            }
          })
        })
      );
    });

    it('should use loginId when isRealEmail is true', async () => {
      const mockAdmin = {
        id: 1,
        loginId: 'admin@example.com',
        contactEmail: 'contact@example.com',
        isRealEmail: true
      };
      Admin.findOne.mockResolvedValue(mockAdmin);
      jwt.sign.mockReturnValue('mock-token');
      
      await sendResetPassword('admin@example.com');
      
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Destination: {
              ToAddresses: ['admin@example.com']
            }
          })
        })
      );
    });

    it('should generate token with correct payload and options', async () => {
      const mockAdmin = {
        id: 1,
        loginId: 'admin@example.com',
        isRealEmail: true
      };
      Admin.findOne.mockResolvedValue(mockAdmin);
      
      await sendResetPassword('admin@example.com');
      
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 1, loginId: 'admin@example.com' },
        process.env.JWT_SECRET,
        { expiresIn: '10m' }
      );
    });

    it('should send email with correct parameters', async () => {
      process.env.SES_FROM_EMAIL = 'noreply@example.com';
      
      const mockAdmin = {
        id: 1,
        loginId: 'admin@example.com',
        isRealEmail: true
      };
      Admin.findOne.mockResolvedValue(mockAdmin);
      jwt.sign.mockReturnValue('mock-token');
      
      await sendResetPassword('admin@example.com');
      
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            Source: 'noreply@example.com',
            Destination: { ToAddresses: ['admin@example.com'] },
            Message: {
              Subject: { Data: 'Password Reset Request' },
              Body: { 
                Html: { 
                  Data: expect.stringContaining('http://localhost:3000/reset-password?token=mock-token')
                } 
              }
            }
          }
        })
      );
    });

    it('should handle SES send errors gracefully', async () => {
      const mockAdmin = {
        id: 1,
        loginId: 'admin@example.com',
        isRealEmail: true
      };
      Admin.findOne.mockResolvedValue(mockAdmin);
      mockSend.mockRejectedValue(new Error('SES error'));
      
      await expect(sendResetPassword('admin@example.com')).rejects.toThrow('SES error');
    });
  });
});