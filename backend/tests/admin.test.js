import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import User from '../models/users.js';
import { generateToken } from '../middlewares/authMiddleware.js';

describe('Admin Routes', () => {
    let adminToken;
    let nonAdminToken;

    beforeEach(async () => {
        // Create an Admin user
        const adminUser = await User.create({
            name: 'Admin User',
            password: 'password123',
            email: 'admin@test.com',
            userRole: 'ADMIN',
            isActive: true
        });
        adminToken = generateToken(adminUser._id);

        // Create a non-Admin user
        const regularUser = await User.create({
            name: 'Worker User',
            password: 'password123',
            email: 'worker@test.com',
            userRole: 'WORKER',
            isActive: true
        });
        nonAdminToken = generateToken(regularUser._id);
    });

    it('should allow ADMIN to fetch dashboard stats', async () => {
        const res = await request(app)
            .get('/api/admin/stats')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.stats).toHaveProperty('totalUsers');
    });

    it('should deny non-ADMIN from fetching dashboard stats', async () => {
        const res = await request(app)
            .get('/api/admin/stats')
            .set('Authorization', `Bearer ${nonAdminToken}`);

        expect(res.statusCode).toEqual(403);
    });
});
