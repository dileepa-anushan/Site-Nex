import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import User from '../models/users.js';
import { generateToken } from '../middlewares/authMiddleware.js';

describe('Project Manager Routes', () => {
    let pmToken;

    beforeEach(async () => {
        const pmUser = await User.create({
            name: 'Project Manager',
            password: 'password123',
            email: 'pm@test.com',
            userRole: 'PROJECT_MANAGER',
            isActive: true
        });
        pmToken = generateToken(pmUser._id);
    });

    it('should fetch PM projects', async () => {
        const res = await request(app)
            .get('/api/pm/projects')
            .set('Authorization', `Bearer ${pmToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('projects');
    });
});
