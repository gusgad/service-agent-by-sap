import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { RequestComponent } from './request.component';
import { ApiService } from '../shared/api.service';
import { HelperService } from '../shared/helper.service';
import { HttpMethod, ServiceType, ExecutionType, JobStatus, JobRequest } from '../shared/job.model';

describe('RequestComponent', () => {
  let component: RequestComponent;
  let fixture: ComponentFixture<RequestComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockHelperService: jasmine.SpyObj<HelperService>;

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['createJob']);
    const helperSpy = jasmine.createSpyObj('HelperService', ['formatDateTimeWithTimezone']);

    await TestBed.configureTestingModule({
      imports: [RequestComponent, FormsModule],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: HelperService, useValue: helperSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RequestComponent);
    component = fixture.componentInstance;
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    mockHelperService = TestBed.inject(HelperService) as jasmine.SpyObj<HelperService>;
    mockHelperService.formatDateTimeWithTimezone.and.returnValue('2023-01-01T12:00:00Z');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.request.serviceType).toBe(ServiceType.HTTP);
    expect(component.request.name).toBe('');
    expect(component.bodyText).toBe('{}');
    expect(component.headerRows.length).toBe(3);
  });

  it('should submit HTTP job successfully', () => {
    const mockResponse = { jobId: '123', status: 'pending' as JobStatus };
    mockApiService.createJob.and.returnValue(of(mockResponse));

    component.request = {
      name: 'Test Job',
      serviceType: ServiceType.HTTP,
      url: 'https://api.test.com',
      method: HttpMethod.GET,
      topic: '',
      executionType: ExecutionType.IMMEDIATE,
      scheduledDate: '',
      scheduledHours: '12',
      scheduledMinutes: '00',
      scheduledSeconds: '00'
    };

    component.onSubmit();

    expect(mockApiService.createJob).toHaveBeenCalled();
    expect(component.result?.success).toBe(true);
    expect(component.result?.message).toContain('successfully');
  });

  it('should handle API error', () => {
    const mockError = { error: { error: 'Server error' } };
    mockApiService.createJob.and.returnValue(throwError(() => mockError));

    component.request.name = 'Test Job';
    component.onSubmit();

    expect(component.result?.success).toBe(false);
    expect(component.result?.message).toContain('Error: Server error');
  });

  it('should process body correctly', () => {
    // Test with valid JSON
    component.bodyText = '{"key": "value"}';
    
    // Bypass the HTTP method check that might return empty object
    component.request.serviceType = ServiceType.MESSAGING;
    
    const result = component['processBody']();
    expect(result).toEqual({key: 'value'});
    
    // Test with invalid JSON
    component.bodyText = 'invalid json';
    const fallbackResult = component['processBody']();
    expect(fallbackResult).toEqual({data: 'invalid json'});
  });
  
  it('should process headers correctly', () => {
    component.headerRows = [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'Authorization', value: 'Bearer token' },
      { key: '', value: '' }
    ];
    
    const headers = component['processHeaders']();
    expect(headers).toEqual({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer token'
    });
  });
  
  it('should create base job data correctly', () => {
    component.request.name = 'Test Job';
    component.bodyText = '{"test": true}';
    component.headerRows = [{ key: 'Content-Type', value: 'application/json' }];
    
    spyOn<any>(component, 'processBody').and.returnValue({test: true});
    
    const jobData = component['createBaseJobData']();
    
    expect(jobData.name).toBe('Test Job');
    expect(jobData.serviceType).toBe(ServiceType.HTTP);
    expect(jobData.body).toEqual({test: true});
    expect(jobData.headers).toEqual({'Content-Type': 'application/json'});
  });
  
  it('should add HTTP-specific fields', () => {
    component.request = {
      name: 'Test Job',
      serviceType: ServiceType.HTTP,
      url: 'https://api.test.com',
      method: HttpMethod.POST,
      topic: '',
      executionType: ExecutionType.IMMEDIATE,
      scheduledDate: '',
      scheduledHours: '12',
      scheduledMinutes: '00',
      scheduledSeconds: '00'
    };
    
    const jobData: Partial<any> = {};
    component['addServiceSpecificFields'](jobData);
    
    expect(jobData['url']).toBe('https://api.test.com');
    expect(jobData['method']).toBe(HttpMethod.POST);
    expect(jobData['topic']).toBeUndefined();
  });
  
  it('should add messaging-specific fields', () => {
    component.request = {
      name: 'Test Job',
      serviceType: ServiceType.MESSAGING,
      url: '',
      method: HttpMethod.POST,
      topic: 'test-topic',
      executionType: ExecutionType.IMMEDIATE,
      scheduledDate: '',
      scheduledHours: '12',
      scheduledMinutes: '00',
      scheduledSeconds: '00'
    };
    
    const jobData: Partial<any> = {};
    component['addServiceSpecificFields'](jobData);
    
    expect(jobData['topic']).toBe('test-topic');
    expect(jobData['url']).toBeUndefined();
    expect(jobData['method']).toBeUndefined();
  });
  
  it('should add scheduling information when needed', () => {
    component.request = {
      name: 'Scheduled Job',
      serviceType: ServiceType.HTTP,
      url: 'https://api.test.com',
      method: HttpMethod.POST,
      topic: '',
      executionType: ExecutionType.SCHEDULED,
      scheduledDate: '2023-01-01',
      scheduledHours: '12',
      scheduledMinutes: '30',
      scheduledSeconds: '00'
    };
    
    const jobData: Partial<any> = {};
    component['addSchedulingIfNeeded'](jobData);
    
    expect(jobData['scheduledAt']).toBe('2023-01-01T12:00:00Z'); // From mock
    expect(mockHelperService.formatDateTimeWithTimezone).toHaveBeenCalled();
  });
  
  it('should not add scheduling for immediate jobs', () => {
    component.request = {
      name: 'Immediate Job',
      serviceType: ServiceType.HTTP,
      url: 'https://api.test.com',
      method: HttpMethod.POST,
      topic: '',
      executionType: ExecutionType.IMMEDIATE,
      scheduledDate: '',
      scheduledHours: '12',
      scheduledMinutes: '30',
      scheduledSeconds: '00'
    };
    
    const jobData: Partial<any> = {};
    component['addSchedulingIfNeeded'](jobData);
    
    expect(jobData['scheduledAt']).toBeUndefined();
    expect(mockHelperService.formatDateTimeWithTimezone).not.toHaveBeenCalled();
  });
  
  it('should create complete job data by combining all parts', () => {
    spyOn<any>(component, 'createBaseJobData').and.returnValue({
      name: 'Test Job',
      serviceType: ServiceType.HTTP,
      headers: {'Content-Type': 'application/json'},
      body: {test: true}
    });
    
    spyOn<any>(component, 'addServiceSpecificFields').and.callFake((data: Partial<JobRequest>) => {
      data.url = 'https://api.test.com';
      data.method = HttpMethod.POST;
    });
    
    spyOn<any>(component, 'addSchedulingIfNeeded').and.callFake((data: Partial<JobRequest>) => {
      data.scheduledAt = '2023-01-01T12:00:00Z';
    });
    
    const jobData = component['createJobData']();
    
    expect(component['createBaseJobData']).toHaveBeenCalled();
    expect(component['addServiceSpecificFields']).toHaveBeenCalled();
    expect(component['addSchedulingIfNeeded']).toHaveBeenCalled();
    
    expect(jobData.name).toBe('Test Job');
    expect(jobData.serviceType).toBe(ServiceType.HTTP);
    expect(jobData.url).toBe('https://api.test.com');
    expect(jobData.method).toBe(HttpMethod.POST);
    expect(jobData.scheduledAt).toBe('2023-01-01T12:00:00Z');
  });
  
  it('should process response correctly', () => {
    const mockResponse = {
      jobId: '123',
      status: 'pending' as JobStatus,
      response: { result: 'success' },
      responseHeaders: { 'Content-Type': 'application/json' }
    };
    
    component['handleSuccess'](mockResponse);
    
    expect(component.responseData).toBe(mockResponse);
    expect(component.responseBodyText).toContain('success');
    expect(component.responseHeaders.length).toBe(1);
    expect(component.responseHeaders[0].key).toBe('Content-Type');
    expect(component.loading).toBe(false);
  });
});