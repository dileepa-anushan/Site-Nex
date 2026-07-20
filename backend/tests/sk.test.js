import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import User from '../models/users.js';
import { generateToken } from '../middlewares/authMiddleware.js';

describe('Store Keeper Routes', () => {
    let skToken;

    beforeEach(async () => {
        const skUser = await User.create({
            name: 'Store Keeper',
            password: 'password123',
            email: 'sk@test.com',
            userRole: 'STORE_KEEPER',
            isActive: true
        });
        skToken = generateToken(skUser._id);
    });

    it('should fetch the main storage tools', async () => {
        // Main storage routes don't always require a project, just SK role
        const res = await request(app)
            .get('/api/store/tools')
            .set('Authorization', `Bearer ${skToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
    });
});
