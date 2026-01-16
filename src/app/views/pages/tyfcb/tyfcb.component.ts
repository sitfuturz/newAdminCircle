import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TyfcbService, Tyfcb, TyfcbResponse } from '../../../services/auth.service';
import { ChapterService, ChapterFull } from '../../../services/auth.service';
import { swalHelper } from '../../../core/constants/swal-helper';
import { debounceTime, Subject } from 'rxjs';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { ExportService } from '../../../services/export.service';
import { environment } from 'src/env/env.local';
import { CustomhelperService } from 'src/app/services/customhelper.service';

@Component({
  selector: 'app-tyfcb',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule, NgSelectModule],
  providers: [TyfcbService, ChapterService, ExportService, CustomhelperService],
  templateUrl: './tyfcb.component.html',
  styleUrls: ['./tyfcb.component.css'],
})
export class TyfcbComponent implements OnInit {
  tyfcbs: TyfcbResponse = {
    docs: [],
    totalDocs: 0,
    limit: 10,
    page: 1,
    totalPages: 0,
    hasPrevPage: false,
    hasNextPage: false,
    prevPage: null,
    nextPage: null
  };

  chapters: ChapterFull[] = [];
  loading: boolean = false;
  chaptersLoading: boolean = false;
  exporting: boolean = false;
  isAdmin: boolean = false;
  isExecutiveDirector: boolean = false;
  userChapter: string = '';

  Math = Math;

  referralTypes = [
    { value: null, label: 'All' },
    { value: 'inside', label: 'Inside' },
    { value: 'outside', label: 'Outside' }
  ];

  filters = {
    page: 1,
    limit: 10,
    chapter_name: null as string | null,
    startDate: this.formatDateForInput(new Date(new Date().setDate(new Date().getDate() - 30))),
    endDate: this.formatDateForInput(new Date()),
    referral_type: null as string | null
  };

  paginationConfig = {
    id: 'tyfcb-pagination'
  };

  private filterSubject = new Subject<void>();

  constructor(
    private tyfcbService: TyfcbService,
    private chapterService: ChapterService,
    private exportService: ExportService,
    private customhelperService: CustomhelperService,
    private cdr: ChangeDetectorRef
  ) {
    this.filterSubject.pipe(debounceTime(300)).subscribe(() => {
      this.fetchTyfcbs();
    });
  }

  ngOnInit(): void {
    const { chapter, isAdmin, role } = this.customhelperService.getChapterAndIsAdmin();
    this.userChapter = chapter;
    this.isAdmin = isAdmin;
    this.isExecutiveDirector = role === 'executiveDirector';

    if (this.userChapter) {
      this.filters.chapter_name = this.userChapter;
    }

    this.fetchChapters();
    this.fetchTyfcbs();
  }

  async fetchTyfcbs(): Promise<void> {
    this.loading = true;
    try {
      const requestParams: any = {
        page: this.filters.page,
        limit: this.filters.limit,
      };

      if (this.filters.chapter_name)    requestParams.chapter_name   = this.filters.chapter_name;
      if (this.filters.startDate)       requestParams.startDate      = this.filters.startDate;
      if (this.filters.endDate)         requestParams.endDate        = this.filters.endDate;
      if (this.filters.referral_type)   requestParams.referral_type  = this.filters.referral_type;

      const response = await this.tyfcbService.getAllTyfcbs(requestParams);
      this.tyfcbs = response;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error fetching TYFCB records:', error);
      swalHelper.showToast('Failed to fetch TYFCB records', 'error');
      this.tyfcbs = {
        docs: [],
        totalDocs: 0,
        limit: this.filters.limit,
        page: this.filters.page,
        totalPages: 0,
        hasPrevPage: false,
        hasNextPage: false,
        prevPage: null,
        nextPage: null
      };
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
    this.fetchTyfcbs();
  }

  resetFilters(): void {
    this.filters = {
      page: 1,
      limit: 10,
      chapter_name: this.userChapter || null,
      startDate: this.formatDateForInput(new Date(new Date().setDate(new Date().getDate() - 30))),
      endDate: this.formatDateForInput(new Date()),
      referral_type: null
    };
    this.fetchTyfcbs();
  }

  getProfilePicUrl(picPath: string): string {
    if (!picPath) return 'assets/images/default-avatar.png';
    return `${environment.imageUrl}/${picPath}`;
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

  formatCurrency(amount: number, currency: string): string {
    if (currency === 'rupee') {
      return `₹${amount.toLocaleString('en-IN')}`;
    } else if (currency === 'dollar') {
      return `$${amount.toLocaleString('en-US')}`;
    } else {
      return `${amount.toLocaleString()}`;
    }
  }

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async exportToExcel(): Promise<void> {
    try {
      this.exporting = true;
      let allData: Tyfcb[] = [];
      let page = 1;
      const limit = 1000;
      let response: TyfcbResponse;

      const exportParams: any = { page, limit };
      if (this.filters.chapter_name)    exportParams.chapter_name   = this.filters.chapter_name;
      if (this.filters.startDate)       exportParams.startDate      = this.filters.startDate;
      if (this.filters.endDate)         exportParams.endDate        = this.filters.endDate;
      if (this.filters.referral_type)   exportParams.referral_type  = this.filters.referral_type;

      do {
        response = await this.tyfcbService.getAllTyfcbs(exportParams);
        allData = [...allData, ...response.docs];
        page++;
        exportParams.page = page;
      } while (response.hasNextPage);

      if (allData.length === 0) {
        swalHelper.showToast('No records found for export', 'warning');
        return;
      }

      const exportData = allData.map((tyfcb, index) => ({
        'Sr No': index + 1,
        'Business From': tyfcb.giverId?.name || 'Unknown',
        'From Chapter': tyfcb.giverId?.chapter_name || 'N/A',
        'Business To': tyfcb.receiverId?.name || 'Unknown',
        'To Chapter': tyfcb.receiverId?.chapter_name || 'N/A',
        'Amount': this.formatCurrency(tyfcb.amount, tyfcb.currency),
        'Business Type': tyfcb.business_type || 'N/A',
        'Referral Type': tyfcb.referral_type || 'N/A',
        'Comments': tyfcb.comments || 'No comments',
        'Date': this.formatDate(tyfcb.createdAt)
      }));

      const fileName = `TYFCB_Report_${this.formatDateForFileName(new Date())}`;
      await this.exportService.exportToExcel(exportData, fileName);
      swalHelper.showToast('Excel file downloaded successfully', 'success');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      swalHelper.showToast('Failed to export to Excel', 'error');
    } finally {
      this.exporting = false;
    }
  }

  async exportToPDF(): Promise<void> {
    try {
      this.exporting = true;
      let allData: Tyfcb[] = [];
      let page = 1;
      const limit = 1000;
      let response: TyfcbResponse;

      const exportParams: any = { page, limit };
      if (this.filters.chapter_name)    exportParams.chapter_name   = this.filters.chapter_name;
      if (this.filters.startDate)       exportParams.startDate      = this.filters.startDate;
      if (this.filters.endDate)         exportParams.endDate        = this.filters.endDate;
      if (this.filters.referral_type)   exportParams.referral_type  = this.filters.referral_type;

      do {
        response = await this.tyfcbService.getAllTyfcbs(exportParams);
        allData = [...allData, ...response.docs];
        page++;
        exportParams.page = page;
      } while (response.hasNextPage);

      if (allData.length === 0) {
        swalHelper.showToast('No records found for export', 'warning');
        return;
      }

      const columns = [
        { header: 'Sr No', dataKey: 'srNo' },
        { header: 'From', dataKey: 'from' },
        { header: 'To', dataKey: 'to' },
        { header: 'Amount', dataKey: 'amount' },
        { header: 'Business Type', dataKey: 'businessType' },
        { header: 'Referral Type', dataKey: 'referralType' },
        { header: 'Date', dataKey: 'date' }
      ];

      const data = allData.map((tyfcb, index) => ({
        srNo: index + 1,
        from: `${tyfcb.giverId?.name || 'Unknown'}\n(${tyfcb.giverId?.chapter_name || 'N/A'})`,
        to: `${tyfcb.receiverId?.name || 'Unknown'}\n(${tyfcb.receiverId?.chapter_name || 'N/A'})`,
        amount: this.formatCurrency(tyfcb.amount, tyfcb.currency),
        businessType: tyfcb.business_type || 'N/A',
        referralType: tyfcb.referral_type || 'N/A',
        date: this.formatDate(tyfcb.createdAt)
      }));

      const title = 'Business Report';
      let subtitle = 'All Business Records';
      if (this.filters.chapter_name) {
        subtitle = `Chapter: ${this.filters.chapter_name}`;
      }
      if (this.filters.referral_type) {
        subtitle += ` | Referral Type: ${this.filters.referral_type === 'inside' ? 'Inside' : 'Outside'}`;
      }
      if (this.filters.startDate && this.filters.endDate) {
        subtitle += ` | Period: ${this.formatDate(this.filters.startDate)} to ${this.formatDate(this.filters.endDate)}`;
      }

      const fileName = `TYFCB_Report_${this.formatDateForFileName(new Date())}`;
      await this.exportService.exportToPDF(columns, data, title, subtitle, fileName);
      swalHelper.showToast('PDF file downloaded successfully', 'success');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      swalHelper.showToast('Failed to export to PDF', 'error');
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