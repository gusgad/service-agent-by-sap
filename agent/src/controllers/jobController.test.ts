import { Request, Response, NextFunction } from 'express';
import { createJob, getJobs, getJobById } from './jobController';
import { Job } from '../db/init';
import { JobStatus, JobType, ServiceType } from '../helpers/types';

// Mock dependencies
jest.mock('../db/init');
jest.mock('../services/jobExecutor');

const mockJob = Job as jest.Mocked<typeof Job>;

interface AuthenticatedRequest extends Request {
  tenant: string;
}

describe('JobController', () => {
  let req: Partial<AuthenticatedRequest>;
  let res: Partial<Response>;
  let next: jest.Mock;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let originalDateNow: () => number;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    next = jest.fn();
    
    req = {
      tenant: 'test-tenant',
      body: {},
      params: {},
      query: {}
    };
    
    res = {
      json: mockJson,
      status: mockStatus
    };

    originalDateNow = Date.now;
    Date.now = jest.fn(() => new Date('2023-01-01').getTime());

    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original Date.now
    Date.now = originalDateNow;
  });

  describe('createJob', () => {
    it('should create an immediate HTTP job', async () => {
      const jobData = {
        name: 'Test HTTP Job',
        serviceType: ServiceType.HTTP,
        url: 'https://api.test.com',
        method: 'GET',
        headers: {},
        body: {}
      };

      const mockCreatedJob = {
        id: 'test-job-id',
        ...jobData,
        tenantId: 'test-tenant',
        jobType: JobType.IMMEDIATE,
        status: JobStatus.PENDING,
        update: jest.fn()
      };

      req.body = jobData;
      mockJob.create.mockResolvedValue(mockCreatedJob as any);

      await createJob(req as AuthenticatedRequest, res as Response, next as NextFunction);

      expect(mockJob.create).toHaveBeenCalledWith({
        tenantId: 'test-tenant',
        name: 'Test HTTP Job',
        serviceType: ServiceType.HTTP,
        url: 'https://api.test.com',
        method: 'GET',
        topic: undefined,
        headers: {},
        body: {},
        jobType: JobType.IMMEDIATE,
        scheduledAt: undefined
      });

      expect(mockJson).toHaveBeenCalledWith({
        jobId: 'test-job-id',
        status: 'submitted'
      });
    });

    it('should create a scheduled messaging job', async () => {
      const jobData = {
        name: 'Test Messaging Job',
        serviceType: ServiceType.MESSAGING,
        topic: 'test-topic',
        headers: { source: 'test' },
        body: { message: 'hello' },
        scheduledAt: '2024-12-31T23:59:59Z'
      };

      const mockCreatedJob = {
        id: 'test-messaging-job-id',
        ...jobData,
        tenantId: 'test-tenant',
        jobType: JobType.SCHEDULED,
        status: JobStatus.PENDING,
        update: jest.fn()
      };

      req.body = jobData;
      
      // Use mockImplementation to capture the actual data passed to create
      mockJob.create.mockImplementation(() => {
        return Promise.resolve(mockCreatedJob as any);
      });

      await createJob(req as AuthenticatedRequest, res as Response, next as NextFunction);

      expect(mockJob.create).toHaveBeenCalledWith({
        tenantId: 'test-tenant',
        name: 'Test Messaging Job',
        serviceType: ServiceType.MESSAGING,
        url: undefined,
        method: undefined,
        topic: 'test-topic',
        headers: { source: 'test' },
        body: { message: 'hello' },
        jobType: JobType.SCHEDULED,
        scheduledAt: new Date('2024-12-31T23:59:59Z')
      });

      expect(mockJson).toHaveBeenCalledWith({
        jobId: 'test-messaging-job-id',
        status: 'submitted'
      });
    });

    it('should handle creation errors', async () => {
      req.body = {
        name: 'Test Job',
        serviceType: ServiceType.HTTP,
        url: 'https://api.test.com',
        method: 'GET'
      };

      const testError = new Error('Database connection failed');
      mockJob.create.mockRejectedValue(testError);

      await createJob(req as AuthenticatedRequest, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith(testError);
    });
  });

  describe('getJobs', () => {
    it('should return jobs for tenant', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          name: 'Job 1',
          serviceType: ServiceType.HTTP,
          status: JobStatus.COMPLETED,
          created_at: new Date('2024-01-01'),
          headers: {},
          body: {}
        },
        {
          id: 'job-2',
          name: 'Job 2',
          serviceType: ServiceType.MESSAGING,
          status: JobStatus.PENDING,
          created_at: new Date('2024-01-02'),
          headers: {},
          body: {}
        }
      ];

      mockJob.findAndCountAll.mockResolvedValue({ count: 2, rows: mockJobs } as any);

      await getJobs(req as AuthenticatedRequest, res as Response, next as NextFunction);

      expect(mockJob.findAndCountAll).toHaveBeenCalledWith({
        where: { tenantId: 'test-tenant' },
        order: [['created_at', 'DESC']],
        limit: 10,
        offset: 0
      });

      expect(mockJson).toHaveBeenCalledWith({
        jobs: expect.any(Array),
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          pages: 1
        }
      });
    });

    it('should handle database errors', async () => {
      const testError = new Error('Database error');
      mockJob.findAndCountAll.mockRejectedValue(testError);

      await getJobs(req as AuthenticatedRequest, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith(testError);
    });
  });

  describe('getJobById', () => {
    it('should return specific job', async () => {
      const mockJobData = {
        id: 'specific-job-id',
        name: 'Specific Job',
        serviceType: ServiceType.HTTP,
        status: JobStatus.COMPLETED,
        created_at: new Date('2024-01-01'),
        headers: {},
        body: {}
      };

      req.params = { id: 'specific-job-id' };
      mockJob.findOne.mockResolvedValue(mockJobData as any);

      await getJobById(req as AuthenticatedRequest, res as Response, next as NextFunction);

      expect(mockJob.findOne).toHaveBeenCalledWith({
        where: {
          id: 'specific-job-id',
          tenantId: 'test-tenant'
        }
      });

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'specific-job-id',
          name: 'Specific Job',
          serviceType: ServiceType.HTTP,
          status: JobStatus.COMPLETED
        })
      );
    });

    it('should handle not found job', async () => {
      req.params = { id: 'non-existent-id' };
      mockJob.findOne.mockResolvedValue(null);

      await getJobById(req as AuthenticatedRequest, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Job not found',
        status: 404
      }));
    });

    it('should handle database errors', async () => {
      req.params = { id: 'some-id' };
      const testError = new Error('Database error');
      mockJob.findOne.mockRejectedValue(testError);

      await getJobById(req as AuthenticatedRequest, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith(testError);
    });
  });
});