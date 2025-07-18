import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { Job, JobStatus, JobResponse, JobsResponse } from './job.model';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApiService,
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({})
          }
        }
      ]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create a job', () => {
    const mockJob: Partial<Job> = {
      name: 'Test Job',
      serviceType: 'http' as any,
      url: 'https://api.test.com',
      method: 'GET' as any
    };

    const mockResponse: JobResponse = { jobId: '123', status: 'pending' as JobStatus };

    service.createJob(mockJob).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/jobs');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('X-Tenant-ID')).toBe('default');
    req.flush(mockResponse);
  });

  it('should get jobs with tenant header', () => {
    const mockJobsResponse: JobsResponse = {
      jobs: [
      {
        id: '1',
        name: 'Test Job',
        serviceType: 'http' as any,
        url: 'https://api.test.com',
        method: 'GET' as any,
        headers: {},
        body: {},
        status: 'completed' as JobStatus
      }
      ],
      pagination: {
        total: 1,
        pages: 1,
        page: 1,
        limit: 10
      }
    };

    service.getJobs().subscribe(response => {
      expect(response).toEqual(mockJobsResponse);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/jobs?page=1&limit=10');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('X-Tenant-ID')).toBe('default');
    req.flush(mockJobsResponse);
  });
});