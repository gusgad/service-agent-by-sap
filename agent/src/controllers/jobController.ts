import { Request, Response, NextFunction } from 'express';
import { JobStatus, JobType, ServiceType, CreateJobRequest, JobResponse } from '../helpers/types';
import { Job, JobInstance } from '../db/init';
import { mapJobToApi } from '../helpers/jobMapper';
import { executeHttpJob, executeKafkaJob } from '../services/jobExecutor';

interface AuthenticatedRequest extends Request {
  tenant: string;
}

export const createJob = async (req: AuthenticatedRequest, res: Response<JobResponse | { error: string }>, next: NextFunction) => {
  try {
    const {
      name,
      serviceType,
      url,
      method,
      topic,
      headers = {},
      body = {},
      scheduledAt,
      immediate = false
    }: CreateJobRequest = req.body;
    
    // Basic input validation
    if (!name || name.trim() === '') {
      const error: any = new Error('Job name is required');
      error.status = 400;
      return next(error);
    }
    
    if (!serviceType) {
      const error: any = new Error('Service type is required');
      error.status = 400;
      return next(error);
    }
    
    if (serviceType === ServiceType.HTTP && (!url || !method)) {
      const error: any = new Error('URL and method are required for HTTP jobs');
      error.status = 400;
      return next(error);
    }
    
    if (serviceType === ServiceType.MESSAGING && !topic) {
      const error: any = new Error('Topic is required for messaging jobs');
      error.status = 400;
      return next(error);
    }
    
    const jobType = scheduledAt ? JobType.SCHEDULED : JobType.IMMEDIATE;
    
    // Validate scheduledAt is in the future if provided
    if (scheduledAt) {
      const scheduledDate = new Date(scheduledAt);
      const now = new Date(Date.now());
      if (scheduledDate <= now) {
        const error: any = new Error('Scheduled time must be in the future');
        error.status = 400;
        return next(error);
      }
    }

    const job = await Job.create({
      tenantId: req.tenant,
      name,
      serviceType,
      url,
      method,
      topic,
      headers,
      body,
      jobType,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined
    });

    // For immediate execution
    if (jobType === JobType.IMMEDIATE) {      
      if (serviceType === ServiceType.HTTP) {
        await executeHttpJob(job);
      } else if (serviceType === ServiceType.MESSAGING) {
        executeKafkaJob(job);
      } else {
        await executeJob(job);
      }
      
      // If immediate flag is set, return the response data
      if (immediate) {
        await job.reload();
        return res.json({
          jobId: job.id,
          status: job.status,
          response: job.response,
          responseHeaders: job.responseHeaders
        });
      }
    }

    // Default response for non-immediate or scheduled jobs
    return res.json({ jobId: job.id, status: 'submitted' });
  } catch (error) {
    next(error);
  }
};

export const getJobs = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.query) req.query = {};
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    const { count, rows } = await Job.findAndCountAll({
      where: { tenantId: req.tenant },
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
    
    res.json({
      jobs: rows.map(job => mapJobToApi(job)),
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getJobById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const job = await Job.findOne({
      where: {
        id: req.params.id,
        tenantId: req.tenant
      }
    });

    if (!job) {
      const error: any = new Error('Job not found');
      error.status = 404;
      return next(error);
    }

    res.json(mapJobToApi(job));
  } catch (error) {
    next(error);
  }
};

export async function executeJob(job: JobInstance): Promise<void> {
  try {
    await job.update({ status: JobStatus.IN_PROGRESS });

    if (job.serviceType === ServiceType.HTTP) {
      await executeHttpJob(job);
    } else if (job.serviceType === ServiceType.MESSAGING) {
      await executeKafkaJob(job);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await job.update({
      status: JobStatus.FAILED,
      errorMessage,
      completedAt: new Date()
    });
  }
}