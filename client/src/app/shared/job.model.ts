export enum ServiceType {
  HTTP = 'http',
  MESSAGING = 'messaging'
}

export enum ExecutionType {
  IMMEDIATE = 'immediate',
  SCHEDULED = 'scheduled'
}
export type JobStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE'
}

export interface HeaderRow {
  key: string;
  value: string;
}

export interface JobRequest {
  name: string;
  serviceType: ServiceType;
  url?: string;
  method?: HttpMethod;
  topic?: string;
  headers: Record<string, string>;
  body: any;
  scheduledAt?: string;
  immediate?: boolean;
}

export interface JobResponse {
  jobId: string;
  status: JobStatus;
  response?: any;
  responseHeaders?: Record<string, string>;
}

export interface Job {
  id?: string;
  name: string;
  serviceType: ServiceType;
  url?: string;
  method?: HttpMethod;
  topic?: string;
  headers: Record<string, string>;
  body: any;
  scheduledAt?: string;
  status?: JobStatus;
  createdAt?: string;
  completedAt?: string;
  response?: any;
  responseHeaders?: Record<string, string>;
  errorMessage?: string;
  immediate?: boolean;
}

export interface JobPagination {
  total: number;
  pages: number;
  page: number;
  limit: number;
}

export interface JobsResponse {
  jobs: Job[];
  pagination: JobPagination;
}