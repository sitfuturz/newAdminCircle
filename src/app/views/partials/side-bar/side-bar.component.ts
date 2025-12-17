import { AppWorker } from './../../../core/workers/app.worker';
import { Component, HostListener, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { SideBarService } from './side-bar.service';
import { CommonModule } from '@angular/common';
import { AppStorage } from 'src/app/core/utilities/app-storage';
import { swalHelper } from 'src/app/core/constants/swal-helper';
import { AuthService } from 'src/app/services/auth.service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.scss'],
})
export class SideBarComponent implements OnInit, OnDestroy, AfterViewInit {
  constructor(
    private router: Router,
    private storage: AppStorage,
    public authService: AuthService,
    public sideBarService: SideBarService,

    public appWorker: AppWorker,
  ) {}

  isSidebarOpen = false;
  isMobile = false;
  activeSubMenuIndex: number | null = null;
  private routerSubscription?: Subscription;
  
  // Report routes that should auto-expand Reports Sections
  private reportRoutes = [
    'referralReport',
    'testimonialReport',
    'oneTooneReport',
    'tyfcb',
    'VisitorsReport',
    'askManagement',
    'pointHistory',
    'attendanceRecord'
  ];
  
  // Content Management routes that should auto-expand Content Management
  private contentManagementRoutes = [
    'banners',
    'badges',
    'badgeManagement'
  ];

  // Icon mapping from Feather to Font Awesome
  private iconMap: { [key: string]: string } = {
    'home': 'fas fa-home',
    'user-plus': 'fas fa-user-plus',
    'users': 'fas fa-users',
    'file-text': 'fas fa-file-text',
    'calendar-check': 'fas fa-calendar-check',
    'file-import': 'fas fa-file-import',
    'globe': 'fas fa-globe',
    'map': 'fas fa-map',
    'map-pin': 'fas fa-map-marker-alt',
    'layers': 'fas fa-layer-group',
    'tag': 'fas fa-tag',
    'list': 'fas fa-list',
    'banner': 'fas fa-flag',
    'award': 'fas fa-award',
    'clipboard-list': 'fas fa-clipboard-list',
    'lock': 'fas fa-lock',
    'calendar': 'fas fa-calendar',
    'check-circle': 'fas fa-check-circle',
    'check-square': 'fas fa-check-square',
    'corner-up-right': 'fas fa-external-link-alt',
    'corner-down-left': 'fas fa-reply',
    'message-square': 'fas fa-comment',
    'user-check': 'fas fa-user-check',
    'trending-up': 'fas fa-chart-line',
    'user': 'fas fa-user',
    'question-circle': 'fas fa-question-circle',
    'history': 'fas fa-history',
    'clipboard': 'fas fa-clipboard',
    'credit-card': 'fas fa-credit-card',
    'cog': 'fas fa-cog',
    'log-out': 'fas fa-sign-out-alt',
    'key': 'fas fa-key',
    'settings': 'fas fa-cogs',
    'layout': 'fas fa-th-large',
    'bar-chart': 'fas fa-chart-bar',
    'podcast': 'fas fa-podcast',
    'chevron-down': 'fas fa-chevron-down',
    'chevron-right': 'fas fa-chevron-right',
    'user-cog': 'fas fa-user-cog'
  };

  ngOnInit() {
    this.checkScreenSize();
    console.log('Sidebar initialized - isMobile:', this.isMobile, 'isSidebarOpen:', this.isSidebarOpen);
    
    // Check initial route and auto-expand Reports Sections if needed
    this.checkAndExpandReportsSection();
    
    // Subscribe to router events to auto-expand Reports Sections on navigation
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.checkAndExpandReportsSection();
      });
  }

  ngAfterViewInit() {
    // Double-check after view initialization
    setTimeout(() => {
      this.checkScreenSize();
      console.log('After view init - isMobile:', this.isMobile);
    }, 100);
  }

  ngOnDestroy() {
    // Clean up router subscription
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  // Enhanced to handle different breakpoints with debugging
  checkScreenSize() {
    const width = window.innerWidth;
    const previousMobile = this.isMobile;
    this.isMobile = width < 992;
    
    console.log('Screen width:', width, 'isMobile:', this.isMobile);
    
    // Auto-close sidebar when switching to desktop
    if (!this.isMobile && this.isSidebarOpen) {
      this.isSidebarOpen = false;
      console.log('Auto-closing sidebar for desktop');
    }
    
    // Log state changes
    if (previousMobile !== this.isMobile) {
      console.log('Mobile state changed from', previousMobile, 'to', this.isMobile);
    }
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
    console.log('Sidebar toggled - isSidebarOpen:', this.isSidebarOpen, 'isMobile:', this.isMobile);
    
    // Force detection if needed
    if (this.isMobile && this.isSidebarOpen) {
      // Add a small delay to ensure DOM updates
      setTimeout(() => {
        const sidebar = document.getElementById('sidebar');
        console.log('Sidebar element:', sidebar, 'Classes:', sidebar?.className);
      }, 50);
    }
  }

  closeSidebar() {
    if (this.isMobile) {
      this.isSidebarOpen = false;
      console.log('Sidebar closed on mobile');
    }
  }

  // Method to get Font Awesome class for given icon name
  getIconClass(iconName: string): string {
    return this.iconMap[iconName] || 'fas fa-circle';
  }

  // Enhanced submenu handling
  toggleSubMenu(index: number) {
    if (this.activeSubMenuIndex === index) {
      this.activeSubMenuIndex = null;
    } else {
      this.activeSubMenuIndex = index;
    }
    console.log('Submenu toggled - activeIndex:', this.activeSubMenuIndex);
  }

  // Check if submenu is active
  isSubMenuActive(index: number): boolean {
    return this.activeSubMenuIndex === index;
  }

  // Enhanced navigation with automatic sidebar closing
  navigateToRoute(link: string, queryParams?: any) {
    console.log('Navigating to:', link, 'with params:', queryParams);
    this.router.navigate([link], { queryParams: queryParams || {} });
    this.closeSidebar();
  }

  // Check if any submenu item is active
  isParentMenuActive(submenu: any[]): boolean {
    return submenu.some(item => this.router.url.includes(item.link));
  }

  // Check if current route is a report route and auto-expand Reports Sections
  // Also check for Content Management routes
  checkAndExpandReportsSection(): void {
    const currentUrl = this.router.url;
    // Remove query params and hash for cleaner matching
    const urlPath = currentUrl.split('?')[0].split('#')[0];
    
    // Check for report routes
    const isReportRoute = this.reportRoutes.some(route => {
      // Check for route in URL path (handles both /route and #/route formats)
      return urlPath.includes(`/${route}`) || 
             urlPath.includes(`#/${route}`) ||
             urlPath.endsWith(`/${route}`) ||
             urlPath === `/${route}`;
    });
    
    // Check for content management routes
    const isContentManagementRoute = this.contentManagementRoutes.some(route => {
      return urlPath.includes(`/${route}`) || 
             urlPath.includes(`#/${route}`) ||
             urlPath.endsWith(`/${route}`) ||
             urlPath === `/${route}`;
    });
    
    if (isReportRoute) {
      // Find the index of "Reports Sections" menu item
      const reportsSectionIndex = this.findReportsSectionIndex();
      if (reportsSectionIndex !== -1 && this.activeSubMenuIndex !== reportsSectionIndex) {
        this.activeSubMenuIndex = reportsSectionIndex;
        console.log('Auto-expanded Reports Sections for route:', currentUrl);
      }
    } else if (isContentManagementRoute) {
      // Find the index of "Content Management" menu item
      const contentManagementIndex = this.findContentManagementIndex();
      if (contentManagementIndex !== -1 && this.activeSubMenuIndex !== contentManagementIndex) {
        this.activeSubMenuIndex = contentManagementIndex;
        console.log('Auto-expanded Content Management for route:', currentUrl);
      }
    }
  }
  
  // Find the index of "Reports Sections" menu item within the module's menus array
  findReportsSectionIndex(): number {
    if (!this.sideBarService.list || this.sideBarService.list.length === 0) {
      return -1;
    }
    
    // Since the template uses index within module.menus, we need to find it there
    // The template structure: *ngFor="let module of sideBarService.list" then *ngFor="let item of module.menus; let i = index"
    for (const module of this.sideBarService.list) {
      if (module.menus) {
        for (let i = 0; i < module.menus.length; i++) {
          if (module.menus[i].title === 'Reports Sections' && module.menus[i].hasSubmenu) {
            return i; // Return the index within the module's menus array
          }
        }
      }
    }
    return -1;
  }
  
  // Find the index of "Content Management" menu item within the module's menus array
  findContentManagementIndex(): number {
    if (!this.sideBarService.list || this.sideBarService.list.length === 0) {
      return -1;
    }
    
    for (const module of this.sideBarService.list) {
      if (module.menus) {
        for (let i = 0; i < module.menus.length; i++) {
          if (module.menus[i].title === 'Content Management' && module.menus[i].hasSubmenu) {
            return i; // Return the index within the module's menus array
          }
        }
      }
    }
    return -1;
  }

  logout = async () => {
    let confirm = await swalHelper.confirmation(
      'Logout',
      'Do you really want to logout',
      'question'
    );
    if (confirm.isConfirmed) {
      this.storage.clearAll();
      this.router.navigate(['/adminLogin']);
    }
  };
}