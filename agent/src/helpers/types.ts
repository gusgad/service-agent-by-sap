export enum JobStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum JobType {
  IMMEDIATE = 'immediate',
  SCHEDULED = 'scheduled'
}

export enum ServiceType {
  HTTP = 'http',
  MESSAGING = 'messaging'
}

export interface JobData {
  id?: string;
  tenantId: string;
  name: string;
  serviceType: ServiceType;
  url?: string;
  method?: string;
  topic?: string;
  headers: Record<string, any>;
  body: Record<string, any>;
  jobType: JobType;
  status: JobStatus;
  scheduledAt?: Date;
  completedAt?: Date;
  response?: Record<string, any>;
  responseHeaders?: Record<string, any>;
  errorMessage?: string;
  createdAt?: Date;
}

export interface CreateJobRequest {
  name: string;
  serviceType: ServiceType;
  url?: string;
  method?: string;
  topic?: string;
  headers?: Record<string, any>;
  body?: Record<string, any>;
  scheduledAt?: string;
  immediate?: boolean;
}

export interface JobResponse {
  jobId: string;
  status: string;
  response?: Record<string, any>;
  responseHeaders?: Record<string, any>;
}

export interface ApiJobResponse {
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
  createdAt: Date;
  completedAt?: Date;
  response?: Record<string, any>;
  responseHeaders?: Record<string, any>;
  errorMessage?: string;
}