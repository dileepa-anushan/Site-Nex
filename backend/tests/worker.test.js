import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import User from '../models/users.js';
import { generateToken } from '../middlewares/authMiddleware.js';

describe('Worker Routes', () => {
    let workerToken;

    beforeEach(async () => {
        const workerUser = await User.create({
            name: 'John Doe',
            password: 'password123',
            email: 'worker1@test.com',
            userRole: 'WORKER',
            isActive: true
        });
        workerToken = generateToken(workerUser._id);
    });

    it('should fetch the worker dashboard data', async () => {
        const res = await request(app)
            .get('/api/worker/dashboard')
            .set('Authorization', `Bearer ${workerToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('success');
    });
});
