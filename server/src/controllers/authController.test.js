import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import * as authController from '../controllers/authController';
import Admin from '../models/admin';
import { sendResetPassword } from '../services/sesService';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');
jest.mock('../models/admin');
jest.mock('../services/sesService');

describe('Auth Controller', () => {
  const mockRequest = (body = {}, params = {}, headers = {}) => ({
    body,
    params,
    headers,
  });

  const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return 400 for invalid email format', async () => {
      const req = mockRequest({ email: 'invalid', password: 'validPassword123' });
      const res = mockResponse();

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining('email must be a valid email'),
      });
    });

    it('should return 404 when admin not found', async () => {
      Admin.findOne.mockResolvedValue(null);
      const req = mockRequest({ 
        email: 'test@example.com', 
        password: Buffer.from('validPassword123').toString('base64') 
      });
      const res = mockResponse();

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Admin not found' });
    });

    it('should return 401 for invalid credentials', async () => {
      const mockAdmin = { password: 'hashedPassword' };
      Admin.findOne.mockResolvedValue(mockAdmin);
      bcrypt.compare.mockResolvedValue(false);

      const req = mockRequest({ 
        email: 'test@example.com', 
        password: Buffer.from('invalidPassword').toString('base64') 
      });
      const res = mockResponse();

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });

    it('should return tokens for valid credentials', async () => {
      const mockAdmin = { id: 1, password: 'hashedPassword' };
      Admin.findOne.mockResolvedValue(mockAdmin);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockImplementation((payload, secret, options) => {
        if (options.expiresIn === '10m') return 'accessToken';
        return 'refreshToken';
      });

      const req = mockRequest({ 
        email: 'test@example.com', 
        password: Buffer.from('validPassword123').toString('base64') 
      });
      const res = mockResponse();

      await authController.login(req, res);

      expect(res.json).toHaveBeenCalledWith({
        token: 'accessToken',
        refreshToken: 'refreshToken',
      });
    });

    it('should handle server errors', async () => {
      Admin.findOne.mockRejectedValue(new Error('Database error'));
      const req = mockRequest({ 
        email: 'test@example.com', 
        password: Buffer.from('validPassword123').toString('base64') 
      });
      const res = mockResponse();

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error',
        error: 'Database error',
      });
    });
  });

  describe('forgotPassword', () => {
    it('should return 400 for invalid email', async () => {
      const req = mockRequest({ email: 'invalid' });
      const res = mockResponse();

      await authController.forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining('email must be a valid email'),
      });
    });

    it('should call sendResetPassword for valid email', async () => {
      const req = mockRequest({ email: 'valid@example.com' });
      const res = mockResponse();

      sendResetPassword.mockResolvedValue(true);

      await authController.forgotPassword(req, res);

      expect(sendResetPassword).toHaveBeenCalledWith('valid@example.com');
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('should handle errors in sendResetPassword', async () => {
      const req = mockRequest({ email: 'valid@example.com' });
      const res = mockResponse();

      sendResetPassword.mockRejectedValue(new Error('SES error'));

      await authController.forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('resetPassword', () => {
    it('should return 400 for invalid token', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      const req = mockRequest({ token: 'invalid', newPassword: 'newPass123' });
      const res = mockResponse();

      await authController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    });

    it('should return 404 when admin not found', async () => {
      jwt.verify.mockReturnValue({ id: 1 });
      Admin.findByPk.mockResolvedValue(null);
      const req = mockRequest({ token: 'valid', newPassword: 'newPass123' });
      const res = mockResponse();

      await authController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Admin not found' });
    });

    it('should update password for valid token and admin', async () => {
      const mockAdmin = { update: jest.fn() };
      jwt.verify.mockReturnValue({ id: 1 });
      Admin.findByPk.mockResolvedValue(mockAdmin);
      bcrypt.hash.mockResolvedValue('hashedNewPassword');
      const req = mockRequest({ token: 'valid', newPassword: 'newPass123' });
      const res = mockResponse();

      await authController.resetPassword(req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith('newPass123', 10);
      expect(mockAdmin.update).toHaveBeenCalledWith({
        password: 'hashedNewPassword',
        lastPasswordChange: expect.any(Date),
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Password has been reset successfully',
      });
    });
  });

  describe('refreshToken', () => {
    it('should return 400 when refreshToken is missing', async () => {
      const req = mockRequest({});
      const res = mockResponse();

      await authController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'refreshToken is a required field' });
    });

    it('should return 401 for invalid refreshToken', async () => {
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(new Error('Invalid token'), null);
      });
      const req = mockRequest({ refreshToken: 'invalid' });
      const res = mockResponse();

      await authController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired refreshToken' });
    });

    it('should return new tokens for valid refreshToken', async () => {
      const decoded = { id: 1, email: 'test@example.com' };
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, decoded);
      });
      jwt.sign.mockImplementation((payload, secret, options) => {
        if (options.expiresIn === '10m') return 'newAccessToken';
        return 'newRefreshToken';
      });

      const req = mockRequest({ refreshToken: 'valid' });
      const res = mockResponse();

      await authController.refreshToken(req, res);

      expect(res.json).toHaveBeenCalledWith({
        token: 'newAccessToken',
        refreshToken: 'newRefreshToken',
      });
    });

    it('should handle server errors', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      const req = mockRequest({ refreshToken: 'valid' });
      const res = mockResponse();

      await authController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error',
        error: 'Unexpected error',
      });
    });
  });
});