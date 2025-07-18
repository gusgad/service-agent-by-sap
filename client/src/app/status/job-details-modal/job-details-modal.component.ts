import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CodeEditor } from '@acrodata/code-editor';
import { Job, HeaderRow } from '../../shared/job.model';

@Component({
  selector: 'app-job-details-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, CodeEditor],
  templateUrl: './job-details-modal.component.html',
  styleUrls: ['./job-details-modal.component.scss']
})
export class JobDetailsModalComponent implements OnChanges {
  @Input() job: Job | null = null;
  @Input() visible = false;
  @Output() close = new EventEmitter<void>();
  
  requestBodyText: string = '{}';
  requestHeaders: HeaderRow[] = [];
  responseBodyText: string = '{}';
  responseHeaders: HeaderRow[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['job'] && this.job) {
      this.processJobData();
    }
  }

  closeModal(): void {
    this.close.emit();
  }
  
  private processRequestBody(): void {
    if (!this.job) return;
    
    try {
      this.requestBodyText = JSON.stringify(this.job.body, null, 2);
    } catch {
      this.requestBodyText = String(this.job.body);
    }
  }
  
  private processRequestHeaders(): void {
    if (!this.job) return;
    
    this.requestHeaders = [];
    if (this.job.headers) {
      for (const key in this.job.headers) {
        this.requestHeaders.push({
          key: key,
          value: this.job.headers[key]
        });
      }
    }
  }
  
  private processResponseBody(): void {
    if (!this.job) return;
    
    if (this.job.response) {
      try {
        this.responseBodyText = JSON.stringify(this.job.response, null, 2);
      } catch {
        this.responseBodyText = String(this.job.response);
      }
    } else {
      this.responseBodyText = '{}';
    }
  }
  
  private processResponseHeaders(): void {
    if (!this.job) return;
    
    this.responseHeaders = [];
    if (this.job.responseHeaders) {
      for (const key in this.job.responseHeaders) {
        this.responseHeaders.push({
          key: key,
          value: this.job.responseHeaders[key]
        });
      }
    }
  }
  
  private processJobData(): void {
    if (!this.job) return;
    
    this.processRequestBody();
    this.processRequestHeaders();
    this.processResponseBody();
    this.processResponseHeaders();
  }
}