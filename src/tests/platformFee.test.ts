import request from 'supertest';
import { app } from '../app';
import { prisma } from '../config/prisma';
import type { TierName, PlatformFee } from '@prisma/client';

describe('PlatformFee Routes', () => {
  beforeEach(async () => {
    // Clean up the database before each test
    await prisma.platformFee.deleteMany();
  });

  afterAll(async () => {
    // Disconnect Prisma after all tests

    // clear the database
    await prisma.platformFee.deleteMany();

    await prisma.$disconnect();
  });

  describe('POST /api/v1/platform-fees', () => {
    it('should create a new platform fee', async () => {
      const newPlatformFee = {
        tier_name: 'BASIC',
        min_value: 0,
        max_value: 1000,
        platform_fee_percentage: 5.5,
      };

      const response = await request(app)
        .post('/api/v1/platform-fees')
        .send(newPlatformFee)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('statusCode', 201);
      expect(response.body).toHaveProperty(
        'message',
        'Platform fee created successfully'
      );
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('tier_name', 'BASIC');
      expect(response.body.data).toHaveProperty('min_value', 0);
      expect(response.body.data).toHaveProperty('max_value', 1000);
      expect(response.body.data).toHaveProperty('platform_fee_percentage');
    });

    it('should not allow duplicate tier names', async () => {
      const platformFee = {
        tier_name: 'STANDARD',
        min_value: 1001,
        max_value: 5000,
        platform_fee_percentage: 7.5,
      };

      // Create the platform fee for the first time
      await request(app)
        .post('/api/v1/platform-fees')
        .send(platformFee)
        .expect(201);

      // Try to create another platform fee with the same tier name
      const response = await request(app)
        .post('/api/v1/platform-fees')
        .send(platformFee)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('already exists');
    });

    it('should validate that max_value is greater than or equal to min_value', async () => {
      const invalidPlatformFee = {
        tier_name: 'PREMIUM',
        min_value: 5000,
        max_value: 1000, // Invalid: less than min_value
        platform_fee_percentage: 10,
      };

      const response = await request(app)
        .post('/api/v1/platform-fees')
        .send(invalidPlatformFee)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should validate tier_name is one of the allowed values', async () => {
      const invalidPlatformFee = {
        tier_name: 'INVALID_TIER',
        min_value: 0,
        max_value: 1000,
        platform_fee_percentage: 5.5,
      };

      const response = await request(app)
        .post('/api/v1/platform-fees')
        .send(invalidPlatformFee)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should validate min_value is non-negative', async () => {
      const invalidPlatformFee = {
        tier_name: 'BASIC',
        min_value: -100, // Invalid: negative value
        max_value: 1000,
        platform_fee_percentage: 5.5,
      };

      const response = await request(app)
        .post('/api/v1/platform-fees')
        .send(invalidPlatformFee)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should validate platform_fee_percentage is between 0 and 100', async () => {
      const invalidPlatformFee = {
        tier_name: 'BASIC',
        min_value: 0,
        max_value: 1000,
        platform_fee_percentage: 150, // Invalid: greater than 100
      };

      const response = await request(app)
        .post('/api/v1/platform-fees')
        .send(invalidPlatformFee)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should validate all required fields are provided', async () => {
      const incompletePlatformFee = {
        tier_name: 'BASIC',
        min_value: 0,
        // Missing max_value and platform_fee_percentage
      };

      const response = await request(app)
        .post('/api/v1/platform-fees')
        .send(incompletePlatformFee)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/v1/platform-fees', () => {
    it('should get all platform fees', async () => {
      const mockPlatformFees = [
        {
          tier_name: 'BASIC' as TierName,
          min_value: 0,
          max_value: 1000,
          platform_fee_percentage: 5.5,
        },
        {
          tier_name: 'STANDARD' as TierName,
          min_value: 1001,
          max_value: 5000,
          platform_fee_percentage: 7.5,
        },
        {
          tier_name: 'PREMIUM' as TierName,
          min_value: 5001,
          max_value: 10000,
          platform_fee_percentage: 10,
        },
      ];

      // Seed data directly into the database
      await prisma.platformFee.createMany({ data: mockPlatformFees });

      const response = await request(app)
        .get('/api/v1/platform-fees')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty(
        'message',
        'Platform fees retrieved successfully'
      );
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0]).toHaveProperty('tier_name');
      expect(response.body.data[0]).toHaveProperty('min_value');
      expect(response.body.data[0]).toHaveProperty('max_value');
      expect(response.body.data[0]).toHaveProperty('platform_fee_percentage');
    });

    it('should return an empty array when no platform fees exist', async () => {
      const response = await request(app)
        .get('/api/v1/platform-fees')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return platform fees ordered by created_at ascending', async () => {
      // Create platform fees at different times
      const firstFee = await prisma.platformFee.create({
        data: {
          tier_name: 'BASIC' as TierName,
          min_value: 0,
          max_value: 1000,
          platform_fee_percentage: 5.5,
        },
      });

      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      const secondFee = await prisma.platformFee.create({
        data: {
          tier_name: 'STANDARD' as TierName,
          min_value: 1001,
          max_value: 5000,
          platform_fee_percentage: 7.5,
        },
      });

      const response = await request(app)
        .get('/api/v1/platform-fees')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      // The oldest created should be first (ascending order)
      expect(response.body.data[0].id).toBe(firstFee.id);
      expect(response.body.data[1].id).toBe(secondFee.id);
    });
  });

  describe('GET /api/v1/platform-fees/:id', () => {
    it('should get a platform fee by ID', async () => {
      const mockPlatformFee = {
        tier_name: 'BASIC' as TierName,
        min_value: 0,
        max_value: 1000,
        platform_fee_percentage: 5.5,
      };
      const createdPlatformFee = await prisma.platformFee.create({
        data: mockPlatformFee,
      });

      const response = await request(app)
        .get(`/api/v1/platform-fees/${createdPlatformFee.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty(
        'message',
        'Platform fee retrieved successfully'
      );
      expect(response.body.data).toHaveProperty('id', createdPlatformFee.id);
      expect(response.body.data).toHaveProperty('tier_name', 'BASIC');
      expect(response.body.data).toHaveProperty('min_value', 0);
      expect(response.body.data).toHaveProperty('max_value', 1000);
    });

    it('should return 404 for non-existent platform fee', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

      const response = await request(app)
        .get(`/api/v1/platform-fees/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Platform fee not found');
    });
  });

  describe('PATCH /api/v1/platform-fees/:id', () => {
    it('should update a platform fee', async () => {
      const platformFee = await prisma.platformFee.create({
        data: {
          tier_name: 'BASIC' as TierName,
          min_value: 0,
          max_value: 1000,
          platform_fee_percentage: 5.5,
        },
      });

      const updates = {
        platform_fee_percentage: 6.5,
      };

      const response = await request(app)
        .patch(`/api/v1/platform-fees/${platformFee.id}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty(
        'message',
        'Platform fee updated successfully'
      );
      expect(response.body.data).toHaveProperty(
        'platform_fee_percentage',
        '6.5'
      );
    });

    it('should update multiple fields of a platform fee', async () => {
      const platformFee = await prisma.platformFee.create({
        data: {
          tier_name: 'STANDARD' as TierName,
          min_value: 1001,
          max_value: 5000,
          platform_fee_percentage: 7.5,
        },
      });

      const updates = {
        min_value: 1000,
        max_value: 6000,
        platform_fee_percentage: 8.0,
      };

      const response = await request(app)
        .patch(`/api/v1/platform-fees/${platformFee.id}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('min_value', 1000);
      expect(response.body.data).toHaveProperty('max_value', 6000);
      expect(response.body.data).toHaveProperty('platform_fee_percentage', '8');
    });

    it('should validate that max_value is greater than or equal to min_value on update', async () => {
      const platformFee = await prisma.platformFee.create({
        data: {
          tier_name: 'PREMIUM' as TierName,
          min_value: 5001,
          max_value: 10000,
          platform_fee_percentage: 10,
        },
      });

      const invalidUpdates = {
        min_value: 8000,
        max_value: 6000, // Invalid: less than min_value
      };

      const response = await request(app)
        .patch(`/api/v1/platform-fees/${platformFee.id}`)
        .send(invalidUpdates)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 404 when updating non-existent platform fee', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
      const updates = {
        platform_fee_percentage: 8.5,
      };

      const response = await request(app)
        .patch(`/api/v1/platform-fees/${nonExistentId}`)
        .send(updates)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Platform fee not found');
    });

    it('should validate platform_fee_percentage is between 0 and 100 on update', async () => {
      const platformFee = await prisma.platformFee.create({
        data: {
          tier_name: 'BASIC' as TierName,
          min_value: 0,
          max_value: 1000,
          platform_fee_percentage: 5.5,
        },
      });

      const invalidUpdates = {
        platform_fee_percentage: -5, // Invalid: negative value
      };

      const response = await request(app)
        .patch(`/api/v1/platform-fees/${platformFee.id}`)
        .send(invalidUpdates)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('DELETE /api/v1/platform-fees/:id', () => {
    it('should delete a platform fee', async () => {
      const platformFee = await prisma.platformFee.create({
        data: {
          tier_name: 'BASIC' as TierName,
          min_value: 0,
          max_value: 1000,
          platform_fee_percentage: 5.5,
        },
      });

      const response = await request(app)
        .delete(`/api/v1/platform-fees/${platformFee.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty(
        'message',
        'Platform fee deleted successfully'
      );
      expect(response.body.data).toHaveProperty('id', platformFee.id);

      // Verify the platform fee is actually deleted
      const deletedPlatformFee = await prisma.platformFee.findUnique({
        where: { id: platformFee.id },
      });
      expect(deletedPlatformFee).toBeNull();
    });

    it('should return 404 when deleting non-existent platform fee', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

      const response = await request(app)
        .delete(`/api/v1/platform-fees/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Platform fee not found');
    });
  });

  describe('Platform Fee Integration Tests', () => {
    it('should create, retrieve, update, and delete a platform fee in sequence', async () => {
      // Create
      const createResponse = await request(app)
        .post('/api/v1/platform-fees')
        .send({
          tier_name: 'BASIC',
          min_value: 0,
          max_value: 1000,
          platform_fee_percentage: 5.5,
        })
        .expect(201);

      const platformFeeId = createResponse.body.data.id;

      // Retrieve
      const getResponse = await request(app)
        .get(`/api/v1/platform-fees/${platformFeeId}`)
        .expect(200);
      expect(getResponse.body.data.tier_name).toBe('BASIC');

      // Update
      const updateResponse = await request(app)
        .patch(`/api/v1/platform-fees/${platformFeeId}`)
        .send({ platform_fee_percentage: 7.0 })
        .expect(200);
      expect(updateResponse.body.data.platform_fee_percentage).toBe('7');

      // Delete
      await request(app)
        .delete(`/api/v1/platform-fees/${platformFeeId}`)
        .expect(200);

      // Verify deletion
      await request(app)
        .get(`/api/v1/platform-fees/${platformFeeId}`)
        .expect(404);
    });

    it('should handle multiple platform fees with different tiers', async () => {
      const tiers = [
        {
          tier_name: 'BASIC' as TierName,
          min_value: 0,
          max_value: 1000,
          platform_fee_percentage: 5.5,
        },
        {
          tier_name: 'STANDARD' as TierName,
          min_value: 1001,
          max_value: 5000,
          platform_fee_percentage: 7.5,
        },
        {
          tier_name: 'PREMIUM' as TierName,
          min_value: 5001,
          max_value: 10000,
          platform_fee_percentage: 10.0,
        },
      ];

      // Create all tiers
      for (const tier of tiers) {
        await request(app).post('/api/v1/platform-fees').send(tier).expect(201);
      }

      // Get all and verify count
      const response = await request(app)
        .get('/api/v1/platform-fees')
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      const tierNames = response.body.data.map(
        (fee: PlatformFee) => fee.tier_name
      );
      expect(tierNames).toContain('BASIC');
      expect(tierNames).toContain('STANDARD');
      expect(tierNames).toContain('PREMIUM');
    });
  });
});
