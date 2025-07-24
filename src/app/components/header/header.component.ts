import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { AppService } from "../../app.service";

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    standalone: false
})
export class HeaderComponent implements OnInit {
    theme: string = localStorage.getItem('theme') || 'light';
    userInfo: any;

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
}
