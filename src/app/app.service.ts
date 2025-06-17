import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Injectable({
    providedIn: 'root'
})
export class AppService {
    constructor(
        private router: Router,
    ) { }

    toggleTheme(theme: any) {
        theme = theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
        return theme;
    }

    logout() {
        localStorage.removeItem('token');
        this.router.navigate(['/']);
        return null;
    }

    decodeToken() {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                return decoded;
            } catch (err) {
                console.error('Failed to decode token:', err);
            }
        }
    }

    parseQueryString(query: string): { [key: string]: string } {
        return query
            .split('&')
            .map(pair => pair.split('='))
            .reduce((acc, [key, value]) => {
                if (key) acc[key] = value || '';
                return acc;
            }, {} as { [key: string]: string });
    }
}