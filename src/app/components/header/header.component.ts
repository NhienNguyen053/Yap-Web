import { Component, ElementRef, HostListener, OnInit, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { AppService } from "../../app.service";
import { MODAL_CONSTANTS } from "../../../constants/modal-constants";

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
    isModalOpen = false;
    logoutWarningModalId = MODAL_CONSTANTS.LOGOUT_WARNING;

    constructor(
        private router: Router,
        private appService: AppService
    ) { }

    ngOnInit() {
        this.appService.initTheme();
        this.userInfo = this.appService.decodeToken();
    }

    toggleTheme() {
        this.theme = this.appService.toggleTheme();
    }

    navigate(path: string) {
        this.router.navigate([`/${path}`])
    }

    toggleUserMenu() {
        this.showMenu = !this.showMenu;
    }

    logout() {
        this.isModalOpen = true;
    }

    confirmLogout() {
        this.userInfo = this.appService.logout(this.userInfo);
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        const clickedInside = this.userMenuRef?.nativeElement.contains(event.target);
        if (!clickedInside) {
            this.showMenu = false;
        }
    }
}
