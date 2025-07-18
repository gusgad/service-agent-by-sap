import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { StatusComponent } from './status.component';
import { ApiService } from '../shared/api.service';
import { HttpMethod, Job, JobsResponse } from '../shared/job.model';

describe('StatusComponent', () => {
  let component: StatusComponent;
  let fixture: ComponentFixture<StatusComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const mockJobs: Job[] = [
    {
      id: '1',
      name: 'Test Job 1',
      serviceType: 'http' as any,
      url: 'https://api.test.com',
      method: 'GET' as HttpMethod,
      headers: {},
      body: {},
      status: 'completed',
      createdAt: '2024-01-01T10:00:00Z'
    },
    {
      id: '2',
      name: 'Test Job 2',
      serviceType: 'messaging' as any,
      topic: 'test-topic',
      headers: {},
      body: {},
      status: 'pending',
      createdAt: '2024-01-01T11:00:00Z'
    }
  ];

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', ['getJobs']);

    await TestBed.configureTestingModule({
      imports: [StatusComponent, FormsModule],
      providers: [
        { provide: ApiService, useValue: spy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StatusComponent);
    component = fixture.componentInstance;
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load jobs on init', () => {
    const mockJobsResponse: JobsResponse = {
      jobs: mockJobs,
      pagination: {
        total: 2,
        pages: 1,
        page: 1,
        limit: 10
      }
    };
    mockApiService.getJobs.and.returnValue(of(mockJobsResponse));
    
    component.ngOnInit();
    
    expect(mockApiService.getJobs).toHaveBeenCalled();
    expect(component.jobs).toEqual(mockJobsResponse.jobs);
    expect(component.filteredJobs).toEqual(mockJobsResponse.jobs);
  });

  it('should filter jobs by search text', () => {
    component.jobs = mockJobs;
    component.searchText = 'messaging';
    
    component.filterJobs();
    
    expect(component.filteredJobs.length).toBe(1);
    expect(component.filteredJobs[0].serviceType).toBe('messaging');
  });

  it('should toggle favorites', () => {
    const jobId = '1';
    
    component.toggleFavorite(jobId);
    expect(component.isFavorite(jobId)).toBe(true);
    
    component.toggleFavorite(jobId);
    expect(component.isFavorite(jobId)).toBe(false);
  });

  it('should show job details', () => {
    const job = mockJobs[0];
    
    component.showJobDetails(job);
    
    expect(component.selectedJob).toBe(job);
    expect(component.showDetails).toBe(true);
  });

  it('should close details', () => {
    component.selectedJob = mockJobs[0];
    component.showDetails = true;
    
    component.closeDetails();
    
    expect(component.showDetails).toBe(false);
  });
});