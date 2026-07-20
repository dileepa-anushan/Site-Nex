import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import User from '../models/users.js';
import { generateToken } from '../middlewares/authMiddleware.js';

describe('Site Engineer Routes', () => {
    let seToken;

    beforeEach(async () => {
        const seUser = await User.create({
            name: 'Site Engineer',
            password: 'password123',
            email: 'se@test.com',
            userRole: 'SITE_ENGINEER',
            isActive: true
        });
        seToken = generateToken(seUser._id);
    });

    it('should fetch the SE dashboard info', async () => {
        const res = await request(app)
            .get('/api/se/metrics')
            .set('Authorization', `Bearer ${seToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
    });
});
