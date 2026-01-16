import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { ReferralService1 } from '../../../services/auth.service';
import { ExportService } from '../../../services/export.service';
import { ChapterService } from '../../../services/auth.service';
import { swalHelper } from '../../../core/constants/swal-helper';
import { debounceTime, Subject, firstValueFrom } from 'rxjs';
import { environment } from 'src/env/env.local';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { HttpClient } from '@angular/common/http';
import * as jspdf from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { CustomhelperService } from 'src/app/services/customhelper.service';

declare var $: any;
declare var bootstrap: any;

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule, NgSelectModule],
  providers: [ExportService, CustomhelperService],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit, AfterViewInit {
  users: any = { docs: [], totalDocs: 0, limit: 10, page: 1, totalPages: 0 };
  chapters: any[] = [];
  selectedChapter: string | null = null;
  loading: boolean = false;
  exporting: boolean = false;
  searchQuery: string = '';
  selectedUser: any = null;
  userDetailsModal: any;
  notificationModal: any;
  imageurl = environment.imageUrl;
  pathurl = environment.baseURL;
  activeTab: string = 'profile';
  referralTab: string = 'given';
  referralsGiven: any[] = [];
  referralsReceived: any[] = [];
  referralsGivenTotal: number = 0;
  referralsReceivedTotal: number = 0;
  referralLoading: boolean = false;
  pdfLoading: boolean = false;
  Math = Math;
  notificationForm = {
    userId: '',
    title: '',
    description: '',
    message: ''
  };
  notificationError = {
    title: '',
    description: ''
  };
  notificationLoading: boolean = false;
  isAdmin: boolean = false; // Track if user is admin
  isExecutiveDirector: boolean = false; // Track if user is executive director

  paginationConfig = {
    id: 'users-pagination'
  };
  editUserModal: any;
  editForm = {
    name: '',
    mobile_number: '',
    email: '',
    role: ''
  };
  editError = {
    name: '',
    mobile_number: '',
    email: '',
    role: ''
  };
  editLoading: boolean = false;

  referralPaginationConfig = {
    givenId: 'referrals-given-pagination',
    receivedId: 'referrals-received-pagination'
  };

  payload = {
    search: '',
    page: 1,
    limit: 10,
    chapter: ''
  };

  referralPayload = {
    page: 1,
    givenPage: 1,
    receivedPage: 1,
    limit: 5
  };

  emailModal: any;
  whatsappModal: any;
  emailLoading: boolean = false;
  whatsappLoading: boolean = false;

  emailForm = {
    userId: '',
    subject: '',
    message: '',
    attachment: null,
    recipients: [] as string[],
    isBulkEmail: false
  };

  emailError = {
    subject: '',
    message: '',
    recipients: ''
  };

  whatsappForm = {
    userId: '',
    message: '',
    includeLink: false,
    link: ''
  };

  whatsappError = {
    message: ''
  };

  private searchSubject = new Subject<string>();

  constructor(
    private authService: AuthService,
    private referralService: ReferralService1,
    private chapterService: ChapterService,
    private exportService: ExportService,
    private http: HttpClient,
    private customhelperService: CustomhelperService, // Inject CustomhelperService
    private cdr: ChangeDetectorRef
  ) {
    this.searchSubject.pipe(debounceTime(500)).subscribe(() => {
      this.fetchUsers();
    });
  }

  ngOnInit(): void {
    // Fetch user data to set default chapter and isAdmin
    const { chapter, isAdmin, role } = this.customhelperService.getChapterAndIsAdmin();
    this.isAdmin = isAdmin;
    this.isExecutiveDirector = role === 'executiveDirector';

    // Set default chapter if user has one
    if (chapter) {
      this.payload.chapter = chapter;
      this.selectedChapter = chapter;
    }

    this.fetchChapters();
    this.fetchUsers();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const userModalElement = document.getElementById('userDetailsModal');
      if (userModalElement) {
        this.userDetailsModal = new bootstrap.Modal(userModalElement);
      } else {
        console.warn('User modal element not found in the DOM');
      }
      const editModalElement = document.getElementById('editUserModal');
      if (editModalElement) {
        this.editUserModal = new bootstrap.Modal(editModalElement);
      } else {
        console.warn('Edit user modal element not found in the DOM');
      }
      const notificationModalElement = document.getElementById('notificationModal');
      if (notificationModalElement) {
        this.notificationModal = new bootstrap.Modal(notificationModalElement);
      } else {
        console.warn('Notification modal element not found in the DOM');
      }
      const emailModalElement = document.getElementById('emailModal');
      if (emailModalElement) {
        this.emailModal = new bootstrap.Modal(emailModalElement);
      }
      const whatsappModalElement = document.getElementById('whatsappModal');
      if (whatsappModalElement) {
        this.whatsappModal = new bootstrap.Modal(whatsappModalElement);
      }
    }, 300);
  }

  async fetchChapters(): Promise<void> {
    try {
      const chapters = await this.chapterService.getAllChaptersForDropdown();
      this.chapters = chapters;
      // If not admin and not executive director, filter chapters to only show user's chapter
      if (!this.isAdmin && !this.isExecutiveDirector && this.payload.chapter) {
        this.chapters = this.chapters.filter(ch => ch.name === this.payload.chapter);
      }
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error fetching chapters:', error);
      swalHelper.showToast('Failed to fetch chapters', 'error');
    }
  }

  async fetchUsers(): Promise<void> {
    this.loading = true;
    try {
      const requestData = {
        page: this.payload.page,
        limit: this.payload.limit,
        search: this.payload.search,
        chapter: this.payload.chapter
      };
      const response = await this.authService.getUsers(requestData);
      if (response) {
        this.users = response;
        this.cdr.detectChanges();
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      swalHelper.showToast('Failed to fetch users', 'error');
      this.users = { docs: [], totalDocs: 0, limit: this.payload.limit, page: this.payload.page, totalPages: 0 };
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  onSearch(): void {
    this.payload.page = 1;
    this.payload.search = this.searchQuery;
    this.searchSubject.next(this.searchQuery);
  }

  onChapterChange(): void {
    this.payload.page = 1;
    this.payload.chapter = this.selectedChapter || '';
    this.payload.search = '';
    this.searchQuery = '';
    this.fetchUsers();
  }

  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = '/assets/images/placeholder-image.png';
  }

  onChange(): void {
    this.payload.page = 1;
    this.fetchUsers();
  }

  onPageChange(page: number): void {
    if (page !== this.payload.page) {
      this.payload.page = page;
      this.fetchUsers();
    }
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'referrals' && this.selectedUser) {
      this.referralTab = 'given';
      this.referralsGiven = [];
      this.referralsReceived = [];
      this.referralPayload.givenPage = 1;
      this.referralPayload.receivedPage = 1;
      this.fetchReferrals();
    }
  }

  setReferralTab(tab: string): void {
    this.referralTab = tab;
    this.referralPayload.givenPage = 1;
    this.referralPayload.receivedPage = 1;
    this.fetchReferrals();
  }

  async fetchReferrals(): Promise<void> {
    if (!this.selectedUser?._id) {
      console.warn('No user ID available for fetching referrals');
      return;
    }

    this.referralLoading = true;
    try {
      let response;
      if (this.referralTab === 'given') {
        response = await this.referralService.getReferralsGiven(this.selectedUser._id, {
          page: this.referralPayload.givenPage,
          limit: this.referralPayload.limit
        });
        this.referralsGiven = (response?.data && Array.isArray(response.data.docs)) ? response.data.docs : [];
        this.referralsGivenTotal = response?.data?.totalDocs || 0;
      } else {
        response = await this.referralService.getReferralsReceived(this.selectedUser._id, {
          page: this.referralPayload.receivedPage,
          limit: this.referralPayload.limit
        });
        this.referralsReceived = (response?.data && Array.isArray(response.data.docs)) ? response.data.docs : [];
        this.referralsReceivedTotal = response?.data?.totalDocs || 0;
      }
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error fetching referrals:', error);
      swalHelper.showToast('Failed to fetch referrals', 'error');
      this.referralsGiven = [];
      this.referralsReceived = [];
      this.referralsGivenTotal = 0;
      this.referralsReceivedTotal = 0;
    } finally {
      this.referralLoading = false;
      this.cdr.detectChanges();
    }
  }

  onGivenReferralPageChange(page: number): void {
    if (page !== this.referralPayload.givenPage) {
      this.referralPayload.givenPage = page;
      this.fetchReferrals();
    }
  }

  onReceivedReferralPageChange(page: number): void {
    if (page !== this.referralPayload.receivedPage) {
      this.referralPayload.receivedPage = page;
      this.fetchReferrals();
    }
  }

  viewUserDetails(user: any): void {
    this.selectedUser = user;
    this.activeTab = 'profile';
    this.referralTab = 'given';
    this.referralsGiven = [];
    this.referralsReceived = [];
    this.referralsGivenTotal = 0;
    this.referralsReceivedTotal = 0;

    if (this.userDetailsModal) {
      this.userDetailsModal.show();
    } else {
      try {
        const modalElement = document.getElementById('userDetailsModal');
        if (modalElement) {
          const modalInstance = new bootstrap.Modal(modalElement);
          this.userDetailsModal = modalInstance;
          modalInstance.show();
        } else {
          $('#userDetailsModal').modal('show');
        }
      } catch (error) {
        console.error('Error showing modal:', error);
        $('#userDetailsModal').modal('show');
      }
    }
  }

  openEmailModal(user: any): void {
    if (!this.isAdmin && !this.isExecutiveDirector) return; // Non-admin and non-executive director cannot access
    this.selectedUser = user;
    this.emailForm = {
      userId: user._id,
      subject: '',
      message: '',
      attachment: null,
      recipients: [user.email] as string[],
      isBulkEmail: false
    };
    this.emailError = {
      subject: '',
      message: '',
      recipients: ''
    };

    if (this.emailModal) {
      this.emailModal.show();
    } else {
      $('#emailModal').modal('show');
    }
  }

  openBulkEmailModal(): void {
    if (!this.isAdmin && !this.isExecutiveDirector) return; // Non-admin and non-executive director cannot access
    this.selectedUser = null;
    
    // Auto-calculate recipients based on current filters
    const availableUsers = this.getFilteredUsers();
    const recipients = availableUsers.map(user => user.email).filter(email => email);
    
    this.emailForm = {
      userId: '',
      subject: '',
      message: '',
      attachment: null,
      recipients: recipients,
      isBulkEmail: true
    };
    this.emailError = {
      subject: '',
      message: '',
      recipients: ''
    };

    if (this.emailModal) {
      this.emailModal.show();
    } else {
      $('#emailModal').modal('show');
    }
  }

  closeEmailModal(): void {
    if (this.emailModal) {
      this.emailModal.hide();
    } else {
      $('#emailModal').modal('hide');
    }
  }

  validateEmailForm(): boolean {
    let isValid = true;
    this.emailError = { subject: '', message: '', recipients: '' };

    if (!this.emailForm.subject.trim()) {
      this.emailError.subject = 'Subject is required';
      isValid = false;
    }
    if (!this.emailForm.message.trim()) {
      this.emailError.message = 'Message is required';
      isValid = false;
    }
    if (this.emailForm.isBulkEmail && (!this.emailForm.recipients || this.emailForm.recipients.length === 0)) {
      this.emailError.recipients = 'No recipients found with current filters';
      isValid = false;
    }
    return isValid;
  }

  async sendEmail(): Promise<void> {
    if (!this.validateEmailForm()) {
      return;
    }

    let recipients: string[] = [];
    
    if (this.emailForm.isBulkEmail) {
      recipients = this.emailForm.recipients;
    } else {
      const receiverEmail = this.selectedUser?.email;
      if (!receiverEmail) {
        this.emailError.message = 'User email not available';
        swalHelper.showToast('User email not available', 'error');
        return;
      }
      recipients = [receiverEmail];
    }

    this.emailLoading = true;
    try {
      const payload = {
        to: recipients,
        subject: this.emailForm.subject.trim(),
        html: this.emailForm.message.trim(),
        text: this.emailForm.message.trim()
      };

      const result = await firstValueFrom(
        this.http.post<any>(`${environment.baseURL}/admin/send-custom-email`, payload)
      );

      if (result.success) {
        const recipientCount = recipients.length;
        swalHelper.showToast(`Email sent successfully to ${recipientCount} recipient(s)`, 'success');
        this.closeEmailModal();
      } else {
        swalHelper.showToast(result.message || 'Failed to send email', 'error');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      swalHelper.showToast('Failed to send email', 'error');
    } finally {
      this.emailLoading = false;
      this.cdr.detectChanges();
    }
  }

  onFileSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.emailForm.attachment = file;
    }
  }

  onRecipientChange(selectedEmails: string[]): void {
    this.emailForm.recipients = selectedEmails;
    this.emailError.recipients = '';
  }

  getAvailableUsers(): any[] {
    return this.users?.docs || [];
  }

  getFilteredUsers(): any[] {
    // Return users based on current filters
    // If no chapter filter is applied, return all users
    // If chapter filter is applied, return only users from that chapter
    let filteredUsers = this.users?.docs || [];
    
    // Filter by chapter if selected (only if selectedChapter is not null/empty)
    if (this.selectedChapter && this.selectedChapter.trim() !== '' && this.selectedChapter !== 'All') {
      filteredUsers = filteredUsers.filter((user: any) => 
        user.chapter_name && user.chapter_name === this.selectedChapter
      );
    }
    
    // Filter by search query if applied
    if (this.searchQuery && this.searchQuery.trim()) {
      const searchTerm = this.searchQuery.toLowerCase().trim();
      filteredUsers = filteredUsers.filter((user: any) => 
        user.name?.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm) ||
        user.mobile_number?.includes(searchTerm)
      );
    }
    
    return filteredUsers;
  }

  openWhatsAppModal(user: any): void {
    if (!this.isAdmin && !this.isExecutiveDirector) return; // Non-admin and non-executive director cannot access
    swalHelper.showToast('Please contact info@gmail.com for buying WhatsApp software then use.', 'info');

    // this.selectedUser = user;
    // this.whatsappForm = {
    //   userId: user._id,
    //   message: '',
    //   includeLink: false,
    //   link: ''
    // };
    // this.whatsappError = {
    //   message: ''
    // };

    // if (this.whatsappModal) {
    //   this.whatsappModal.show();
    // } else {
    //   $('#whatsappModal').modal('show');
    // }
  }

  closeWhatsAppModal(): void {
    if (this.whatsappModal) {
      this.whatsappModal.hide();
    } else {
      $('#whatsappModal').modal('hide');
    }
  }

  validateWhatsAppForm(): boolean {
    let isValid = true;
    this.whatsappError = { message: '' };

    if (!this.whatsappForm.message.trim()) {
      this.whatsappError.message = 'Message is required';
      isValid = false;
    }
    return isValid;
  }

  private formatIndianPhone(mobile: string | null | undefined): string {
    const raw = (mobile ?? '').toString().trim();
    if (!raw) return '';
    if (raw.startsWith('+')) return raw;
    const digits = raw.split('').filter(ch => ch >= '0' && ch <= '9').join('');
    if (digits.startsWith('91') && digits.length === 12) {
      return `+${digits}`;
    }
    let ten = digits;
    while (ten.startsWith('0')) ten = ten.slice(1);
    if (ten.length === 10) {
      return `+91${ten}`;
    }
    return `+91${digits}`;
  }

  async sendWhatsApp(): Promise<void> {
    if (!this.validateWhatsAppForm()) {
      return;
    }

    const phoneNumber = this.formatIndianPhone(this.selectedUser?.mobile_number);
    if (!phoneNumber) {
      this.whatsappError.message = 'User mobile number not available';
      swalHelper.showToast('User mobile number not available', 'error');
      return;
    }

    this.whatsappLoading = true;
    try {
      let message = this.whatsappForm.message.trim();
      if (this.whatsappForm.includeLink && this.whatsappForm.link) {
        message += ' ' + this.whatsappForm.link.trim();
      }

      const payload = { phoneNumber, message };

      const result = await firstValueFrom(
        this.http.post<any>('https://whatsapp.itfuturz.in/send-message', payload)
      );

      swalHelper.showToast('WhatsApp message sent', 'success');
      this.closeWhatsAppModal();
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      swalHelper.showToast('Failed to send WhatsApp message', 'error');
    } finally {
      this.whatsappLoading = false;
      this.cdr.detectChanges();
    }
  }

  openNotificationModal(user: any): void {
    if (!this.isAdmin && !this.isExecutiveDirector) return; // Non-admin and non-executive director cannot access
    this.selectedUser = user;
    this.notificationForm = {
      userId: user._id,
      title: '',
      description: '',
      message: ''
    };
    this.notificationError = {
      title: '',
      description: ''
    };
    if (this.notificationModal) {
      this.notificationModal.show();
    } else {
      try {
        const modalElement = document.getElementById('notificationModal');
        if (modalElement) {
          const modalInstance = new bootstrap.Modal(modalElement);
          this.notificationModal = modalInstance;
          modalInstance.show();
        } else {
          $('#notificationModal').modal('show');
        }
      } catch (error) {
        console.error('Error showing notification modal:', error);
        $('#notificationModal').modal('show');
      }
    }
  }

  closeNotificationModal(): void {
    if (this.notificationModal) {
      this.notificationModal.hide();
    } else {
      $('#notificationModal').modal('hide');
    }
  }

  validateNotificationForm(): boolean {
    let isValid = true;
    this.notificationError = { title: '', description: '' };

    if (!this.notificationForm.title.trim()) {
      this.notificationError.title = 'Title is required';
      isValid = false;
    }
    if (!this.notificationForm.description.trim()) {
      this.notificationError.description = 'Description is required';
      isValid = false;
    }
    return isValid;
  }

  async sendNotification(): Promise<void> {
    if (!this.validateNotificationForm()) {
      return;
    }

    this.notificationLoading = true;
    try {
      const response = await this.authService.sendNotification(this.notificationForm);
      if (response.success) {
        swalHelper.showToast('Notification sent successfully', 'success');
        this.closeNotificationModal();
      } else {
        swalHelper.showToast(response.message || 'Failed to send notification', 'error');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      swalHelper.showToast('Failed to send notification', 'error');
    } finally {
      this.notificationLoading = false;
      this.cdr.detectChanges();
    }
  }

  editUser(user: any): void {
    if (!this.isAdmin && !this.isExecutiveDirector) return; // Non-admin and non-executive director cannot access
    this.selectedUser = user;
    this.editForm = {
      name: user.name || '',
      mobile_number: user.mobile_number || '',
      email: user.email || '',
      role: user.role || 'Member'
    };
    this.editError = { name: '', mobile_number: '', email: '', role: '' };

    if (this.editUserModal) {
      this.editUserModal.show();
    } else {
      try {
        const modalElement = document.getElementById('editUserModal');
        if (modalElement) {
          const modalInstance = new bootstrap.Modal(modalElement);
          this.editUserModal = modalInstance;
          modalInstance.show();
        } else {
          $('#editUserModal').modal('show');
        }
      } catch (error) {
        console.error('Error showing edit modal:', error);
        $('#editUserModal').modal('show');
      }
    }
  }

  closeEditModal(): void {
    if (this.editUserModal) {
      this.editUserModal.hide();
    } else {
      $('#editUserModal').modal('hide');
    }
  }

  onMobileNumberInput(event: any): void {
    // Remove any non-digit characters
    let value = event.target.value.replace(/\D/g, '');
    
    // Limit to 10 digits
    if (value.length > 10) {
      value = value.substring(0, 10);
    }
    
    // Update the form value
    this.editForm.mobile_number = value;
    
    // Clear error if valid
    if (value.length === 10) {
      this.editError.mobile_number = '';
    }
  }

  validateEditForm(): boolean {
    let isValid = true;
    this.editError = { name: '', mobile_number: '', email: '', role: '' };

    if (!this.editForm.name.trim()) {
      this.editError.name = 'Name is required';
      isValid = false;
    }
    if (!this.editForm.mobile_number.trim()) {
      this.editError.mobile_number = 'Mobile number is required';
      isValid = false;
    } else if (!/^\d{10}$/.test(this.editForm.mobile_number)) {
      this.editError.mobile_number = 'Mobile number must be 10 digits';
      isValid = false;
    }
    if (!this.editForm.email.trim()) {
      this.editError.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.editForm.email)) {
      this.editError.email = 'Invalid email format';
      isValid = false;
    }
    if (!this.editForm.role) {
      this.editError.role = 'Role is required';
      isValid = false;
    }

    return isValid;
  }

  async updateUser(): Promise<void> {
    if (!this.validateEditForm()) {
      return;
    }

    this.editLoading = true;
    try {
      const response = await this.authService.updateUser(this.selectedUser._id, this.editForm);
      if (response.success) {
        swalHelper.showToast('User updated successfully', 'success');
        this.closeEditModal();
        this.fetchUsers();
      } else {
        swalHelper.showToast(response.message || 'Failed to update user', 'error');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      swalHelper.showToast('Failed to update user', 'error');
    } finally {
      this.editLoading = false;
      this.cdr.detectChanges();
    }
  }

  closeModal(): void {
    if (this.userDetailsModal) {
      this.userDetailsModal.hide();
    } else {
      $('#userDetailsModal').modal('hide');
    }
  }

  async toggleUserStatus(user: any): Promise<void> {
    if (!this.isAdmin && !this.isExecutiveDirector) return; // Non-admin and non-executive director cannot access
    try {
      this.loading = true;
      const response = await this.authService.toggleUserStatus({ id: user._id });
      if (response && response.success) {
        user.isActive = response.data;
        swalHelper.showToast(`User status changed to ${response.data ? 'Active' : 'Inactive'}`, 'success');
      } else {
        const errorMessage = response?.message || 'Failed to update user status';
        console.error('Toggle user status failed:', errorMessage);
        swalHelper.showToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      swalHelper.showToast('Failed to update user status', 'error');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async deleteUser(userId: string): Promise<void> {
    if (!this.isAdmin && !this.isExecutiveDirector) return; // Non-admin and non-executive director cannot access
    try {
      const result = await swalHelper.confirmation(
        'Delete User',
        'Are you sure you want to delete this user? This action cannot be undone.',
        'warning'
      );

      if (result.isConfirmed) {
        this.loading = true;
        const response = await this.authService.deleteUser(userId);
        if (response.success) {
          swalHelper.showToast('User deleted successfully', 'success');
          this.fetchUsers();
        } else {
          swalHelper.showToast(response.message || 'Failed to delete user', 'error');
        }
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      swalHelper.showToast('Failed to delete user', 'error');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  async generateUserPDF(): Promise<void> {
    this.pdfLoading = true;
    swalHelper.showToast('Generating User PDF, please wait...', 'info');

    try {
      const userId = this.selectedUser._id;
      if (!userId) {
        throw new Error('User ID is not available');
      }

      const pdfUrl = `${this.pathurl}/admin/${userId}/pdf`;
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${this.selectedUser.name || 'user'}_profile.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      swalHelper.showToast('PDF download initiated successfully', 'success');
    } catch (error) {
      console.error('Error initiating PDF download:', error);
      swalHelper.showToast('Failed to initiate PDF download', 'error');
    } finally {
      this.pdfLoading = false;
      this.cdr.detectChanges();
    }
  }

  async exportToPDF(): Promise<void> {
    this.exporting = true;
    swalHelper.showToast('Generating PDF, please wait...', 'info');

    const currentPage = this.payload.page;
    const currentLimit = this.payload.limit;
    const currentSearch = this.payload.search;
    const currentChapter = this.payload.chapter;

    const generatePDF = async (allUsers: any[]): Promise<void> => {
      try {
        const pdf = new jspdf.jsPDF('l', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;

        pdf.setFontSize(18);
        pdf.setTextColor(44, 62, 80);
        pdf.text('Member List Report', margin, margin + 10);

        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Generated on: ${new Date().toLocaleString()}`, margin, margin + 18);
        if (currentSearch) {
          pdf.text(`Search query: "${currentSearch}"`, margin, margin + 24);
        }
        if (currentChapter) {
          pdf.text(`Chapter: "${currentChapter}"`, margin, margin + 24);
        }

        const columns = [
          { header: 'Name', dataKey: 'name', width: 0.25 },
          { header: 'Business', dataKey: 'business', width: 0.25 },
          { header: 'Mobile', dataKey: 'mobile', width: 0.15 },
          { header: 'Email', dataKey: 'email', width: 0.20 },
          { header: 'Role', dataKey: 'role', width: 0.15 }
        ];

        const tableTop = margin + (currentChapter && currentSearch ? 36 : currentChapter || currentSearch ? 30 : 24);
        const tableWidth = pageWidth - (margin * 2);
        const rowHeight = 12;

        pdf.setFillColor(236, 240, 241);
        pdf.rect(margin, tableTop, tableWidth, rowHeight, 'F');

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(44, 62, 80);

        let xPos = margin;
        columns.forEach(column => {
          const colWidth = tableWidth * column.width;
          pdf.text(column.header, xPos + 3, tableTop + 8);
          xPos += colWidth;
        });

        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(50, 50, 50);

        let yPos = tableTop + rowHeight;
        let pageNo = 1;

        for (let i = 0; i < allUsers.length; i++) {
          const user = allUsers[i];

          if (yPos > pageHeight - margin) {
            pdf.addPage();
            pageNo++;

            pdf.setFillColor(236, 240, 241);
            pdf.rect(margin, margin, tableWidth, rowHeight, 'F');

            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(44, 62, 80);

            xPos = margin;
            columns.forEach(column => {
              const colWidth = tableWidth * column.width;
              pdf.text(column.header, xPos + 3, margin + 8);
              xPos += colWidth;
            });

            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(50, 50, 50);

            yPos = margin + rowHeight;
          }

          if (i % 2 === 1) {
            pdf.setFillColor(245, 245, 245);
            pdf.rect(margin, yPos, tableWidth, rowHeight, 'F');
          }

          const userData = {
            name: user.name || 'Unknown User',
            business: user.business && user.business.length > 0 ? user.business[0].business_name : 'N/A',
            mobile: user.mobile_number || 'N/A',
            email: user.email || 'N/A',
            role: user.role || 'N/A'
          };

          xPos = margin;
          columns.forEach(column => {
            const colWidth = tableWidth * column.width;
            // let text = userData[column.dataKey] || '';
            let text = (userData as any)[column.dataKey] || '';
            if (text.length > 25) {
              text = text.substring(0, 22) + '...';
            }
            pdf.text(text, xPos + 3, yPos + 8);
            xPos += colWidth;
          });

          pdf.setDrawColor(220, 220, 220);
          pdf.line(margin, yPos + rowHeight, margin + tableWidth, yPos + rowHeight);

          yPos += rowHeight;
        }

        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(150, 150, 150);
        pdf.setFontSize(8);

        const totalText = `Total Members: ${allUsers.length}`;
        pdf.text(totalText, margin, pageHeight - 10);

        for (let p = 1; p <= pageNo; p++) {
          pdf.setPage(p);
          pdf.text(`Page ${p} of ${pageNo}`, pageWidth - 30, pageHeight - 10);
        }

        pdf.save(`members_list${currentChapter ? `_${currentChapter}` : ''}.pdf`);
        swalHelper.showToast('PDF exported successfully', 'success');
      } catch (error) {
        console.error('Error generating PDF:', error);
        swalHelper.showToast('Failed to generate PDF', 'error');
      } finally {
        this.exporting = false;
      }
    };

    if (this.users.totalDocs <= this.users.docs.length) {
      generatePDF(this.users.docs);
    } else {
      const fetchAllUsers = async (): Promise<void> => {
        try {
          const requestData = {
            page: 1,
            limit: this.users.totalDocs,
            search: currentSearch,
            chapter: currentChapter
          };
          const response = await this.authService.getUsers(requestData);
          if (response && response.docs) {
            generatePDF(response.docs);
          } else {
            throw new Error('Failed to fetch all users');
          }
        } catch (error) {
          console.error('Error fetching all users for PDF:', error);
          swalHelper.showToast('Failed to fetch all users for PDF', 'error');
          this.exporting = false;
        }
      };
      fetchAllUsers();
    }
  }

  async exportToExcel(): Promise<void> {
    this.exporting = true;
    swalHelper.showToast('Generating Excel, please wait...', 'info');

    const currentPage = this.payload.page;
    const currentLimit = this.payload.limit;
    const currentSearch = this.payload.search;
    const currentChapter = this.payload.chapter;

    const generateExcel = async (allUsers: any[]): Promise<void> => {
      try {
        const userData = allUsers.map(user => ({
          Name: user.name || 'Unknown User',
          Business: user.business && user.business.length > 0 ? user.business[0].business_name : 'N/A',
          Mobile: user.mobile_number || 'N/A',
          Email: user.email || 'N/A',
          Role: user.role || 'N/A'
        }));

        const worksheet = XLSX.utils.json_to_sheet(userData);

        const columnWidths = [
          { wch: 30 },
          { wch: 40 },
          { wch: 20 },
          { wch: 30 },
          { wch: 20 }
        ];
        worksheet['!cols'] = columnWidths;

        const headers = ['Name', 'Business', 'Mobile', 'Email', 'Role'];
        headers.forEach((header, index) => {
          const cell = String.fromCharCode(65 + index) + '1';
          if (worksheet[cell]) {
            worksheet[cell].s = {
              font: { bold: true },
              fill: { fgColor: { rgb: 'ECEFF1' } }
            };
          }
        });

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Members');

        const metadata = [
          ['Report', 'Member List Report'],
          ['Generated on', new Date().toLocaleString()],
          ['Search query', currentSearch || 'None'],
          ['Chapter', currentChapter || 'All'],
          ['Total Members', allUsers.length.toString()]
        ];
        const metadataSheet = XLSX.utils.aoa_to_sheet(metadata);
        metadataSheet['!cols'] = [{ wch: 20 }, { wch: 40 }];
        XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadata');

        XLSX.writeFile(workbook, `members_list${currentChapter ? `_${currentChapter}` : ''}.xlsx`);
        swalHelper.showToast('Excel exported successfully', 'success');
      } catch (error) {
        console.error('Error generating Excel:', error);
        swalHelper.showToast('Failed to generate Excel', 'error');
      } finally {
        this.exporting = false;
      }
    };

    if (this.users.totalDocs <= this.users.docs.length) {
      generateExcel(this.users.docs);
    } else {
      const fetchAllUsers = async (): Promise<void> => {
        try {
          const requestData = {
            page: 1,
            limit: this.users.totalDocs,
            search: currentSearch,
            chapter: currentChapter
          };
          const response = await this.authService.getUsers(requestData);
          if (response && response.docs) {
            generateExcel(response.docs);
          } else {
            throw new Error('Failed to fetch all users');
          }
        } catch (error) {
          console.error('Error fetching all users for Excel:', error);
          swalHelper.showToast('Failed to fetch all users for Excel', 'error');
          this.exporting = false;
        }
      };
      fetchAllUsers();
    }
  }
}