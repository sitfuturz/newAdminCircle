import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxPaginationModule } from 'ngx-pagination';
import { 
  AuthService, 
  Franchise, 
  FranchiseListResponse, 
  CreateFranchiseRequest,
  StateService,
  State,
  CityService,
  City
} from '../../../services/auth.service';
import { swalHelper } from '../../../core/constants/swal-helper';
import { debounceTime, Subject } from 'rxjs';

declare var $: any;
declare var bootstrap: any;

@Component({
  selector: 'app-franchise',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgSelectModule, NgxPaginationModule],
  providers: [AuthService, StateService, CityService],
  templateUrl: './franchise.component.html',
  styleUrls: ['./franchise.component.css'],
})
export class FranchiseComponent implements OnInit, AfterViewInit {
  franchises: FranchiseListResponse = {
    message: '',
    data: {
      docs: [],
      totalDocs: 0,
      limit: 10,
      totalPages: 0,
      page: 1,
      pagingCounter: 1,
      hasPrevPage: false,
      hasNextPage: false,
      prevPage: null,
      nextPage: null
    },
    status: 200,
    success: true
  };

  states: State[] = [];
  cities: City[] = [];
  selectedState: string = '';
  selectedCity: string = '';
  
  loading: boolean = false;
  statesLoading: boolean = false;
  citiesLoading: boolean = false;
  searchQuery: string = '';
  selectedFranchise: Franchise | null = null;
  franchiseModal: any;
  editMode: boolean = false;
  statesLoaded: boolean = false;
  citiesLoaded: boolean = false;

  franchiseForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    state: new FormControl('', [Validators.required]),
    city: new FormControl('', [Validators.required]),
    franchiseeEmail: new FormControl('', [Validators.required, Validators.email]),
    investmentAmount: new FormControl(0, [Validators.required, Validators.min(0)])
  });

  private searchSubject = new Subject<string>();

  payload = {
    search: '',
    page: 1,
    limit: 10,
  };

  constructor(
    private authService: AuthService,
    private stateService: StateService,
    private cityService: CityService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fetchFranchises();
    this.fetchStates();
    
    // Setup search debouncing
    this.searchSubject.pipe(debounceTime(500)).subscribe(searchTerm => {
      this.payload.search = searchTerm;
      this.payload.page = 1;
      this.fetchFranchises();
    });
  }

  ngAfterViewInit(): void {
    this.initializeModals();
  }

  initializeModals(): void {
    // Initialize Bootstrap modals
    const modalElement = document.getElementById('franchiseModal');
    if (modalElement) {
      this.franchiseModal = new bootstrap.Modal(modalElement);
    }
  }

  onSearchChange(event: any): void {
    const searchTerm = event.target.value;
    this.searchSubject.next(searchTerm);
  }

  async fetchFranchises(): Promise<void> {
    this.loading = true;
    try {
      const response = await this.authService.getAllFranchises(
        this.payload.page,
        this.payload.limit,
        this.payload.search
      );
      this.franchises = response;
    } catch (error) {
      console.error('Error fetching franchises:', error);
    } finally {
      this.loading = false;
    }
  }

  async fetchStates(): Promise<void> {
    this.statesLoading = true;
    try {
      const response = await this.stateService.getAllStates({ page: 1, limit: 1000, search: '' });
      this.states = response.docs || [];
      this.statesLoaded = true;
    } catch (error) {
      console.error('Error fetching states:', error);
      swalHelper.showToast('Failed to load states', 'error');
    } finally {
      this.statesLoading = false;
    }
  }

  async onStateChange(): Promise<void> {
    const stateId = this.franchiseForm.get('state')?.value;
    await this.loadCitiesForState(stateId || '');
  }

  async loadCitiesForState(stateId: string, selectedCityName?: string): Promise<void> {
    if (stateId) {
      this.citiesLoading = true;
      try {
        // Get all cities and filter by state
        const response = await this.cityService.getAllCities({ page: 1, limit: 1000, search: '' });
        // Filter cities by state (assuming city has state_id or state_name field)
        this.cities = (response.docs || []).filter(city => 
          city.state_id === stateId || city.state_name === this.states.find(s => s._id === stateId)?.name
        );
        this.citiesLoaded = true;
        
        // If in edit mode and we have a selected city name, find and set the city ID
        if (this.editMode && selectedCityName) {
          const cityId = this.cities.find(c => c.name === selectedCityName)?._id;
          if (cityId) {
            this.franchiseForm.patchValue({ city: cityId });
          }
        } else {
          // Clear city selection when state changes (except in edit mode with preselected city)
          this.franchiseForm.patchValue({ city: '' });
        }
      } catch (error) {
        console.error('Error fetching cities:', error);
        swalHelper.showToast('Failed to load cities', 'error');
      } finally {
        this.citiesLoading = false;
      }
    } else {
      this.cities = [];
      this.citiesLoaded = false;
      this.franchiseForm.patchValue({ city: '' });
    }
  }

  onChange(): void {
    this.payload.page = 1;
    this.fetchFranchises();
  }

  onPageChange(page: number): void {
    this.payload.page = page;
    this.fetchFranchises();
  }

  showModal(): void {
    if (this.franchiseModal) {
      this.franchiseModal.show();
    }
  }

  hideModal(): void {
    if (this.franchiseModal) {
      this.franchiseModal.hide();
    }
  }

  openCreateFranchiseModal(): void {
    this.editMode = false;
    this.selectedFranchise = null;
    this.franchiseForm.reset();
    this.franchiseForm.patchValue({
      investmentAmount: 0
    });
    this.showModal();
  }

  async openEditFranchiseModal(franchise: Franchise): Promise<void> {
    if (!this.statesLoaded) {
      swalHelper.showToast('Please wait for states to load', 'warning');
      return;
    }
    this.editMode = true;
    this.selectedFranchise = franchise;
    
    // Handle both ID and name formats for state
    let stateId = franchise.state;
    let cityName = franchise.city;
    
    // If state is an ID, convert to ID; if it's a name, find the ID
    if (franchise.state && franchise.state.length > 20) {
      // It's already an ID
      stateId = franchise.state;
    } else {
      // It's a name, find the ID
      stateId = this.states.find(s => s.name === franchise.state)?._id || '';
    }
    
    // If city is an ID, find the name; if it's a name, use it directly
    if (franchise.city && franchise.city.length > 20) {
      // It's an ID, we'll find the name after loading cities
      cityName = '';
    } else {
      // It's already a name
      cityName = franchise.city;
    }
    
    // Populate form with franchise data
    this.franchiseForm.patchValue({
      name: franchise.name,
      state: stateId || '',
      city: '', // Will be set after cities load
      franchiseeEmail: franchise.franchisee.email,
      investmentAmount: franchise.investmentAmount
    });

    // Load cities for the selected state
    if (stateId) {
      await this.loadCitiesForState(stateId, cityName);
    }
    
    this.showModal();
  }

  async onSubmit(): Promise<void> {
    if (this.franchiseForm.invalid) {
      Object.keys(this.franchiseForm.controls).forEach((key) => {
        const control = this.franchiseForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    try {
      const formValue = this.franchiseForm.value;
      
      // Convert IDs to names for submission
      const stateName = this.states.find(s => s._id === formValue.state)?.name || '';
      const cityName = this.cities.find(c => c._id === formValue.city)?.name || '';
      
      const formData = {
        name: formValue.name,
        state: stateName,
        city: cityName,
        franchiseeEmail: formValue.franchiseeEmail,
        investmentAmount: formValue.investmentAmount
      } as CreateFranchiseRequest;
      
      if (this.editMode && this.selectedFranchise) {
        // Update existing franchise
        await this.authService.updateFranchise(this.selectedFranchise._id, formData);
        swalHelper.showToast('Franchise updated successfully', 'success');
      } else {
        // Create new franchise
        const response = await this.authService.createFranchise(formData);
        swalHelper.showToast('Franchise created successfully', 'success');
        
        // Show franchisee credentials if available
        if (response.data.franchiseeCredentials) {
          const credentials = response.data.franchiseeCredentials;
          swalHelper.showToast(
            `Franchisee credentials: Email: ${credentials.email}, Password: ${credentials.tempPassword}`,
            'info'
          );
        }
      }
      
      this.hideModal();
      this.fetchFranchises();
    } catch (error) {
      console.error('Error saving franchise:', error);
    } finally {
      this.loading = false;
    }
  }

async deleteFranchise(franchise: Franchise): Promise<void> {
  const confirmed = await swalHelper.takeConfirmation(
    'Delete Franchise',
    `Are you sure you want to delete "${franchise.name}"? This action cannot be undone.`,
    'Yes, Delete'
  );
  if (confirmed.isConfirmed) {
    this.loading = true;
    try {
      await this.authService.deleteFranchise(franchise._id);
      swalHelper.showToast('Franchise deleted successfully', 'success');
      this.fetchFranchises();
    } catch (error) {
      console.error('Error deleting franchise:', error);
    } finally {
      this.loading = false;
    }
  }
}

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }

  getStatusBadgeClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
        return 'badge bg-success';
      case 'inactive':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }

  trackByFn(index: number, item: any): any {
    return item._id || index;
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const totalPages = this.franchises.data.totalPages;
    const currentPage = this.franchises.data.page;
    
    // Show up to 5 pages around current page
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  getStateName(stateIdOrName: string): string {
    // If it's already a name (not an ID), return it
    if (!stateIdOrName || stateIdOrName.length < 20) {
      return stateIdOrName;
    }
    
    // If it's an ID, find the corresponding state name
    const state = this.states.find(s => s._id === stateIdOrName);
    return state ? state.name : stateIdOrName;
  }

  getCityName(cityIdOrName: string): string {
    // If it's already a name (not an ID), return it
    if (!cityIdOrName || cityIdOrName.length < 20) {
      return cityIdOrName;
    }
    
    // If it's an ID, find the corresponding city name
    const city = this.cities.find(c => c._id === cityIdOrName);
    return city ? city.name : cityIdOrName;
  }

  async toggleFranchiseStatus(franchise: Franchise): Promise<void> {
    try {
      this.loading = true;
      
      const updatedStatus = franchise.status === 'active' ? 'inactive' : 'active';
      
      const formData: CreateFranchiseRequest = {
        name: franchise.name,
        state: this.getStateName(franchise.state),
        city: this.getCityName(franchise.city),
        franchiseeEmail: franchise.franchisee.email,
        investmentAmount: franchise.investmentAmount
      };
      
      const response = await this.authService.updateFranchise(franchise._id, formData);
      
      if (response && response.success) {
        franchise.status = updatedStatus;
        swalHelper.showToast(`Franchise status changed to ${updatedStatus.charAt(0).toUpperCase() + updatedStatus.slice(1)}`, 'success');
      } else {
        swalHelper.showToast(response?.message || 'Failed to update franchise status', 'error');
      }
    } catch (error) {
      console.error('Error updating franchise status:', error);
      swalHelper.showToast('Failed to update franchise status', 'error');
    } finally {
      this.loading = false;
    }
  }
}
