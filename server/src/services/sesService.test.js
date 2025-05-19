import { sendResetPassword } from './sesService.js';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import Admin from '../models/admin.js';
import jwt from 'jsonwebtoken';

// Mock the SES client and command
jest.mock('@aws-sdk/client-ses', () => {
  const mockSend = jest.fn();
  return {
    SESClient: jest.fn(() => ({
      send: mockSend
    })),
    SendEmailCommand: jest.fn().mockImplementation(params => params),
    mockSend // Export the mock for assertions
  };
});

jest.mock('../models/admin.js');
jest.mock('jsonwebtoken');

describe('sendResetPassword', () => {
  const { mockSend } = require('@aws-sdk/client-ses');
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      JWT_SECRET: 'test-secret',
      SES_FROM_EMAIL: 'noreply@example.com'
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return early if admin not found', async () => {
    Admin.findOne.mockResolvedValue(null);
    
    const result = await sendResetPassword('nonexistent@example.com');
    
    expect(result).toBeUndefined();
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
    mockSend.mockResolvedValue({ MessageId: 'mock-id' });
    
    await sendResetPassword('admin@example.com');
    
    expect(SendEmailCommand).toHaveBeenCalledWith({
      Source: 'noreply@example.com',
      Destination: { ToAddresses: ['contact@example.com'] },
      Message: {
        Subject: { Data: 'Password Reset Request' },
        Body: { 
          Html: { 
            Data: expect.stringContaining('reset-password?token=mock-token')
          } 
        }
      }
    });
    expect(mockSend).toHaveBeenCalled();
  });

  it('should use loginId when isRealEmail is true', async () => {
    const mockAdmin = {
      id: 1,
      loginId: 'admin@example.com',
      isRealEmail: true
    };
    Admin.findOne.mockResolvedValue(mockAdmin);
    jwt.sign.mockReturnValue('mock-token');
    mockSend.mockResolvedValue({ MessageId: 'mock-id' });
    
    await sendResetPassword('admin@example.com');
    
    expect(SendEmailCommand).toHaveBeenCalledWith({
      Source: 'noreply@example.com',
      Destination: { ToAddresses: ['admin@example.com'] },
      Message: {
        Subject: { Data: 'Password Reset Request' },
        Body: { 
          Html: { 
            Data: expect.stringContaining('reset-password?token=mock-token')
          } 
        }
      }
    });
    expect(mockSend).toHaveBeenCalled();
  });

  it('should handle SES send errors gracefully', async () => {
    const mockAdmin = {
      id: 1,
      loginId: 'admin@example.com',
      isRealEmail: true
    };
    Admin.findOne.mockResolvedValue(mockAdmin);
    jwt.sign.mockReturnValue('mock-token');
    mockSend.mockRejectedValue(new Error('SES error'));
    
    await expect(sendResetPassword('admin@example.com'))
      .rejects.toThrow('SES error');
  });
});