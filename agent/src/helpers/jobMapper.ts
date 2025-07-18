import { ApiJobResponse, ServiceType, JobStatus } from './types';

interface SequelizeJob {
  id: string;
  name: string;
  serviceType: ServiceType;
  url?: string;
  method?: string;
  topic?: string;
  headers: Record<string, any>;
  body: Record<string, any>;
  scheduledAt?: Date;
  status: JobStatus;
  created_at: Date;
  completedAt?: Date;
  response?: Record<string, any>;
  errorMessage?: string;
}

// Map Sequelize job to API response
export function mapJobToApi(job: SequelizeJob): ApiJobResponse {
  return {
    id: job.id,
    name: job.name,
    serviceType: job.serviceType,
    url: job.url,
    method: job.method,
    topic: job.topic,
    headers: job.headers,
    body: job.body,
    scheduledAt: job.scheduledAt,
    status: job.status || JobStatus.PENDING,
    createdAt: job.created_at,
    completedAt: job.completedAt,
    response: job.response,
    errorMessage: job.errorMessage
  };
}