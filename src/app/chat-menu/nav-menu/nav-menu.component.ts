import { Component, ElementRef, HostListener, Input, ViewChild } from '@angular/core';
import { AppService } from '../../app.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MODAL_CONSTANTS } from '../../../constants/modal-constants';

@Component({
  selector: 'app-nav-menu',
  templateUrl: './nav-menu.component.html',
  styleUrl: './nav-menu.component.scss',
  standalone: false
})
export class NavMenuComponent {
  @ViewChild('profile') profile!: ElementRef;
  @Input() activeTab: any;
  @Input() userInfo: any;
  activeProfile: boolean = false;
  theme: string = localStorage.getItem('theme') || 'light';
  isModalOpen = false;
  logoutWarningModalId = MODAL_CONSTANTS.LOGOUT_WARNING;

  constructor(
    private appService: AppService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  navigate(path: string, event: Event) {
    event.preventDefault();
    const [cleanPath, query] = path.split('?');
    const queryParams = this.appService.parseQueryString(query || '');
    this.router.navigate([`/${cleanPath}`], { queryParams });
  }

  toggleTheme() {
    this.theme = this.appService.toggleTheme();
  }

  onTabClick(tab: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tab },
      queryParamsHandling: 'merge',
    });
  }

  logout() {
    this.isModalOpen = true;
  }

  confirmLogout() {
    this.userInfo = this.appService.logout();
  }

  @HostListener('document:click', ['$event.target'])
  onClickOutside(targetElement: HTMLElement) {
    const clickedInside = this.profile?.nativeElement.contains(targetElement);
    if (!clickedInside && this.activeProfile) {
      this.activeProfile = false;
    }
  }
}
