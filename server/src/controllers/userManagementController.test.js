import { listUsers, createUser, updateUser, deleteUser } from './userManagementController.js';
import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';

jest.mock('../models/user.js');
jest.mock('bcryptjs');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('userManagementController', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('listUsers', () => {
        it('should list users with default params', async () => {
            User.findAndCountAll.mockResolvedValue({ count: 2, rows: [{ id: 1 }, { id: 2 }] });
            const req = { query: {} };
            const res = mockRes();
            await listUsers(req, res);
            expect(User.findAndCountAll).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                total: 2,
                page: 1,
                totalPages: 1,
                users: [{ id: 1 }, { id: 2 }]
            }));
        });

        it('should list users with search and sort', async () => {
            User.findAndCountAll.mockResolvedValue({ count: 1, rows: [{ id: 3 }] });
            const req = { query: { search: 'foo', sort: 'userName_asc', page: 2, limit: 1 } };
            const res = mockRes();
            await listUsers(req, res);
            expect(User.findAndCountAll).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                total: 1,
                page: 2,
                totalPages: 1,
                users: [{ id: 3 }]
            }));
        });

        it('should handle validation error', async () => {
            const req = { query: { sort: 'badformat' } };
            const res = mockRes();
            await listUsers(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
        });

        it('should handle internal error', async () => {
            User.findAndCountAll.mockRejectedValue(new Error('DB error'));
            const req = { query: {} };
            const res = mockRes();
            await listUsers(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'DB error' });
        });
    });

    describe('createUser', () => {
        it('should create user successfully', async () => {
            User.findOne.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashed');
            User.create.mockResolvedValue({
                toJSON: () => ({
                    id: 1, employeeId: 'E1', loginId: 'a@b.com', userName: 'foo', isRealEmail: false, contactEmail: 'c@d.com'
                }),
            });
            const req = { body: { employeeId: 'E1', loginId: 'a@b.com', userName: 'foo', isRealEmail: false, contactEmail: 'c@d.com' } };
            const res = mockRes();
            await createUser(req, res);
            expect(User.create).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
        });

        it('should not allow loginId equal to contactEmail', async () => {
            const req = { body: { employeeId: 'E1', loginId: 'a@b.com', userName: 'foo', isRealEmail: false, contactEmail: 'a@b.com' } };
            const res = mockRes();
            await createUser(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Login ID and Contact Email must not be the same.' });
        });

        it('should return 409 if employeeId exists', async () => {
            User.findOne.mockResolvedValue({ employeeId: 'E1', loginId: 'other@b.com' });
            const req = { body: { employeeId: 'E1', loginId: 'a@b.com', userName: 'foo', isRealEmail: false, contactEmail: 'c@d.com' } };
            const res = mockRes();
            await createUser(req, res);
            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({ error: 'Employee ID already exists.' });
        });

        it('should return 409 if loginId exists', async () => {
            User.findOne.mockResolvedValue({ employeeId: 'E2', loginId: 'a@b.com' });
            const req = { body: { employeeId: 'E1', loginId: 'a@b.com', userName: 'foo', isRealEmail: false, contactEmail: 'c@d.com' } };
            const res = mockRes();
            await createUser(req, res);
            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({ error: 'Login ID already exists.' });
        });

        it('should handle validation error', async () => {
            const req = { body: { employeeId: '', loginId: 'bad', userName: '' } };
            const res = mockRes();
            await createUser(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
        });

        it('should handle other errors', async () => {
            User.findOne.mockRejectedValue(new Error('DB error'));
            const req = { body: { employeeId: 'E1', loginId: 'a@b.com', userName: 'foo', isRealEmail: false, contactEmail: 'c@d.com' } };
            const res = mockRes();
            await createUser(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'DB error' });
        });
    });

    describe('updateUser', () => {
        it('should update user successfully', async () => {
            const mockUser = {
                isRealEmail: false,
                loginId: 'a@b.com',
                update: jest.fn().mockResolvedValue(),
                toJSON: () => ({ id: 1, userName: 'bar', contactEmail: 'c@d.com' }),
            };
            User.findByPk.mockResolvedValue(mockUser);
            const req = { params: { id: 1 }, body: { userName: 'bar', contactEmail: 'c@d.com' } };
            const res = mockRes();
            await updateUser(req, res);
            expect(mockUser.update).toHaveBeenCalledWith({ userName: 'bar', contactEmail: 'c@d.com' });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
        });

        it('should return 404 if user not found', async () => {
            User.findByPk.mockResolvedValue(null);
            const req = { params: { id: 1 }, body: { userName: 'bar', contactEmail: 'c@d.com' } };
            const res = mockRes();
            await updateUser(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
        });

        it('should return 403 if isRealEmail true and contactEmail not null', async () => {
            const mockUser = {
                isRealEmail: true,
                loginId: 'a@b.com',
                update: jest.fn(),
                toJSON: jest.fn(),
            };
            User.findByPk.mockResolvedValue(mockUser);
            const req = { params: { id: 1 }, body: { userName: 'bar', contactEmail: 'c@d.com' } };
            const res = mockRes();
            await updateUser(req, res);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: 'Cannot update contactEmail when isRealEmail is true.' });
        });

        it('should return 400 if loginId equals contactEmail', async () => {
            const mockUser = {
                isRealEmail: false,
                loginId: 'c@d.com',
                update: jest.fn(),
                toJSON: jest.fn(),
            };
            User.findByPk.mockResolvedValue(mockUser);
            const req = { params: { id: 1 }, body: { userName: 'bar', contactEmail: 'c@d.com' } };
            const res = mockRes();
            await updateUser(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Login ID and Contact Email must not be the same.' });
        });

        it('should handle validation error', async () => {
            const req = { params: { id: 1 }, body: { userName: '', contactEmail: 'bad' } };
            const res = mockRes();
            await updateUser(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
        });

        it('should handle other errors', async () => {
            User.findByPk.mockRejectedValue(new Error('DB error'));
            const req = { params: { id: 1 }, body: { userName: 'bar', contactEmail: 'c@d.com' } };
            const res = mockRes();
            await updateUser(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'DB error' });
        });
    });

    describe('deleteUser', () => {
        it('should delete user successfully', async () => {
            const mockUser = { destroy: jest.fn() };
            User.findByPk.mockResolvedValue(mockUser);
            const req = { params: { id: 1 } };
            const res = mockRes();
            await deleteUser(req, res);
            expect(mockUser.destroy).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({ success: true });
        });

        it('should return 404 if user not found', async () => {
            User.findByPk.mockResolvedValue(null);
            const req = { params: { id: 1 } };
            const res = mockRes();
            await deleteUser(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
        });

        it('should handle errors', async () => {
            User.findByPk.mockRejectedValue(new Error('DB error'));
            const req = { params: { id: 1 } };
            const res = mockRes();
            await deleteUser(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'DB error' });
        });
    });
});