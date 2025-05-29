import { Component, ElementRef, HostListener, OnInit, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { AppService } from "../../app.service";

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

    navigate(path: string) {
        this.router.navigate([`/${path}`])
    }

    toggleUserMenu() {
        this.showMenu = !this.showMenu;
    }

    logout() {
        this.userInfo = this.appService.logout();
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        const clickedInside = this.userMenuRef?.nativeElement.contains(event.target);
        if (!clickedInside) {
            this.showMenu = false;
        }
    }
}
