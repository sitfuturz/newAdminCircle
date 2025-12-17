// ========== COMPONENT UPDATE (login.component.ts) ==========

import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AppStorage } from '../../../core/utilities/app-storage';
import { common } from '../../../core/constants/common';
import { swalHelper } from '../../../core/constants/swal-helper';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class AdminLoginComponent implements OnInit, OnDestroy {
  isPassword: boolean = true;
  isNewPassword: boolean = true;
  isLoading: boolean = false;
  showForgotPassword: boolean = false;
  showResetFields: boolean = false;
  currentYear = new Date().getFullYear();

  // Auto-detection properties
  isCheckingEmail: boolean = false;
  userFoundMessage: string = '';
  private emailChangeSubject = new Subject<string>();
  
  // Chapter data - removed as chapter option is no longer needed
  // chapters: ChapterFull[] = [];
  // chaptersLoading: boolean = false;

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(5)]),
    role: new FormControl('', [Validators.required]),
    // chapter: new FormControl('', [Validators.required]), // Removed chapter field
  });

  forgotPasswordForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    code: new FormControl(''),
    password: new FormControl(''),
  });

  constructor(
    private authService: AuthService,
    private router: Router,
    private storage: AppStorage
  ) {
    document.body.style.backgroundColor = '#3949AB';
  }

  ngOnInit(): void {
    if (this.storage.get(common.TOKEN)) {
      const userData = this.storage.get('user');
      if (userData && userData.role === 'LT') {
        this.router.navigate(['/users']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    }

    // Fetch chapters on component initialization - removed as chapter option is no longer needed
    // this.fetchChapters();

    // Setup email change listener
    this.emailChangeSubject.pipe(
      debounceTime(800),
      distinctUntilChanged()
    ).subscribe(email => {
      if (email && this.isValidEmail(email)) {
        this.checkUserDetails(email);
      }
    });
  }

  // Email change event handler
  onEmailChange(event: any): void {
    const email = event.target.value;

    // Clear previous messages
    this.userFoundMessage = '';

    // Reset role if email is cleared (chapter field removed)
    if (!email) {
      this.loginForm.patchValue({
        role: ''
        // chapter: '' // Removed chapter field
      });
      return;
    }

    this.emailChangeSubject.next(email);
  }

  // Email validation helper
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Fetch chapters from service - removed as chapter option is no longer needed
  /*
  async fetchChapters(): Promise<void> {
    this.chaptersLoading = true;
    try {
      const response = await this.chapterService.getAllChaptersForDropdown();
      this.chapters = response;
    } catch (error) {
      console.error('Error fetching chapters:', error);
      swalHelper.showToast('Failed to load chapters', 'error');
    } finally {
      this.chaptersLoading = false;
    }
  }
  */

  // Check user details by email
  async checkUserDetails(email: string): Promise<void> {
    this.isCheckingEmail = true;

    try {
      const response = await this.authService.checkUserByEmail(email);

      if (response && response.success && response.data && response.data.found) {
        const userData = response.data;

        // Auto-select role (chapter field removed)
        this.loginForm.patchValue({
          role: userData.role || ''
          // chapter: typeof userData.chapter === 'string' ? userData.chapter : (userData.chapter?._id || userData.chapter?.name || '') // Removed chapter field
        });

        this.userFoundMessage = `✓ ${userData.userType === 'admin' ? 'Admin' : 'User'} found - Role selected automatically`;

      } else {
        // Clear selections if user not found (chapter field removed)
        this.loginForm.patchValue({
          role: ''
          // chapter: '' // Removed chapter field
        });
        this.userFoundMessage = '';
      }
    } catch (error) {
      console.error('Error checking user details:', error);
      this.loginForm.patchValue({
        role: ''
        // chapter: '' // Removed chapter field
      });
      this.userFoundMessage = '';
    } finally {
      this.isCheckingEmail = false;
    }
  }

  togglePassword(): void {
    this.isPassword = !this.isPassword;
  }

  toggleNewPassword(): void {
    this.isNewPassword = !this.isNewPassword;
  }

  toggleForgotPassword(): void {
    this.showForgotPassword = !this.showForgotPassword;
    this.showResetFields = false;
    this.forgotPasswordForm.reset();

    this.forgotPasswordForm.get('code')?.clearValidators();
    this.forgotPasswordForm.get('password')?.clearValidators();
    this.forgotPasswordForm.get('code')?.updateValueAndValidity();
    this.forgotPasswordForm.get('password')?.updateValueAndValidity();
  }

  isCurrentStepValid(): boolean {
    if (!this.showResetFields) {
      return this.forgotPasswordForm.get('email')?.valid || false;
    } else {
      return (this.forgotPasswordForm.get('email')?.valid &&
        this.forgotPasswordForm.get('code')?.valid &&
        this.forgotPasswordForm.get('password')?.valid) || false;
    }
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach((key) => {
        const control = this.loginForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    try {
      const credentials = {
        email: this.loginForm.value.email as string,
        password: this.loginForm.value.password as string,
        role: this.loginForm.value.role as string,
        chapter: '', // Set empty string for chapter as it's still required by backend
      };

      const response = await this.authService.adminLogin(credentials);

      if (response && response.success && response.data && response.data.token) {
        this.storage.set(common.TOKEN, response.data.token);
        this.storage.set('user', response.data.admin);
        this.storage.set('franchise', response.data.admin.franchise);

        swalHelper.showToast('Login successful', 'success');

        const userRole = response.data.admin.role;
        if (userRole === 'LT') {
          this.router.navigate(['/users']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      swalHelper.showToast(error.message || 'Login failed. Please check your credentials.', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  async onForgotPasswordSubmit(): Promise<void> {
    if (!this.showResetFields) {
      if (this.forgotPasswordForm.get('email')?.invalid) {
        this.forgotPasswordForm.get('email')?.markAsTouched();
        return;
      }
    } else {
      const emailControl = this.forgotPasswordForm.get('email');
      const codeControl = this.forgotPasswordForm.get('code');
      const passwordControl = this.forgotPasswordForm.get('password');

      if (emailControl?.invalid || codeControl?.invalid || passwordControl?.invalid) {
        emailControl?.markAsTouched();
        codeControl?.markAsTouched();
        passwordControl?.markAsTouched();
        return;
      }
    }

    this.isLoading = true;
    try {
      if (!this.showResetFields) {
        const email = { email: this.forgotPasswordForm.value.email as string };
        const response = await this.authService.forgotPassword(email);

        if (response && response.success) {
          const successMessage = response.message || 'Password reset code sent to email';
          swalHelper.showToast(successMessage, 'success');

          this.showResetFields = true;

          this.forgotPasswordForm.get('code')?.setValidators([Validators.required]);
          this.forgotPasswordForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
          this.forgotPasswordForm.get('code')?.updateValueAndValidity();
          this.forgotPasswordForm.get('password')?.updateValueAndValidity();
        } else {
          const errorMessage = response?.message || 'Failed to send reset code';
          swalHelper.showToast(errorMessage, 'error');
        }
      } else {
        const resetData = {
          email: this.forgotPasswordForm.value.email as string,
          code: this.forgotPasswordForm.value.code as string,
          password: this.forgotPasswordForm.value.password as string,
        };

        const response = await this.authService.updatePassword(resetData);

        if (response && response.success) {
          const successMessage = response.message || 'Password updated successfully';
          swalHelper.showToast(successMessage, 'success');

          this.toggleForgotPassword();
        } else {
          const errorMessage = response?.message || 'Failed to update password';
          swalHelper.showToast(errorMessage, 'error');
        }
      }
    } catch (error: any) {
      console.error('Forgot Password Error:', error);

      let errorMessage = 'An error occurred';

      if (error.response?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      swalHelper.showToast(errorMessage, 'error');
    } finally {
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    document.body.style.backgroundColor = '';
    this.emailChangeSubject.unsubscribe();
  }
}