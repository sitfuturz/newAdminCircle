import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { RegisterUserAuthService, User } from '../../../services/auth.service';
import { CountryService, Country } from '../../../services/auth.service';
import { StateService, State } from '../../../services/auth.service';
import { CityService, City } from '../../../services/auth.service';
import { ChapterService, ChapterFull } from '../../../services/auth.service';
import { CategoryService, CategoryResponse, Category } from '../../../services/auth.service';
import { AuthService } from '../../../services/auth.service';
import { DashboardService } from '../../../services/auth.service';
import { swalHelper } from '../../../core/constants/swal-helper';
import { debounceTime, Subject } from 'rxjs';
import { CustomhelperService } from 'src/app/services/customhelper.service';

declare var $: any;
declare var bootstrap: any;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule],
  providers: [RegisterUserAuthService, CategoryService, CountryService, StateService, CityService, ChapterService, AuthService, DashboardService, CustomhelperService],
  templateUrl: './userRegisteration.component.html',
  styleUrls: ['./userRegisteration.component.css'],
})
export class RegisterComponent implements OnInit, AfterViewInit {
  registerForm: any = {
    name: '',
    email: '',
    mobile_number: '',
    chapter_name: '',
    profilePic: null,
    date_of_birth: '',
    city: '',
    state: '',
    country: '',
    sponseredBy: null,
    keywords: '',
    induction_date: '',
    category: '',
  };

  isAdmin: boolean = false;

  countries: Country[] = [];
  states: State[] = [];
  cities: City[] = [];
  chapters: ChapterFull[] = [];
  users: User[] = [];
  categories: Category[] = [];

  loading: boolean = false;
  countriesLoading: boolean = false;
  statesLoading: boolean = false;
  citiesLoading: boolean = false;
  chaptersLoading: boolean = false;
  usersLoading: boolean = false;
  categoriesLoading: boolean = false;

  countriesLoaded: boolean = false;
  statesLoaded: boolean = false;
  citiesLoaded: boolean = false;
  chaptersLoaded: boolean = false;
  usersLoaded: boolean = false;
  categoriesLoaded: boolean = false;

  touchedFields: any = {
    name: false,
    email: false,
    mobile_number: false,
    country: false,
    state: false,
    city: false,
    chapter_name: false,
    induction_date: false,
    category: false,
  };

  validationErrors: any = {
    name: '',
    email: '',
    mobile_number: '',
    country: '',
    state: '',
    city: '',
    chapter_name: '',
    induction_date: '',
    category: '',
  };


  private searchSubject = new Subject<string>();
  registerModal: any;

  constructor(
    private registerService: RegisterUserAuthService,
    private categoryService: CategoryService,
    private countryService: CountryService,
    private stateService: StateService,
    private cityService: CityService,
    private chapterService: ChapterService,
    private authService: AuthService,
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef,
    private customHelper: CustomhelperService
  ) {
    this.searchSubject.pipe(debounceTime(500)).subscribe(() => {
      this.fetchUsers();
    });
  }

  ngOnInit(): void {
    this.isAdmin = this.customHelper.getChapterAndIsAdmin().isAdmin;

    this.fetchCountries();
    this.fetchStates();
    this.fetchCities();
    this.fetchUsers();
    this.fetchCategories();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const modalElement = document.getElementById('registerModal');
      if (modalElement) {
        this.registerModal = new bootstrap.Modal(modalElement);
      }
    }, 300);
  }

  async fetchCategories(): Promise<void> {
    this.categoriesLoading = true;
    this.categoriesLoaded = false;
    try {
      const response = await this.categoryService.getCategories({ page: 1, limit: 1000, search: '' });
      this.categories = response.docs;
      this.categoriesLoaded = true;
    } catch (error) {
      console.error('Error fetching categories:', error);
      swalHelper.showToast('Failed to fetch categories', 'error');
    } finally {
      this.categoriesLoading = false;
      this.cdr.detectChanges();
    }
  }

  async fetchCountries(): Promise<void> {
    this.countriesLoading = true;
    this.countriesLoaded = false;
    try {
      const response = await this.countryService.getAllCountries({
        page: 1,
        limit: 1000,
        search: '',
      });
      this.countries = response.docs;
      this.countriesLoaded = true;
    } catch (error) {
      console.error('Error fetching countries:', error);
      swalHelper.showToast('Failed to fetch countries', 'error');
    } finally {
      this.countriesLoading = false;
      this.cdr.detectChanges();
    }
  }

  async fetchStates(): Promise<void> {
    this.statesLoading = true;
    this.statesLoaded = false;
    try {
      const response = await this.stateService.getAllStates({
        page: 1,
        limit: 1000,
        search: '',
      });
      this.states = response.docs;
      this.statesLoaded = true;
    } catch (error) {
      console.error('Error fetching states:', error);
      swalHelper.showToast('Failed to fetch states', 'error');
    } finally {
      this.statesLoading = false;
      this.cdr.detectChanges();
    }
  }

  async fetchCities(): Promise<void> {
    this.citiesLoading = true;
    this.citiesLoaded = false;
    try {
      const response = await this.cityService.getAllCities({
        page: 1,
        limit: 1000,
        search: '',
      });
      this.cities = response.docs;
      this.citiesLoaded = true;
    } catch (error) {
      console.error('Error fetching cities:', error);
      swalHelper.showToast('Failed to fetch cities', 'error');
    } finally {
      this.citiesLoading = false;
      this.cdr.detectChanges();
    }
  }

  async fetchChaptersByCity(cityName: string): Promise<void> {
    if (!cityName) {
      this.chapters = [];
      return;
    }

    this.chaptersLoading = true;
    this.chaptersLoaded = false;
    try {
      const response = await this.dashboardService.getChaptersByCity(cityName);
      this.chapters = response.data || response || [];
      this.chaptersLoaded = true;
    } catch (error) {
      console.error('Error fetching chapters by city:', error);
      swalHelper.showToast('Failed to fetch chapters', 'error');
      this.chapters = [];
    } finally {
      this.chaptersLoading = false;
      this.cdr.detectChanges();
    }
  }

  async fetchUsers(): Promise<void> {
    this.usersLoading = true;
    this.usersLoaded = false;
    try {
      const response = await this.authService.getUsers({
        page: 1,
        limit: 1000,
        search: '',
      });
      this.users = response.docs;
      this.usersLoaded = true;
    } catch (error) {
      console.error('Error fetching users:', error);
      swalHelper.showToast('Failed to fetch users', 'error');
    } finally {
      this.usersLoading = false;
      this.cdr.detectChanges();
    }
  }

  onCityChange(): void {
    this.registerForm.chapter_name = '';
    this.validationErrors.chapter_name = '';
    this.touchedFields.chapter_name = false;
    if (this.registerForm.city) {
      this.fetchChaptersByCity(this.registerForm.city);
    } else {
      this.chapters = [];
    }
  }

  onMobileInput(event: any): void {
    const input = event.target;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 10) {
      value = value.substring(0, 10);
    }
    this.registerForm.mobile_number = value;
    input.value = value;
    this.touchedFields.mobile_number = true;
    if (value.length === 10) {
      this.validationErrors.mobile_number = '';
    } else if (value.length > 0) {
      this.validateMobileNumber();
    }
  }

  validateName(): boolean {
    if (!this.touchedFields.name) {
      return true;
    }
    const name = this.registerForm.name.trim();
    if (!name) {
      this.validationErrors.name = 'Full name is required';
      return false;
    }
    if (name.length < 2) {
      this.validationErrors.name = 'Full name must be at least 2 characters';
      return false;
    }
    if (!/^[a-zA-Z\s]+$/.test(name)) {
      this.validationErrors.name = 'Full name can only contain letters and spaces';
      return false;
    }
    this.validationErrors.name = '';
    return true;
  }

  validateEmail(): boolean {
    if (!this.touchedFields.email) {
      return true;
    }
    const email = this.registerForm.email.trim();
    if (!email) {
      this.validationErrors.email = 'Email is required';
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.validationErrors.email = 'Please enter a valid email address';
      return false;
    }
    this.validationErrors.email = '';
    return true;
  }

  validateMobileNumber(): boolean {
    if (!this.touchedFields.mobile_number) {
      return true;
    }
    const mobile = this.registerForm.mobile_number;
    if (!mobile) {
      this.validationErrors.mobile_number = 'Mobile number is required';
      return false;
    }
    if (!/^\d{10}$/.test(mobile)) {
      this.validationErrors.mobile_number = 'Mobile number must be exactly 10 digits';
      return false;
    }
    this.validationErrors.mobile_number = '';
    return true;
  }

  validateCountry(): boolean {
    if (!this.touchedFields.country) {
      return true;
    }
    if (!this.registerForm.country) {
      this.validationErrors.country = 'Country is required';
      return false;
    }
    this.validationErrors.country = '';
    return true;
  }

  validateState(): boolean {
    if (!this.touchedFields.state) {
      return true;
    }
    if (!this.registerForm.state) {
      this.validationErrors.state = 'State is required';
      return false;
    }
    this.validationErrors.state = '';
    return true;
  }

  validateCity(): boolean {
    if (!this.touchedFields.city) {
      return true;
    }
    if (!this.registerForm.city) {
      this.validationErrors.city = 'City is required';
      return false;
    }
    this.validationErrors.city = '';
    return true;
  }

  validateChapter(): boolean {
    if (!this.touchedFields.chapter_name) {
      return true;
    }
    if (!this.registerForm.chapter_name) {
      this.validationErrors.chapter_name = 'Chapter is required';
      return false;
    }
    this.validationErrors.chapter_name = '';
    return true;
  }

  validateInductionDate(): boolean {
    if (!this.touchedFields.induction_date) {
      return true;
    }
    const induction_date = this.registerForm.induction_date;
    if (!induction_date) {
      this.validationErrors.induction_date = 'Induction date is required';
      return false;
    }
    const selectedDate = new Date(induction_date);
    const today = new Date();
    if (selectedDate > today) {
      this.validationErrors.induction_date = 'Induction date cannot be in the future';
      return false;
    }
    this.validationErrors.induction_date = '';
    return true;
  }

  validateCategory(): boolean {
    if (!this.touchedFields.category) {
      return true;
    }
    if (!this.registerForm.category) {
      this.validationErrors.category = 'Category is required';
      return false;
    }
    this.validationErrors.category = '';
    return true;
  }


  onFieldBlur(fieldName: string): void {
    this.touchedFields[fieldName] = true;
    switch (fieldName) {
      case 'name':
        this.validateName();
        break;
      case 'email':
        this.validateEmail();
        break;
      case 'mobile_number':
        this.validateMobileNumber();
        break;
      case 'country':
        this.validateCountry();
        break;
      case 'state':
        this.validateState();
        break;
      case 'city':
        this.validateCity();
        break;
      case 'chapter_name':
        this.validateChapter();
        break;
      case 'induction_date':
        this.validateInductionDate();
        break;
      case 'category':
        this.validateCategory();
        break;
    }
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.registerForm.profilePic = file;
    }
  }

  async registerUser(): Promise<void> {
    try {
      this.markAllRequiredFieldsAsTouched();
      if (!this.validateFormForSubmission()) {
        swalHelper.showToast('Please fix all validation errors', 'warning');
        return;
      }

      this.loading = true;
      const formData = new FormData();
      Object.keys(this.registerForm).forEach((key) => {
        if (key === 'profilePic' && this.registerForm[key]) {
          formData.append(key, this.registerForm[key]);
        } else if (key === 'induction_date' && this.registerForm[key]) {
          const formattedDate = new Date(this.registerForm[key]).toISOString().split('T')[0];
          formData.append(key, formattedDate);
        }
        else if (key === 'sponseredBy' && !this.registerForm[key]) {
    // skip adding sponsor if empty/null
  } else {
          formData.append(key, this.registerForm[key] || '');
        }
      });

      const response = await this.registerService.registerUser(formData);
      if (response && response.success) {
        swalHelper.showToast('User registered successfully', 'success');
        this.closeModal();
        this.resetForm();
      } else {
        swalHelper.showToast(response.message || 'Failed to register user', 'error');
      }
    } catch (error) {
      console.error('Error registering user:', error);
      swalHelper.showToast('Failed to register user', 'error');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  markAllRequiredFieldsAsTouched(): void {
    this.touchedFields.name = true;
    this.touchedFields.email = true;
    this.touchedFields.mobile_number = true;
    this.touchedFields.country = true;
    this.touchedFields.state = true;
    this.touchedFields.city = true;
    this.touchedFields.chapter_name = true;
    this.touchedFields.induction_date = true;
    this.touchedFields.category = true;
  }

  validateFormForSubmission(): boolean {
    const name = this.registerForm.name.trim();
    const email = this.registerForm.email.trim();
    const mobile = this.registerForm.mobile_number;
    const induction_date = this.registerForm.induction_date;

    let isValid = true;

    if (!name) {
      this.validationErrors.name = 'Full name is required';
      isValid = false;
    } else if (name.length < 2) {
      this.validationErrors.name = 'Full name must be at least 2 characters';
      isValid = false;
    } else if (!/^[a-zA-Z\s]+$/.test(name)) {
      this.validationErrors.name = 'Full name can only contain letters and spaces';
      isValid = false;
    } else {
      this.validationErrors.name = '';
    }

    if (!email) {
      this.validationErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.validationErrors.email = 'Please enter a valid email address';
      isValid = false;
    } else {
      this.validationErrors.email = '';
    }

    if (!mobile) {
      this.validationErrors.mobile_number = 'Mobile number is required';
      isValid = false;
    } else if (!/^\d{10}$/.test(mobile)) {
      this.validationErrors.mobile_number = 'Mobile number must be exactly 10 digits';
      isValid = false;
    } else {
      this.validationErrors.mobile_number = '';
    }

    if (!this.registerForm.country) {
      this.validationErrors.country = 'Country is required';
      isValid = false;
    } else {
      this.validationErrors.country = '';
    }

    if (!this.registerForm.state) {
      this.validationErrors.state = 'State is required';
      isValid = false;
    } else {
      this.validationErrors.state = '';
    }

    if (!this.registerForm.city) {
      this.validationErrors.city = 'City is required';
      isValid = false;
    } else {
      this.validationErrors.city = '';
    }

    if (!this.registerForm.chapter_name) {
      this.validationErrors.chapter_name = 'Chapter is required';
      isValid = false;
    } else {
      this.validationErrors.chapter_name = '';
    }

    if (!this.registerForm.category) {
      this.validationErrors.category = 'Category is required';
      isValid = false;
    } else {
      this.validationErrors.category = '';
    }


    if (!induction_date) {
      this.validationErrors.induction_date = 'Induction date is required';
      isValid = false;
    } else {
      const selectedDate = new Date(induction_date);
      const today = new Date();
      if (selectedDate > today) {
        this.validationErrors.induction_date = 'Induction date cannot be in the future';
        isValid = false;
      } else {
        this.validationErrors.induction_date = '';
      }
    }

    return isValid;
  }

  validateForm(): boolean {
    const name = this.registerForm.name.trim();
    const email = this.registerForm.email.trim();
    const mobile = this.registerForm.mobile_number;
    const induction_date = this.registerForm.induction_date;

    return (
      name &&
      name.length >= 2 &&
      /^[a-zA-Z\s]+$/.test(name) &&
      email &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
      mobile &&
      /^\d{10}$/.test(mobile) &&
      this.registerForm.country &&
      this.registerForm.state &&
      this.registerForm.city &&
      this.registerForm.chapter_name &&
      this.registerForm.category &&
      induction_date &&
      new Date(induction_date) <= new Date()
    );
  }

  resetForm(): void {
    this.registerForm = {
      name: '',
      email: '',
      mobile_number: '',
      chapter_name: '',
      profilePic: null,
      date_of_birth: '',
      city: '',
      state: '',
      country: '',
      sponseredBy: '',
      keywords: '',
      induction_date: '',
      category: '',
    };

    this.validationErrors = {
      name: '',
      email: '',
      mobile_number: '',
      country: '',
      state: '',
      city: '',
      chapter_name: '',
      induction_date: '',
      category: '',
    };

    this.touchedFields = {
      name: false,
      email: false,
      mobile_number: false,
      country: false,
      state: false,
      city: false,
      chapter_name: false,
      induction_date: false,
      category: false,
    };

    this.chapters = [];
  }

  showModal(): void {
    this.cdr.detectChanges();
    if (this.registerModal) {
      this.registerModal.show();
    } else {
      $('#registerModal').modal('show');
    }
  }

  closeModal(): void {
    if (this.registerModal) {
      this.registerModal.hide();
    } else {
      $('#registerModal').modal('hide');
    }
  }

  openRegisterModal(): void {
    this.resetForm();
    setTimeout(() => {
      this.showModal();
    }, 100);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }
}