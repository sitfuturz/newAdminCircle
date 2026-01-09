import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { SuggestionService } from '../../../services/suggestion.service';
import { Suggestion, SuggestionAnalytics } from '../../../interface/suggestion.interface';
import { swalHelper } from '../../../core/constants/swal-helper';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-suggestion',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule],
  providers: [SuggestionService],
  templateUrl: './suggestion.component.html',
  styleUrls: ['./suggestion.component.scss'],
})
export class SuggestionComponent implements OnInit {
  suggestions: Suggestion[] = [];
  analytics: SuggestionAnalytics = {
    total_suggestions: 0,
    pending_suggestions: 0,
    reviewed_suggestions: 0,
    implemented_suggestions: 0,
    rejected_suggestions: 0,
    general_category: 0,
    feature_category: 0,
    improvement_category: 0,
    other_category: 0
  };

  loading: boolean = false;
  showSuggestionModal: boolean = false;
  selectedSuggestion: Suggestion | null = null;
  
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
  statusOptions = ['pending', 'reviewed', 'implemented', 'rejected'];
  categoryOptions = ['general', 'feature', 'improvement', 'other'];

  paginationConfig = {
    id: 'suggestions-pagination',
  };

  private filterSubject = new Subject<void>();

  constructor(
    private suggestionService: SuggestionService,
    private cdr: ChangeDetectorRef
  ) {
    this.filterSubject.pipe(debounceTime(300)).subscribe(() => {
      this.fetchSuggestions();
    });
  }

  ngOnInit(): void {
    this.filterSubject.next();
  }

  async fetchSuggestions(): Promise<void> {
    this.loading = true;
    try {
      const requestParams = {
        page: this.filters.page,
        limit: this.filters.limit,
        status: this.filters.status || undefined,
        category: this.filters.category || undefined,
        search: this.filters.search || undefined,
      };

      const response = await this.suggestionService.getAllSuggestions(requestParams);
      this.suggestions = response.data.suggestions.docs;
      this.analytics = response.data.analytics;
      this.totalDocs = response.data.suggestions.totalDocs;
      this.filters.page = response.data.suggestions.page;
      this.totalPages = response.data.suggestions.totalPages;
      
      this.cdr.detectChanges();
    } catch (error) {
      // console.error('Error fetching suggestions:', error);
      // swalHelper.showToast('Failed to fetch suggestions', 'error');
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

  openSuggestionModal(suggestion: Suggestion): void {
    this.selectedSuggestion = suggestion;
    this.updateStatusData = {
      status: suggestion.status || 'pending',
      adminResponse: suggestion.adminResponse || ''
    };
    this.showSuggestionModal = true;
    this.cdr.detectChanges();
  }

  async updateStatus(): Promise<void> {
    if (!this.selectedSuggestion?._id) return;
    
    this.isUpdating = true;
    try {
      await this.suggestionService.updateSuggestionStatus(
        this.selectedSuggestion._id,
        this.updateStatusData.status,
        this.updateStatusData.adminResponse
      );
      
      swalHelper.showToast('Status updated successfully', 'success');
      this.closeSuggestionModal();
      this.fetchSuggestions(); // Refresh list
    } catch (error) {
      console.error('Update failed', error);
      // Toast handled in service
    } finally {
      this.isUpdating = false;
      this.cdr.detectChanges();
    }
  }

  closeSuggestionModal(): void {
    this.showSuggestionModal = false;
    this.selectedSuggestion = null;
    this.cdr.detectChanges();
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'implemented': return 'bg-success';
      case 'reviewed': return 'bg-info';
      case 'pending': return 'bg-warning';
      case 'rejected': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getCategoryBadgeClass(category: string): string {
    switch (category) {
      case 'feature': return 'bg-primary';
      case 'improvement': return 'bg-info';
      case 'general': return 'bg-secondary';
      case 'other': return 'bg-light text-dark';
      default: return 'bg-secondary';
    }
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'feature': return 'bi-plus-circle';
      case 'improvement': return 'bi-arrow-up-circle';
      case 'general': return 'bi-chat-dots';
      case 'other': return 'bi-three-dots';
      default: return 'bi-lightbulb';
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