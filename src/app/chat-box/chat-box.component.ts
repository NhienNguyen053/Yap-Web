import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AppService } from '../app.service';

@Component({
  selector: 'app-chat-box',
  templateUrl: './chat-box.component.html',
  styleUrl: './chat-box.component.scss',
  standalone: false
})
export class ChatBoxComponent implements OnInit {
  @ViewChild('profile') profile!: ElementRef;
  theme: string = localStorage.getItem('theme') || 'light';
  userInfo: any;
  activeTab: string = 'chat';
  activeProfile: boolean = false;

  constructor(
    private router: Router,
    private appService: AppService
  ) { }

  ngOnInit() {
    document.documentElement.setAttribute('data-theme', this.theme);
    this.userInfo = this.appService.decodeToken();
  }

  toggleTheme() {
    this.theme = this.appService.toggleTheme(this.theme);
  }

  logout() {
    this.userInfo = this.appService.logout();
  }

  goToHome() {
    this.router.navigate(['/']);
  }

  @HostListener('document:click', ['$event.target'])
  onClickOutside(targetElement: HTMLElement) {
    const clickedInside = this.profile?.nativeElement.contains(targetElement);
    if (!clickedInside && this.activeProfile) {
      this.activeProfile = false;
    }
  }
}
