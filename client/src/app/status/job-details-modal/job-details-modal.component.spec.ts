import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JobDetailsModalComponent } from './job-details-modal.component';
import { Job, ServiceType } from '../../shared/job.model';

describe('JobDetailsModalComponent', () => {
  let component: JobDetailsModalComponent;
  let fixture: ComponentFixture<JobDetailsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobDetailsModalComponent]
    }).compileComponents();
    
    fixture = TestBed.createComponent(JobDetailsModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not display when visible is false', () => {
    component.visible = false;
    component.job = { 
      id: '1', 
      name: 'Test Job',
      serviceType: ServiceType.HTTP,
      body: {},
      headers: {}
    };
    fixture.detectChanges();
    
    const modalElement = fixture.nativeElement.querySelector('.modal-overlay');
    expect(modalElement).toBeNull();
  });

  it('should display when visible is true and job is provided', () => {
    component.visible = true;
    component.job = { 
      id: '1', 
      name: 'Test Job',
      serviceType: ServiceType.HTTP,
      status: 'completed',
      createdAt: new Date().toISOString(),
      body: { test: 'data' },
      headers: { 'Content-Type': 'application/json' }
    };
    fixture.detectChanges();
    
    const modalElement = fixture.nativeElement.querySelector('.modal-overlay');
    expect(modalElement).toBeTruthy();
  });

  it('should emit close event when close button is clicked', () => {
    spyOn(component.close, 'emit');
    component.visible = true;
    component.job = { 
      id: '1', 
      name: 'Test Job',
      serviceType: ServiceType.HTTP,
      body: {},
      headers: {}
    };
    fixture.detectChanges();
    
    const closeButton = fixture.nativeElement.querySelector('.close-btn');
    closeButton.click();
    
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should process request body correctly', () => {
    component.job = { 
      name: 'Test Job',
      serviceType: ServiceType.HTTP,
      body: { test: 'data' },
      headers: {}
    };
    
    component['processRequestBody']();
    
    expect(component.requestBodyText).toContain('test');
    expect(component.requestBodyText).toContain('data');
  });
  
  it('should handle invalid request body', () => {
    const circularObj: any = {};
    circularObj.self = circularObj; // Create circular reference
    
    component.job = { 
      name: 'Test Job',
      serviceType: ServiceType.HTTP,
      body: circularObj,
      headers: {}
    };
    
    component['processRequestBody']();
    
    expect(component.requestBodyText).toBeTruthy();
    // Just verify it doesn't throw an error
  });
  
  it('should process request headers correctly', () => {
    component.job = { 
      name: 'Test Job',
      serviceType: ServiceType.HTTP,
      body: {},
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token'
      }
    } as Job;
    
    component['processRequestHeaders']();
    
    expect(component.requestHeaders.length).toBe(2);
    expect(component.requestHeaders[0].key).toBe('Content-Type');
    expect(component.requestHeaders[0].value).toBe('application/json');
    expect(component.requestHeaders[1].key).toBe('Authorization');
    expect(component.requestHeaders[1].value).toBe('Bearer token');
  });
  
  it('should process response body correctly', () => {
    component.job = { 
      name: 'Test Job',
      serviceType: ServiceType.HTTP,
      body: {},
      headers: {},
      response: { result: 'success', code: 200 }
    };
    
    component['processResponseBody']();
    
    expect(component.responseBodyText).toContain('success');
    expect(component.responseBodyText).toContain('200');
  });
  
  it('should handle empty response', () => {
    component.job = {
      name: 'Test Job',
      serviceType: ServiceType.HTTP,
      body: {},
      headers: {}
    };
    
    component['processResponseBody']();
    
    expect(component.responseBodyText).toBe('{}');
  });
  
  it('should process response headers correctly', () => {
    component.job = { 
      name: 'Test Job',
      serviceType: ServiceType.HTTP,
      body: {},
      headers: {},
      responseHeaders: { 
        'X-Response': 'test',
        'Content-Type': 'application/json'
      }
    };
    
    component['processResponseHeaders']();
    
    expect(component.responseHeaders.length).toBe(2);
    expect(component.responseHeaders[0].key).toBe('X-Response');
    expect(component.responseHeaders[1].key).toBe('Content-Type');
  });
  
  it('should process all job data correctly', () => {
    component.job = { 
      id: '1', 
      name: 'Test Job',
      serviceType: ServiceType.HTTP,
      status: 'completed',
      createdAt: new Date().toISOString(),
      body: { test: 'data' },
      headers: { 'Content-Type': 'application/json' },
      response: { result: 'success' },
      responseHeaders: { 'X-Response': 'test' }
    };
    
    // Spy on the individual methods
    spyOn<any>(component, 'processRequestBody');
    spyOn<any>(component, 'processRequestHeaders');
    spyOn<any>(component, 'processResponseBody');
    spyOn<any>(component, 'processResponseHeaders');
    
    component.ngOnChanges({ job: { currentValue: component.job } as any });
    
    // Verify all methods were called
    expect(component['processRequestBody']).toHaveBeenCalled();
    expect(component['processRequestHeaders']).toHaveBeenCalled();
    expect(component['processResponseBody']).toHaveBeenCalled();
    expect(component['processResponseHeaders']).toHaveBeenCalled();
  });
});