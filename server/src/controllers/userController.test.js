import {
    updateProfile,
    changePassword,
    uploadAvatar,
    getMe,
    getAvatar
} from './userController.js';
import { generateUploadURL, getAvatarUrl } from '../services/s3Service.js';
import bcrypt from 'bcryptjs';
import Admin from '../models/admin.js';
import * as yup from 'yup';

// Mock all dependencies
jest.mock('../services/s3Service.js');
jest.mock('bcryptjs');
jest.mock('../models/admin.js');
jest.mock('yup', () => {
    const originalModule = jest.requireActual('yup');
    return {
        ...originalModule,
        object: () => ({
            shape: jest.fn().mockReturnThis(),
            validate: jest.fn().mockResolvedValue(true)
        }),
        string: () => ({
            strict: jest.fn().mockReturnThis(),
            min: jest.fn().mockReturnThis(), // Added min() method
            max: jest.fn().mockReturnThis(),
            email: jest.fn().mockReturnThis(),
            required: jest.fn().mockReturnThis(),
            nullable: jest.fn().mockReturnThis(),
            optional: jest.fn().mockReturnThis(),
            matches: jest.fn().mockReturnThis()
        }),
        boolean: () => ({
            required: jest.fn().mockReturnThis()
        }),
        number: () => ({
            integer: jest.fn().mockReturnThis(),
            min: jest.fn().mockReturnThis()
        })
    };
});

describe('Admin Controller', () => {
    let mockRequest, mockResponse;

    beforeEach(() => {
        jest.clearAllMocks();

        mockRequest = {
            body: {},
            params: {},
            admin: {
                id: 1,
                adminName: 'Test Admin',
                isRealEmail: true,
                contactEmail: 'contact@test.com',
                save: jest.fn().mockResolvedValue(true),
                password: 'hashedOldPassword',
                passwordHistory: ['hash1', 'hash2', 'hash3'],
                toJSON: jest.fn().mockReturnValue({
                    id: 1,
                    adminName: 'Test Admin',
                    isRealEmail: true,
                    contactEmail: 'contact@test.com'
                })
            }
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis()
        };
    });


    describe('updateProfile', () => {
        it('should update profile with valid data', async () => {
            mockRequest.body = {
                adminName: 'Updated Name',
                isRealEmail: false,
                contactEmail: 'new@test.com'
            };

            await updateProfile(mockRequest, mockResponse);

            expect(mockRequest.admin.adminName).toBe('Updated Name');
            expect(mockRequest.admin.isRealEmail).toBe(false);
            expect(mockRequest.admin.contactEmail).toBe('new@test.com');
            expect(mockRequest.admin.save).toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                adminName: 'Updated Name'
            }));
        });

        it('should reject invalid updates', async () => {
            mockRequest.body = {
                invalidField: 'value'
            };

            await updateProfile(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.send).toHaveBeenCalledWith({ error: 'Invalid updates!' });
        });

        it('should handle validation errors', async () => {
            // Override the default mock for this test
            require('yup').object = jest.fn().mockImplementation(() => ({
                shape: jest.fn().mockImplementation(() => ({
                    validate: jest.fn().mockRejectedValue(new Error('ValidationError'))
                }))
            }));

            await updateProfile(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Validation failed'
            });
        });
    });

    describe('changePassword', () => {
        let mockAdmin;

        beforeEach(() => {
            mockAdmin = {
                id: 1,
                password: 'hashedOldPassword',
                passwordHistory: ['hash1', 'hash2', 'hash3'],
                update: jest.fn().mockResolvedValue(true)
            };

            Admin.findByPk.mockResolvedValue(mockAdmin);
        });

        it('should change password with valid credentials', async () => {
            mockRequest.body = {
                oldPassword: 'correctOldPassword',
                newPassword: 'newSecurePassword123'
            };

            bcrypt.compare.mockImplementation((pass, hash) => {
                if (hash === 'hashedOldPassword') return pass === 'correctOldPassword';
                return false;
            });
            bcrypt.hash.mockResolvedValue('hashedNewPassword');

            await changePassword(mockRequest, mockResponse);

            expect(bcrypt.compare).toHaveBeenCalledWith('correctOldPassword', 'hashedOldPassword');
            expect(bcrypt.hash).toHaveBeenCalledWith('newSecurePassword123', 10);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Password updated successfully.' });
        });

        it('should reject incorrect old password', async () => {
            mockRequest.body = {
                oldPassword: 'wrongPassword',
                newPassword: 'newSecurePassword123'
            };

            bcrypt.compare.mockResolvedValue(false);

            await changePassword(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Old password is incorrect.' });
        });

        it('should reject if new password matches current', async () => {
            mockRequest.body = {
                oldPassword: 'correctOldPassword',
                newPassword: 'sameAsCurrent'
            };

            bcrypt.compare.mockImplementation((pass, hash) =>
                pass === 'sameAsCurrent' && hash === 'hashedOldPassword'
            );

            await changePassword(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Old password is incorrect.'
            });
        });

        it('should reject if new password was used before', async () => {
            mockRequest.body = {
                oldPassword: 'correctOldPassword',
                newPassword: 'previouslyUsedPassword'
            };

            bcrypt.compare.mockImplementation(async (pass, hash) => {
                if (hash === 'hashedOldPassword') return pass === 'correctOldPassword';
                if (hash === 'hash1') return pass === 'previouslyUsedPassword';
                return false;
            });

            await changePassword(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'New password cannot be the same as any of your last 3 passwords.'
            });
        });

        it('should handle server errors', async () => {
            mockRequest.body = {
                oldPassword: 'correctOldPassword',
                newPassword: 'newSecurePassword123'
            };

            bcrypt.compare.mockRejectedValue(new Error('Database error'));

            await changePassword(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
        });
    });

    describe('uploadAvatar', () => {
        it('should return upload URL', async () => {
            generateUploadURL.mockResolvedValue('https://s3.upload.url');

            await uploadAvatar(mockRequest, mockResponse);

            expect(generateUploadURL).toHaveBeenCalledWith(1);
            expect(mockResponse.json).toHaveBeenCalledWith({ uploadURL: 'https://s3.upload.url' });
        });

        it('should handle upload errors', async () => {
            generateUploadURL.mockRejectedValue(new Error('S3 error'));

            await uploadAvatar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'S3 error' });
        });
    });

    describe('getMe', () => {
        it('should return admin profile', async () => {
            await getMe(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(mockRequest.admin);
        });

        it('should handle missing admin', async () => {
            mockRequest.admin = null;

            await getMe(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Admin not found.' });
        });
    });

    describe('getAvatar', () => {
        it('should return avatar URL', async () => {
            mockRequest.params.adminId = '123';
            getAvatarUrl.mockResolvedValue('https://s3.avatar.url');

            await getAvatar(mockRequest, mockResponse);

            expect(getAvatarUrl).toHaveBeenCalledWith('123');
            expect(mockResponse.json).toHaveBeenCalledWith({ avatarUrl: 'https://s3.avatar.url' });
        });

        it('should handle avatar fetch errors', async () => {
            mockRequest.params.adminId = '123';
            getAvatarUrl.mockRejectedValue(new Error('Not found'));

            await getAvatar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Failed to get avatar' });
        });
    });
});