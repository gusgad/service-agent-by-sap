import { Component, OnInit, OnDestroy } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../shared/api.service';
import { JobDetailsModalComponent } from './job-details-modal/job-details-modal.component';
import { Job, JobsResponse } from '../shared/job.model';

declare global {
  interface Window { Math: typeof Math; }
}

@Component({
  selector: 'app-status',
  standalone: true,
  imports: [CommonModule, FormsModule, JobDetailsModalComponent],
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.scss']
})
export class StatusComponent implements OnInit, OnDestroy {
  Math = Math;
  jobs: Job[] = [];
  filteredJobs: Job[] = [];
  loading = false;
  favorites: Set<string> = new Set();
  showFavoritesOnly = false;
  searchText = '';
  selectedJob: Job | null = null;
  showDetails = false;
  
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 1;
  pageSizeOptions = [10, 25, 50];
  
  private pollingSubscription: Subscription | null = null;
  private readonly POLLING_INTERVAL = 60000;

  constructor(private apiService: ApiService) {
    this.loadFavorites();
  }

  ngOnInit() {
    this.loadJobs();
    this.startPolling();
  }
  
  ngOnDestroy() {
    this.stopPolling();
  }

  loadJobs() {
    this.refreshJobs();
  }

  refreshJobs() {
    this.loading = true;
    this.apiService.getJobs(this.currentPage, this.itemsPerPage).subscribe({
      next: (response: JobsResponse) => {
        this.jobs = response.jobs;
        this.totalItems = response.pagination.total;
        this.totalPages = response.pagination.pages;
        this.filterJobs();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading jobs:', error);
        this.loading = false;
      }
    });
  }

  filterJobs() {
    let filtered = this.jobs;
    
    if (this.showFavoritesOnly) {
      filtered = filtered.filter(job => this.favorites.has(job.id!));
    }
    
    if (this.searchText) {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter(job => 
        (job.name || '').toLowerCase().includes(search) ||
        (job.url || '').toLowerCase().includes(search) ||
        (job.method || '').toLowerCase().includes(search) ||
        (job.topic || '').toLowerCase().includes(search) ||
        (job.serviceType || '').toLowerCase().includes(search) ||
        (job.status || '').toLowerCase().includes(search) ||
        (job.id || '').toLowerCase().includes(search)
      );
    }
    
    this.filteredJobs = filtered;
  }

  toggleFavorite(jobId: string) {
    if (this.favorites.has(jobId)) {
      this.favorites.delete(jobId);
    } else {
      this.favorites.add(jobId);
    }
    this.saveFavorites();
    this.filterJobs();
  }

  isFavorite(jobId: string): boolean {
    return this.favorites.has(jobId);
  }

  toggleShowFavorites() {
    this.showFavoritesOnly = !this.showFavoritesOnly;
    this.currentPage = 1;
    this.filterJobs();
  }

  onSearchChange() {
    this.currentPage = 1;
    this.filterJobs();
  }

  showJobDetails(job: Job) {
    this.selectedJob = job;
    this.showDetails = true;
  }

  closeDetails() {
    this.showDetails = false;
    this.selectedJob = null;
  }

  private loadFavorites() {
    const saved = localStorage.getItem('job-favorites');
    if (saved) {
      this.favorites = new Set(JSON.parse(saved));
    }
  }

  private saveFavorites() {
    localStorage.setItem('job-favorites', JSON.stringify([...this.favorites]));
  }
  
  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.refreshJobs();
    }
  }
  
  changePageSize(size: number) {
    this.itemsPerPage = size;
    this.currentPage = 1;
    this.refreshJobs();
  }
  
  private startPolling() {
    this.stopPolling();
    this.pollingSubscription = interval(this.POLLING_INTERVAL).subscribe(() => {
      this.refreshJobs();
    });
  }
  
  private stopPolling() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }
}