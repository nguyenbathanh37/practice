import { listUsers, createUser, updateUser, deleteUser } from './userManagementController.js';
import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import * as yup from 'yup';
import { Op } from 'sequelize';

// Mock all dependencies
jest.mock('../models/user.js');
jest.mock('bcryptjs');
// Update your yup mock in the test file
jest.mock('yup', () => {
    const actualYup = jest.requireActual('yup');
    return {
        ...actualYup,
        object: () => ({
            shape: jest.fn().mockReturnThis(),
            validate: jest.fn().mockResolvedValue(true)
        }),
        string: () => ({
            strict: jest.fn().mockReturnThis(),
            max: jest.fn().mockReturnThis(),
            email: jest.fn().mockReturnThis(),
            required: jest.fn().mockReturnThis(),
            nullable: jest.fn().mockReturnThis(),
            optional: jest.fn().mockReturnThis(),
            min: jest.fn().mockReturnThis(),
            matches: jest.fn().mockReturnThis()
        }),
        boolean: () => ({
            required: jest.fn().mockReturnThis(),
            optional: jest.fn().mockReturnThis()
        }),
        number: () => ({
            integer: jest.fn().mockReturnThis(),
            min: jest.fn().mockReturnThis(),
            optional: jest.fn().mockReturnThis() // Added optional() for number fields
        })
    };
});

describe('User Controller', () => {
    let mockRequest, mockResponse;

    beforeEach(() => {
        jest.clearAllMocks();

        mockRequest = {
            query: {},
            body: {},
            params: {}
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis()
        };
    });

    describe('listUsers', () => {
        it('should return paginated users with default values', async () => {
            const mockUsers = [{ id: 1, userName: 'Test User' }];
            User.findAndCountAll.mockResolvedValue({ count: 1, rows: mockUsers });

            await listUsers(mockRequest, mockResponse);

            expect(User.findAndCountAll).toHaveBeenCalledWith({
                where: {},
                order: [['updatedAt', 'DESC']],
                limit: 10,
                offset: 0,
                attributes: { exclude: ['password'] }
            });
            expect(mockResponse.json).toHaveBeenCalledWith({
                total: 1,
                page: 1,
                totalPages: 1,
                users: mockUsers
            });
        });

        it('should handle search query', async () => {
            mockRequest.query = { search: 'test' };
            await listUsers(mockRequest, mockResponse);

            expect(User.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
                where: {
                    [Op.or]: [
                        { userName: { [Op.like]: '%test%' } },
                        { loginId: { [Op.like]: '%test%' } }
                    ]
                }
            }));
        });

        it('should handle validation errors', async () => {
            const validationError = new yup.ValidationError('Invalid sort format');
            yup.object().validate.mockRejectedValue(validationError);

            mockRequest.query = { sort: 'invalid' };
            await listUsers(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid sort format' });
        });
    });

    describe('createUser', () => {
        it('should create a new user with hashed password', async () => {
            mockRequest.body = {
                employeeId: 'EMP001',
                loginId: 'test@example.com',
                userName: 'Test User'
            };

            User.findOne.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashedPassword');
            User.create.mockResolvedValue({
                id: 1,
                ...mockRequest.body,
                password: 'hashedPassword',
                toJSON: () => ({ id: 1, ...mockRequest.body })
            });

            await createUser(mockRequest, mockResponse);

            expect(bcrypt.hash).toHaveBeenCalled();
            expect(User.create).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(201);
        });

        it('should reject duplicate employeeId', async () => {
            mockRequest.body = {
                employeeId: 'EMP001',
                loginId: 'test@example.com',
                userName: 'Test User'
            };

            User.findOne.mockResolvedValue({ employeeId: 'EMP001' });

            await createUser(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(409);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Employee ID already exists.' });
        });

        it('should reject when loginId equals contactEmail', async () => {
            mockRequest.body = {
                employeeId: 'EMP001',
                loginId: 'test@example.com',
                userName: 'Test User',
                contactEmail: 'test@example.com'
            };

            await createUser(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Login ID and Contact Email must not be the same.'
            });
        });
    });

    describe('updateUser', () => {
        it('should update user details', async () => {
            mockRequest.params = { id: '1' };
            mockRequest.body = {
                userName: 'Updated Name',
                contactEmail: 'contact@test.com'
            };

            const mockUser = {
                id: 1,
                loginId: 'test@example.com',
                isRealEmail: false,
                update: jest.fn().mockResolvedValue(true),
                toJSON: () => ({ id: 1, userName: 'Updated Name' })
            };

            User.findByPk.mockResolvedValue(mockUser);

            await updateUser(mockRequest, mockResponse);

            expect(mockUser.update).toHaveBeenCalledWith({
                userName: 'Updated Name',
                contactEmail: 'contact@test.com'
            });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });

        it('should return 404 when user not found', async () => {
            mockRequest.params = { id: '999' };
            User.findByPk.mockResolvedValue(null);

            await updateUser(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'User not found' });
        });
    });

    describe('deleteUser', () => {
        it('should delete a user', async () => {
            mockRequest.params = { id: '1' };
            const mockUser = {
                id: 1,
                destroy: jest.fn().mockResolvedValue(true)
            };
            User.findByPk.mockResolvedValue(mockUser);

            await deleteUser(mockRequest, mockResponse);

            expect(mockUser.destroy).toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith({ success: true });
        });

        it('should handle delete errors', async () => {
            mockRequest.params = { id: '1' };
            const mockUser = {
                id: 1,
                destroy: jest.fn().mockRejectedValue(new Error('DB error'))
            };
            User.findByPk.mockResolvedValue(mockUser);

            await deleteUser(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'DB error' });
        });
    });
});