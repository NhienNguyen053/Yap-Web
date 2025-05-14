import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    standalone: true,
    imports: [],
})
export class HeaderComponent implements OnInit {
    theme: string = localStorage.getItem('theme') || 'light';

    constructor(
            private router: Router,
    ) { }

    ngOnInit() {
        document.documentElement.setAttribute('data-theme', this.theme)
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
        this.router.navigate(['/login'])
    }

    goToDownload() {
        // this.router.navigate(['/downloads']);
    }
}