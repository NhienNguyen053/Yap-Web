import { Component, ElementRef, HostListener, OnInit, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { jwtDecode } from 'jwt-decode';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    standalone: false
})
export class HeaderComponent implements OnInit {
    @ViewChild('userMenu', { static: false }) userMenuRef!: ElementRef;
    theme: string = localStorage.getItem('theme') || 'light';
    userInfo: any;
    showMenu: boolean = false;

    constructor(private router: Router) { }

    ngOnInit() {
        document.documentElement.setAttribute('data-theme', this.theme);
        this.decodeToken();
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.theme);
        document.documentElement.setAttribute('data-theme', this.theme);
    }

    goToHome() {
        this.router.navigate(['/']);
    }

    goToSignIn() {
        this.router.navigate(['/login']);
    }

    goToDownload() {
        // this.router.navigate(['/downloads']);
    }

    decodeToken() {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                this.userInfo = decoded;
            } catch (err) {
                console.error('Failed to decode token:', err);
            }
        }
    }

    toggleUserMenu() {
        this.showMenu = !this.showMenu;
    }

    logout() {
        localStorage.removeItem('token');
        this.userInfo = null;
        this.router.navigate(['/']);
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        const clickedInside = this.userMenuRef?.nativeElement.contains(event.target);
        if (!clickedInside) {
            this.showMenu = false;
        }
    }
}
