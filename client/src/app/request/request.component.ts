import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../shared/api.service';
import { HelperService } from '../shared/helper.service';
import { CodeEditor } from '@acrodata/code-editor';
import { HeaderRow, ServiceType, ExecutionType, JobRequest, JobResponse, HttpMethod } from '../shared/job.model';

@Component({
  selector: 'app-request',
  standalone: true,
  imports: [CommonModule, FormsModule, CodeEditor],
  templateUrl: './request.component.html',
  styleUrls: ['./request.component.scss']
})
export class RequestComponent implements OnInit {
  HttpMethod = HttpMethod;
  ServiceType = ServiceType;
  ExecutionType = ExecutionType;
  
  request = {
    name: '',
    serviceType: ServiceType.HTTP,
    url: '',
    method: HttpMethod.GET,
    topic: '',
    executionType: ExecutionType.IMMEDIATE,
    scheduledDate: '',
    scheduledHours: '',
    scheduledMinutes: '',
    scheduledSeconds: ''
  };
  
  headerRows: HeaderRow[] = [
    { key: '', value: '' },
    { key: '', value: '' },
    { key: '', value: '' }
  ];
  
  bodyText = '{}';
  loading = false;
  result: any = null;
  jsonError: string | null = null;
  
  responseData: JobResponse | null = null;
  responseBodyText: string = '';
  responseHeaders: HeaderRow[] = [];
  
  constructor(private apiService: ApiService, private helperService: HelperService) {}
  
  ngOnInit() {
    if (this.bodyText === '{}') {
      this.setDefaultBodyText();
    }
  }

  setDefaultBodyText() {
    this.bodyText = JSON.stringify({ key: 'value' }, null, 2);
  }
  
  onMethodChange() {
    if (this.request.serviceType === ServiceType.HTTP && 
        (this.request.method === HttpMethod.GET || this.request.method === HttpMethod.DELETE)) {
      this.setDefaultBodyText();
    }
  }
  
  addHeaderRow() {
    this.headerRows.push({ key: '', value: '' });
  }

  private processHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    this.headerRows.forEach(row => {
      if (row.key.trim()) {
        headers[row.key.trim()] = row.value;
      }
    });
    return headers;
  }

  private processBody(): any {
    if (this.request.serviceType === ServiceType.HTTP && 
        (this.request.method === HttpMethod.GET || this.request.method === HttpMethod.DELETE)) {
      return {};
    }
    
    try {
      return JSON.parse(this.bodyText);
    } catch {
      // If JSON parsing fails, use the raw text as string
      return { data: this.bodyText };
    }
  }

  private createBaseJobData(): Partial<JobRequest> {
    return {
      name: this.request.name,
      serviceType: this.request.serviceType,
      headers: this.processHeaders(),
      body: this.processBody()
    };
  }

  private addServiceSpecificFields(jobData: Partial<JobRequest>): void {
    if (this.request.serviceType === ServiceType.HTTP) {
      jobData.url = this.request.url;
      jobData.method = this.request.method;
    } else {
      jobData.topic = this.request.topic;
    }
  }

  private addSchedulingIfNeeded(jobData: Partial<JobRequest>): void {
    if (this.request.executionType === ExecutionType.SCHEDULED && this.request.scheduledDate) {
      jobData.scheduledAt = this.getScheduledDateTime();
    }
  }

  private createJobData(): Partial<JobRequest> {
    const jobData = this.createBaseJobData();
    this.addServiceSpecificFields(jobData);
    this.addSchedulingIfNeeded(jobData);
    return jobData;
  }

  private getScheduledDateTime(): string {
    const dateStr = this.request.scheduledDate;
    const timeStr = `${this.request.scheduledHours}:${this.request.scheduledMinutes}:${this.request.scheduledSeconds}`;
    const scheduledDateTime = new Date(`${dateStr}T${timeStr}`);
    
    return this.helperService.formatDateTimeWithTimezone(scheduledDateTime.toISOString());
  }

  private processResponseBody(response: JobResponse): void {
    if (response.response) {
      try {
        this.responseBodyText = JSON.stringify(response.response, null, 2);
      } catch {
        this.responseBodyText = String(response.response);
      }
    } else {
      this.responseBodyText = '{}';
    }
  }

  private processResponseHeaders(response: JobResponse): void {
    this.responseHeaders = [];
    if (response.responseHeaders) {
      for (const key in response.responseHeaders) {
        this.responseHeaders.push({
          key: key,
          value: response.responseHeaders[key]
        });
      }
    }
  }

  private handleSuccess(response: JobResponse): void {
    this.result = {
      success: true,
      message: `Request submitted successfully! Job ID: ${response.jobId} - Status: ${response.status.toUpperCase()}`
    };
    
    this.responseData = response;
    this.processResponseBody(response);
    this.processResponseHeaders(response);
    this.loading = false;
  }

  private handleError(error: any): void {
    this.result = {
      success: false,
      message: `Error: ${error.error?.error || error.message || 'Unknown error'}`
    };
    this.loading = false;
  }

  onSubmit() {
    this.loading = true;
    this.result = null;

    try {
      const jobData = this.createJobData();
      
      this.apiService.createJob(jobData).subscribe({
        next: (response: JobResponse) => this.handleSuccess(response),
        error: (error) => this.handleError(error)
      });
    } catch (error) {
      this.handleError(error);
    }
  }
}