// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-complain',
//   standalone: true,
//   imports: [],
//   templateUrl: './complain.component.html',
//   styleUrl: './complain.component.scss'
// })
// export class ComplainComponent {

// }


import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { ComplaintService } from '../../../services/complain.service';
import { Complaint, ComplaintAnalytics } from '../../../interface/complain.interface';
import { swalHelper } from '../../../core/constants/swal-helper';
import { debounceTime, Subject } from 'rxjs';
import { environment } from 'src/env/env.local';

@Component({
  selector: 'app-complain',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule, NgSelectModule],
  providers: [ComplaintService],
  templateUrl: './complain.component.html',
  styleUrls: ['./complain.component.scss'],
})
export class ComplainComponent implements OnInit {
  complaints: Complaint[] = [];
  analytics: ComplaintAnalytics = {
    total_complaints: 0,
    pending_complaints: 0,
    in_progress_complaints: 0,
    resolved_complaints: 0,
    rejected_complaints: 0,
    general_category: 0,
    technical_category: 0,
    account_category: 0,
    other_category: 0
  };

  loading: boolean = false;
  showComplaintModal: boolean = false;
  selectedComplaint: Complaint | null = null;
  imageUrl = environment.imageUrl;
  
  updateStatusData = {
    status: '',
    adminResponse: ''
  };
  isUpdating: boolean = false;

  // Pagination
  totalDocs: number = 0;
  currentPage: number = 1;
  limit: number = 20;
  totalPages: number = 0;

  Math = Math;

  // Filters
  filters = {
    page: 1,
    limit: 20,
    status: '' as string,
    category: '' as string,
    search: '' as string
  };

  // Filter options
  statusOptions = ['pending', 'in_progress', 'resolved', 'rejected'];
  categoryOptions = ['general', 'technical', 'account', 'other'];

  paginationConfig = {
    id: 'complaints-pagination',
  };

  private filterSubject = new Subject<void>();

  constructor(
    private complaintService: ComplaintService,
    private cdr: ChangeDetectorRef
  ) {
    this.filterSubject.pipe(debounceTime(300)).subscribe(() => {
      this.fetchComplaints();
    });
  }

  ngOnInit(): void {
    this.filterSubject.next();
  }

  async fetchComplaints(): Promise<void> {
    this.loading = true;
    try {
      const requestParams = {
        page: this.filters.page,
        limit: this.filters.limit,
        status: this.filters.status || undefined,
        category: this.filters.category || undefined,
        search: this.filters.search || undefined,
      };

      const response = await this.complaintService.getAllComplaints(requestParams);
      
      this.complaints = response.complaints.docs;
      this.analytics = response.analytics;
      this.totalDocs = response.complaints.totalDocs;
      this.filters.page = response.complaints.page;
      this.totalPages = response.complaints.totalPages;
      
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error fetching complaints:', error);
      swalHelper.showToast('Failed to fetch complaints', 'error');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
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
      status: '',
      category: '',
      search: ''
    };
    this.filterSubject.next();
  }

  openComplaintModal(complaint: Complaint): void {
    this.selectedComplaint = complaint;
    
    this.updateStatusData = {
      status: complaint.status || 'pending',
      adminResponse: complaint.adminResponse || ''
    };
    
    this.showComplaintModal = true;
    this.cdr.detectChanges();
  }

  async updateStatus(): Promise<void> {
    if (!this.selectedComplaint?._id) return;
    
    this.isUpdating = true;
    try {
      await this.complaintService.updateComplaintStatus(
        this.selectedComplaint._id,
        this.updateStatusData.status,
        this.updateStatusData.adminResponse
      );
      
      swalHelper.showToast('Status updated successfully', 'success');
      this.closeComplaintModal();
      this.fetchComplaints(); // Refresh list
    } catch (error) {
      console.error('Update failed', error);
      // Toast handled in service
    } finally {
      this.isUpdating = false;
      this.cdr.detectChanges();
    }
  }

  closeComplaintModal(): void {
    this.showComplaintModal = false;
    this.selectedComplaint = null;
    this.cdr.detectChanges();
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'resolved': return 'bg-success';
      case 'in_progress': return 'bg-primary';
      case 'pending': return 'bg-warning';
      case 'rejected': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getCategoryBadgeClass(category: string): string {
    switch (category) {
      case 'technical': return 'bg-info';
      case 'account': return 'bg-warning';
      case 'general': return 'bg-secondary';
      case 'other': return 'bg-light text-dark';
      default: return 'bg-secondary';
    }
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'technical': return 'bi-tools';
      case 'account': return 'bi-person-circle';
      case 'general': return 'bi-chat-dots';
      case 'other': return 'bi-question-circle';
      default: return 'bi-chat';
    }
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