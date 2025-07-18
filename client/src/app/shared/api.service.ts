import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { Job, JobRequest, JobResponse, JobsResponse } from './job.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:3000/api';
  private tenantId = 'default';

  constructor(private http: HttpClient, private route: ActivatedRoute) {
    // Check for tenantId in URL query parameters
    this.route.queryParams.subscribe(params => {
      if (params['tenantId']) {
        this.tenantId = params['tenantId'];
      }
    });
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Tenant-ID': this.tenantId
    });
  }

  createJob(job: Partial<JobRequest>): Observable<JobResponse> {
    const jobData: Partial<JobRequest> = { ...job };
    if (job.scheduledAt === undefined) {
      jobData.immediate = true;
    }
    return this.http.post<JobResponse>(`${this.baseUrl}/jobs`, jobData, { headers: this.getHeaders() });
  }

  getJobs(page: number = 1, limit: number = 10): Observable<JobsResponse> {
    return this.http.get<JobsResponse>(
      `${this.baseUrl}/jobs?page=${page}&limit=${limit}`, 
      { headers: this.getHeaders() }
    );
  }

  getJob(id: string): Observable<Job> {
    return this.http.get<Job>(`${this.baseUrl}/jobs/${id}`, { headers: this.getHeaders() });
  }
}