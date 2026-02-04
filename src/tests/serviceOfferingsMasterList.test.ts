import request from 'supertest';
import { app } from '../app';
import { prisma } from '../config/prisma';
import { StatusCodes } from 'http-status-codes';

describe('ServiceOfferingsMasterList Routes', () => {
  beforeEach(async () => {
    // Clean up the database before each test
    await prisma.serviceOfferingMasterList.deleteMany();
  });

  afterAll(async () => {
    // Disconnect Prisma after all tests
    // clear the database
    await prisma.serviceOfferingMasterList.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /api/v1/service-offerings-master-list', () => {
    it('should create a service offering master list successfully without file', async () => {
      const newServiceOffering = {
        title: 'Test Service',
        description: 'Test Description',
      };

      const response = await request(app)
        .post('/api/v1/service-offerings-master-list')
        .send(newServiceOffering)
        .expect(StatusCodes.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        'Service offering master list created successfully'
      );
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('title', 'Test Service');
      expect(response.body.data).toHaveProperty(
        'description',
        'Test Description'
      );
      expect(response.body.data).toHaveProperty('s3_key', null);
      expect(response.body.data).toHaveProperty(
        'bucket_name',
        'service-offerings'
      );
    });

    // File upload test skipped - requires Cloudinary configuration
    it.skip('should create a service offering master list successfully with file', async () => {
      const response = await request(app)
        .post('/api/v1/service-offerings-master-list')
        .field('title', 'Test Service With File')
        .field('description', 'Test Description')
        .attach('file', Buffer.from('test file content'), 'test.jpg')
        .expect(StatusCodes.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        'Service offering master list created successfully'
      );
      expect(response.body.data).toHaveProperty(
        'title',
        'Test Service With File'
      );
      expect(response.body.data).toHaveProperty('s3_key');
      expect(response.body.data).toHaveProperty(
        'bucket_name',
        'service-offerings'
      );
    });

    it('should return validation error for missing title', async () => {
      const response = await request(app)
        .post('/api/v1/service-offerings-master-list')
        .send({
          description: 'Test Description',
        })
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid input');
    });

    it('should validate title length', async () => {
      const longTitle = 'A'.repeat(256); // Exceeds max length of 255

      const response = await request(app)
        .post('/api/v1/service-offerings-master-list')
        .send({
          title: longTitle,
          description: 'Test Description',
        })
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });

    it('should validate all required fields are provided', async () => {
      const response = await request(app)
        .post('/api/v1/service-offerings-master-list')
        .send({
          description: 'Test Description without title',
        })
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/service-offerings-master-list', () => {
    it('should get all service offering master lists successfully', async () => {
      const mockServiceOfferings = [
        {
          title: 'Test Service 1',
          description: 'Test Description 1',
          bucket_name: 'service-offerings',
        },
        {
          title: 'Test Service 2',
          description: 'Test Description 2',
          bucket_name: 'service-offerings',
        },
        {
          title: 'Test Service 3',
          description: 'Test Description 3',
          bucket_name: 'service-offerings',
        },
      ];

      // Seed data directly into the database
      await prisma.serviceOfferingMasterList.createMany({
        data: mockServiceOfferings,
      });

      const response = await request(app)
        .get('/api/v1/service-offerings-master-list')
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        'Service offering master lists retrieved successfully'
      );
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0]).toHaveProperty('title');
      expect(response.body.data[0]).toHaveProperty('description');
      expect(response.body.data[0]).toHaveProperty('created_at');
      expect(response.body.data[0]).toHaveProperty('updated_at');
    });

    it('should return an empty array when no service offerings exist', async () => {
      const response = await request(app)
        .get('/api/v1/service-offerings-master-list')
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /api/v1/service-offerings-master-list/:id', () => {
    it('should get a service offering master list by id successfully', async () => {
      // Create a service offering first
      const serviceOffering = await prisma.serviceOfferingMasterList.create({
        data: {
          title: 'Test Service',
          description: 'Test Description',
          bucket_name: 'service-offerings',
        },
      });

      const response = await request(app)
        .get(`/api/v1/service-offerings-master-list/${serviceOffering.id}`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        'Service offering master list retrieved successfully'
      );
      expect(response.body.data).toHaveProperty('id', serviceOffering.id);
      expect(response.body.data).toHaveProperty('title', 'Test Service');
      expect(response.body.data).toHaveProperty(
        'description',
        'Test Description'
      );
    });

    it('should return not found error for non-existent id', async () => {
      const response = await request(app)
        .get(
          '/api/v1/service-offerings-master-list/550e8400-e29b-41d4-a716-446655440000'
        )
        .expect(StatusCodes.NOT_FOUND);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        'Service offering master list not found'
      );
    });

    it('should return error for invalid uuid', async () => {
      const response = await request(app)
        .get('/api/v1/service-offerings-master-list/invalid-uuid')
        .expect(StatusCodes.INTERNAL_SERVER_ERROR);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/service-offerings-master-list/:id', () => {
    it('should update a service offering master list successfully', async () => {
      // Create a service offering first
      const serviceOffering = await prisma.serviceOfferingMasterList.create({
        data: {
          title: 'Old Title',
          description: 'Old Description',
          bucket_name: 'service-offerings',
        },
      });

      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description',
      };

      const response = await request(app)
        .patch(`/api/v1/service-offerings-master-list/${serviceOffering.id}`)
        .send(updateData)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        'Service offering master list updated successfully'
      );
      expect(response.body.data).toHaveProperty('title', 'Updated Title');
      expect(response.body.data).toHaveProperty(
        'description',
        'Updated Description'
      );
    });

    it('should update only the title when description is not provided', async () => {
      // Create a service offering first
      const serviceOffering = await prisma.serviceOfferingMasterList.create({
        data: {
          title: 'Old Title',
          description: 'Old Description',
          bucket_name: 'service-offerings',
        },
      });

      const updateData = {
        title: 'New Title Only',
      };

      const response = await request(app)
        .patch(`/api/v1/service-offerings-master-list/${serviceOffering.id}`)
        .send(updateData)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('title', 'New Title Only');
      expect(response.body.data).toHaveProperty(
        'description',
        'Old Description'
      );
    });

    // File upload test skipped - requires Cloudinary configuration
    it.skip('should update with file upload', async () => {
      // Create a service offering first
      const serviceOffering = await prisma.serviceOfferingMasterList.create({
        data: {
          title: 'Old Title',
          description: 'Old Description',
          bucket_name: 'service-offerings',
        },
      });

      const response = await request(app)
        .patch(`/api/v1/service-offerings-master-list/${serviceOffering.id}`)
        .field('title', 'Updated Title')
        .attach('file', Buffer.from('new test file content'), 'new-test.jpg')
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('title', 'Updated Title');
      expect(response.body.data).toHaveProperty('s3_key');
      expect(response.body.data).toHaveProperty(
        'bucket_name',
        'service-offerings'
      );
    });

    it('should return not found error for non-existent id during update', async () => {
      const response = await request(app)
        .patch(
          '/api/v1/service-offerings-master-list/550e8400-e29b-41d4-a716-446655440000'
        )
        .send({
          title: 'Updated Title',
        })
        .expect(StatusCodes.NOT_FOUND);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        'Service offering master list not found'
      );
    });

    it('should validate title length during update', async () => {
      // Create a service offering first
      const serviceOffering = await prisma.serviceOfferingMasterList.create({
        data: {
          title: 'Valid Title',
          description: 'Valid Description',
          bucket_name: 'service-offerings',
        },
      });

      const longTitle = 'A'.repeat(256); // Exceeds max length of 255

      const response = await request(app)
        .patch(`/api/v1/service-offerings-master-list/${serviceOffering.id}`)
        .send({
          title: longTitle,
        })
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/service-offerings-master-list/:id', () => {
    it('should delete a service offering master list successfully', async () => {
      // Create a service offering first
      const serviceOffering = await prisma.serviceOfferingMasterList.create({
        data: {
          title: 'Test Service',
          description: 'Test Description',
          bucket_name: 'service-offerings',
        },
      });

      const response = await request(app)
        .delete(`/api/v1/service-offerings-master-list/${serviceOffering.id}`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        'Service offering master list deleted successfully'
      );
      expect(response.body.data).toHaveProperty('id', serviceOffering.id);

      // Verify it's actually deleted
      const deletedOffering = await prisma.serviceOfferingMasterList.findUnique(
        {
          where: { id: serviceOffering.id },
        }
      );
      expect(deletedOffering).toBeNull();
    });

    it('should delete a service offering with file successfully', async () => {
      // Create a service offering with file data
      const serviceOffering = await prisma.serviceOfferingMasterList.create({
        data: {
          title: 'Test Service With File',
          description: 'Test Description',
          s3_key: 'service-offerings/test-file',
          bucket_name: 'service-offerings',
        },
      });

      const response = await request(app)
        .delete(`/api/v1/service-offerings-master-list/${serviceOffering.id}`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        'Service offering master list deleted successfully'
      );
      expect(response.body.data).toHaveProperty('id', serviceOffering.id);
    });

    it('should return not found error for non-existent id during delete', async () => {
      const response = await request(app)
        .delete(
          '/api/v1/service-offerings-master-list/550e8400-e29b-41d4-a716-446655440000'
        )
        .expect(StatusCodes.NOT_FOUND);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        'Service offering master list not found'
      );
    });

    it('should return error for invalid uuid during delete', async () => {
      const response = await request(app)
        .delete('/api/v1/service-offerings-master-list/invalid-uuid')
        .expect(StatusCodes.INTERNAL_SERVER_ERROR);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string title validation', async () => {
      const response = await request(app)
        .post('/api/v1/service-offerings-master-list')
        .send({
          title: '',
          description: 'Test Description',
        })
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });

    it('should handle very long descriptions', async () => {
      const longDescription = 'A'.repeat(10000); // Very long description

      const response = await request(app)
        .post('/api/v1/service-offerings-master-list')
        .send({
          title: 'Valid Title',
          description: longDescription,
        })
        .expect(StatusCodes.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('description', longDescription);
    });

    it('should handle missing description (optional field)', async () => {
      const response = await request(app)
        .post('/api/v1/service-offerings-master-list')
        .send({
          title: 'Title Only',
        })
        .expect(StatusCodes.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('title', 'Title Only');
      expect(response.body.data).toHaveProperty('description', null);
    });
  });
});
