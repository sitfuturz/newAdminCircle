// referralReport.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReferralService, Referral, ReferralResponse } from '../../../services/auth.service';
import { ChapterService, Chapter } from '../../../services/auth.service';
import { swalHelper } from '../../../core/constants/swal-helper';
import { debounceTime, Subject } from 'rxjs';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { ExportService } from '../../../services/export.service';
import { CustomhelperService } from 'src/app/services/customhelper.service';

@Component({
  selector: 'app-referrals',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule, NgSelectModule],
  providers: [ReferralService, ChapterService, ExportService, CustomhelperService],
  templateUrl: './referralReport.component.html',
  styleUrls: ['./referralReport.component.css'],
})
export class ReferralsComponent implements OnInit {
  referrals: ReferralResponse = {
    docs: [],
    totalDocs: 0,
    limit: 10,
    page: 1,
    totalPages: 0,
    pagingCounter: 1,
    hasPrevPage: false,
    hasNextPage: false,
    prevPage: null,
    nextPage: null
  };

  chapters: Chapter[] = [];
  loading: boolean = false;
  chaptersLoading: boolean = false;
  exporting: boolean = false;
  isAdmin: boolean = false;
  isExecutiveDirector: boolean = false;
  userChapter: string = '';

  Math = Math;

  // ────────────────────────────────────────────────
  // NEW: Options for Recommendation Type filter
  // ────────────────────────────────────────────────
  referralTypes = [
    { value: null, label: 'All' },
    { value: 'inside', label: 'Inside' },
    { value: 'outside', label: 'Outside' }
  ];

  filters = {
    page: 1,
    limit: 10,
    chapterName: null as string | null,
    startDate: this.formatDateForInput(new Date(new Date().setDate(new Date().getDate() - 30))),
    endDate: this.formatDateForInput(new Date()),
    referralType: null as string | null          // ← NEW FIELD
  };

  paginationConfig = {
    id: 'referral-pagination'
  };

  private filterSubject = new Subject<void>();

  constructor(
    private referralService: ReferralService,
    private chapterService: ChapterService,
    private exportService: ExportService,
    private customhelperService: CustomhelperService,
    private cdr: ChangeDetectorRef
  ) {
    this.filterSubject.pipe(debounceTime(300)).subscribe(() => {
      this.fetchReferrals();
    });
  }

  ngOnInit(): void {
    const { chapter, isAdmin, role } = this.customhelperService.getChapterAndIsAdmin();
    this.userChapter = chapter;
    this.isAdmin = isAdmin;
    this.isExecutiveDirector = role === 'executiveDirector';

    if (this.userChapter) {
      this.filters.chapterName = this.userChapter;
    }

    this.fetchChapters();
    this.fetchReferrals();
  }

  async fetchReferrals(): Promise<void> {
    this.loading = true;
    try {
      const requestParams: any = {
        page: this.filters.page,
        limit: this.filters.limit
      };

      if (this.filters.chapterName)    requestParams.chapterName   = this.filters.chapterName;
      if (this.filters.startDate)      requestParams.startDate     = this.filters.startDate;
      if (this.filters.endDate)        requestParams.endDate       = this.filters.endDate;
      if (this.filters.referralType)   requestParams.referralType  = this.filters.referralType;  // ← NEW

      const response = await this.referralService.getAllReferrals(requestParams);
      this.referrals = response;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error fetching referrals:', error);
      swalHelper.showToast('Failed to fetch referrals', 'error');
      this.referrals = {
        docs: [],
        totalDocs: 0,
        limit: this.filters.limit,
        page: this.filters.page,
        totalPages: 0,
        pagingCounter: 1,
        hasPrevPage: false,
        hasNextPage: false,
        prevPage: null,
        nextPage: null
      };
      this.cdr.detectChanges();
    } finally {
      this.loading = false;
    }
  }

  async fetchChapters(): Promise<void> {
    this.chaptersLoading = true;
    try {
      const response = await this.chapterService.getAllChapters({
        page: 1,
        limit: 1000,
        search: ''
      });
      this.chapters = response.docs || [];
      if (!this.isAdmin && !this.isExecutiveDirector && this.userChapter) {
        this.chapters = this.chapters.filter(chapter => chapter.name === this.userChapter);
      }
    } catch (error) {
      console.error('Error fetching chapters:', error);
      swalHelper.showToast('Failed to fetch chapters', 'error');
    } finally {
      this.chaptersLoading = false;
    }
  }

  onFilterChange(): void {
    this.filters.page = 1;
    this.filterSubject.next();
  }

  onPageChange(page: number): void {
    this.filters.page = page;
    this.fetchReferrals();
  }

  resetFilters(): void {
    this.filters = {
      page: 1,
      limit: 10,
      chapterName: this.userChapter || null,
      startDate: this.formatDateForInput(new Date(new Date().setDate(new Date().getDate() - 30))),
      endDate: this.formatDateForInput(new Date()),
      referralType: null                             // ← reset to All
    };
    this.fetchReferrals();
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

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // ────────────────────────────────────────────────
  // Export functions remain almost same – just pass referralType too
  // ────────────────────────────────────────────────

  async exportToExcel(): Promise<void> {
    try {
      this.exporting = true;
      let allData: Referral[] = [];
      let page = 1;
      const limit = 1000;
      let response: ReferralResponse;

      const exportParams: any = { page, limit };
      if (this.filters.chapterName)   exportParams.chapterName   = this.filters.chapterName;
      if (this.filters.startDate)     exportParams.startDate     = this.filters.startDate;
      if (this.filters.endDate)       exportParams.endDate       = this.filters.endDate;
      if (this.filters.referralType)  exportParams.referralType  = this.filters.referralType;   // ← NEW

      do {
        response = await this.referralService.getAllReferrals(exportParams);
        allData = [...allData, ...response.docs];
        page++;
        exportParams.page = page;
      } while (response.hasNextPage);

      if (!allData || allData.length === 0) {
        swalHelper.showToast('No referrals found for the selected filters', 'warning');
        return;
      }

      const exportData = allData.map((referral, index) => ({
        'Sr No': index + 1,
        'Recommendation From': String(referral.giver_id?.name || 'Unknown').replace(/[\r\n\t]/g, ' '),
        'From Chapter': String(referral.giver_id?.chapter_name || 'N/A').replace(/[\r\n\t]/g, ' '),
        'Recommendation To': String(referral.receiver_id?.name || 'External Referral').replace(/[\r\n\t]/g, ' '),
        'To Chapter': String(referral.receiver_id?.chapter_name || 'N/A').replace(/[\r\n\t]/g, ' '),
        'Recommendation Type': referral.referral_type === 'inside' ? 'Inside' : 'Outside',
        'Recommendation': String(referral.referral || '').replace(/[\r\n\t]/g, ' '),
        'Mobile No': String(referral.mobile_number || '').replace(/[\r\n\t]/g, ' '),
        'Comments': String(referral.comments || 'No comments').replace(/[\r\n\t]/g, ' '),
        'Rating': Number(referral.rating || 0),
        'Date': this.formatDate(referral.createdAt)
      }));

      const fileName = `Recommendation_Report_${this.formatDateForFileName(new Date())}`;
      await this.exportService.exportToExcel(exportData, fileName);
      swalHelper.showToast('Excel file downloaded successfully', 'success');
    } catch (error: any) {
      console.error('Error exporting to Excel:', error);
      swalHelper.showToast(`Failed to export to Excel: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      this.exporting = false;
    }
  }

  async exportToPDF(): Promise<void> {
    try {
      this.exporting = true;
      let allData: Referral[] = [];
      let page = 1;
      const limit = 1000;
      let response: ReferralResponse;

      const exportParams: any = { page, limit };
      if (this.filters.chapterName)   exportParams.chapterName   = this.filters.chapterName;
      if (this.filters.startDate)     exportParams.startDate     = this.filters.startDate;
      if (this.filters.endDate)       exportParams.endDate       = this.filters.endDate;
      if (this.filters.referralType)  exportParams.referralType  = this.filters.referralType;   // ← NEW

      do {
        response = await this.referralService.getAllReferrals(exportParams);
        allData = [...allData, ...response.docs];
        page++;
        exportParams.page = page;
      } while (response.hasNextPage);

      if (!allData || allData.length === 0) {
        swalHelper.showToast('No referrals found for the selected filters', 'warning');
        return;
      }

      const fileName = `Referrals_Report_${this.formatDateForFileName(new Date())}`;
      const columns = [
        { header: 'Sr No', dataKey: 'srNo' },
        { header: 'Recommendation From', dataKey: 'fromName' },
        { header: 'Recommendation To', dataKey: 'toName' },
        { header: 'Type', dataKey: 'type' },
        { header: 'Recommendation', dataKey: 'referral' },
        { header: 'Mobile', dataKey: 'mobile' },
        { header: 'Date', dataKey: 'date' }
      ];

      const data = allData.map((referral, index) => ({
        srNo: index + 1,
        fromName: `${referral.giver_id?.name || 'Unknown'}\n(${referral.giver_id?.chapter_name || 'N/A'})`,
        toName: referral.receiver_id
          ? `${referral.receiver_id?.name || 'Unknown'}\n(${referral.receiver_id?.chapter_name || 'N/A'})`
          : 'External Recommendation',
        type: referral.referral_type === 'inside' ? 'Inside' : 'Outside',
        referral: referral.referral,
        mobile: referral.mobile_number,
        date: this.formatDate(referral.createdAt)
      }));

      const title = 'Recommendation Report';
      let subtitle = 'All Recommendations';
      if (this.filters.chapterName) {
        subtitle = `Chapter: ${this.filters.chapterName}`;
      }
      if (this.filters.referralType) {
        subtitle += ` | Type: ${this.filters.referralType === 'inside' ? 'Inside' : 'Outside'}`;
      }
      if (this.filters.startDate && this.filters.endDate) {
        subtitle += ` | Period: ${this.formatDate(this.filters.startDate)} to ${this.formatDate(this.filters.endDate)}`;
      }

      await this.exportService.exportToPDF(columns, data, title, subtitle, fileName);
      swalHelper.showToast('PDF file downloaded successfully', 'success');
    } catch (error: any) {
      console.error('Error exporting to PDF:', error);
      swalHelper.showToast(`Failed to export to PDF: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      this.exporting = false;
    }
  }

  private formatDateForFileName(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }
}