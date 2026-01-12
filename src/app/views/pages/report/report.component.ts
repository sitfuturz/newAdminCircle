import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { ReportService } from '../../../services/report.service';
import { Report } from '../../../interface/report.interface';
import { swalHelper } from '../../../core/constants/swal-helper';
import { debounceTime, Subject } from 'rxjs';
import { environment } from 'src/env/env.local';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule, NgSelectModule],
  providers: [ReportService],
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss'],
})
export class ReportComponent implements OnInit {
  reports: Report[] = [];
  analytics = {
    total_reports: 0,
    pending_reports: 0,
    reviewed_reports: 0,
    resolved_reports: 0,
    rejected_reports: 0,
    profile_reports: 0,
    feed_reports: 0
  };

  loading: boolean = false;
  showReportModal: boolean = false;
  selectedReport: Report | null = null;
  imageUrl = environment.imageUrl;
  
  updateStatusData = {
    status: '',
    adminComment: ''
  };
  isUpdating: boolean = false;

  // Pagination
  totalDocs: number = 0;
  totalPages: number = 0;

  // Filters
  filters = {
    page: 1,
    limit: 20,
    status: 'all' as string,
    reportedItemType: 'all' as string,
    search: '' as string
  };

  // Filter options
  statusOptions = ['all', 'pending', 'reviewed', 'resolved', 'rejected'];
  typeOptions = ['all', 'feed', 'profile'];

  private filterSubject = new Subject<void>();

  constructor(
    private reportService: ReportService,
    private cdr: ChangeDetectorRef
  ) {
    this.filterSubject.pipe(debounceTime(300)).subscribe(() => {
      this.fetchReports();
    });
  }

  ngOnInit(): void {
    this.filterSubject.next();
  }

  async fetchReports(): Promise<void> {
    this.loading = true;
    try {
      const response = await this.reportService.getAllReports(this.filters);
      
      if (response.success) {
        this.reports = response.data.reports;
        this.totalDocs = response.data.totalReports;
        this.totalPages = response.data.totalPages;
        
        // Calculate analytics from reports
        this.calculateAnalytics();
        
        this.cdr.detectChanges();
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  calculateAnalytics(): void {
    this.analytics.total_reports = this.totalDocs;
    this.analytics.pending_reports = this.reports.filter(r => r.status === 'pending').length;
    this.analytics.reviewed_reports = this.reports.filter(r => r.status === 'reviewed').length;
    this.analytics.resolved_reports = this.reports.filter(r => r.status === 'resolved').length;
    this.analytics.rejected_reports = this.reports.filter(r => r.status === 'rejected').length;
    this.analytics.profile_reports = this.reports.filter(r => r.reportedItemType === 'profile').length;
    this.analytics.feed_reports = this.reports.filter(r => r.reportedItemType === 'feed').length;
  }

  onFilterChange(): void {
    this.filters.page = 1;
    this.filterSubject.next();
  }

  onPageChange(page: number): void {
    this.filters.page = page;
    this.filterSubject.next();
  }

  resetFilters(): void {
    this.filters = {
      page: 1,
      limit: 20,
      status: 'all',
      reportedItemType: 'all',
      search: ''
    };
    this.filterSubject.next();
  }

  openReportModal(report: Report): void {
    this.selectedReport = report;
    this.updateStatusData = {
      status: report.status || 'pending',
      adminComment: report.adminComment || ''
    };
    this.showReportModal = true;
    this.cdr.detectChanges();
  }

  async updateStatus(): Promise<void> {
    if (!this.selectedReport?._id) return;
    
    this.isUpdating = true;
    try {
      await this.reportService.updateReportStatus(
        this.selectedReport._id,
        this.updateStatusData.status,
        this.updateStatusData.adminComment
      );
      
      swalHelper.showToast('Report status updated successfully', 'success');
      this.closeReportModal();
      this.fetchReports();
    } catch (error) {
      console.error('Update failed', error);
    } finally {
      this.isUpdating = false;
      this.cdr.detectChanges();
    }
  }

  closeReportModal(): void {
    this.showReportModal = false;
    this.selectedReport = null;
    this.cdr.detectChanges();
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'resolved': return 'bg-success';
      case 'reviewed': return 'bg-info';
      case 'pending': return 'bg-warning';
      case 'rejected': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getTypeBadgeClass(type: string): string {
    return type === 'feed' ? 'bg-primary' : 'bg-secondary';
  }

  getImagePath(path: string): string {
    if (!path) return 'assets/images/default-avatar.png';
    if (path.startsWith('http')) return path;
    return `${this.imageUrl}${path.replace(/\\/g, '/')}`;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}