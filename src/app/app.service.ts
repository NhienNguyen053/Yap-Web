import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { CONSTANTS } from '../constants/constants';
import { environment } from '../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AppService {
    myHeader = new HttpHeaders({
        'Content-Type': 'application/json',
    });

    constructor(
        private router: Router,
        private _http: HttpClient
    ) { }

    toggleTheme() {
        const current = localStorage.getItem('theme') || 'light';
        const newTheme = current === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        return newTheme;
    }

    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.applyTheme(savedTheme);
    }

    private applyTheme(theme: string) {
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }

    logout(userInfo: any, redirect: boolean = true) {
        const body = { publicKeyId: userInfo.PublicKeyId };

        this._http.post(environment.API_USER + CONSTANTS.API.USER.DELETE_PUBLIC_KEY, JSON.stringify(body), { headers: this.myHeader })
            .subscribe({
                next: () => {
                    this.clearLocalDataAndRedirect(redirect);
                },
                error: () => {
                    this.clearLocalDataAndRedirect(redirect);
                }
            });

        return null;
    }

    private clearLocalDataAndRedirect(redirect: boolean) {
        localStorage.removeItem('token');
        localStorage.removeItem('salt');
        localStorage.removeItem('publicKey');
        localStorage.removeItem('publicKeyId');
        localStorage.removeItem('privateKey');
        localStorage.removeItem('iv');
        indexedDB.deleteDatabase('YapDB');
        if (redirect) {
            this.router.navigate(['/']).then(() => {
                window.location.reload();
            });
        }
    }

    decodeToken() {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const decoded: any = jwtDecode(token);

            decoded.ActiveBrowsers = decoded.ActiveBrowsers
                ? JSON.parse(decoded.ActiveBrowsers)
                : [];

            return decoded;
        } catch (err) {
            console.error('Failed to decode token:', err);
            return null;
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

    getBrowserInfo(): { browser: string; os: string } {
        const ua = navigator.userAgent;
        // Browser detection
        let browser = 'Unknown';
        if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Edg')) browser = 'Edge';
        else if (ua.includes('OPR') || ua.includes('Opera')) browser = 'Opera';
        else if (ua.includes('Chrome')) browser = 'Chrome';
        else if (ua.includes('Safari')) browser = 'Safari';

        // OS detection
        let os = 'Unknown';
        if (ua.includes('Windows')) os = 'Windows';
        else if (ua.includes('Mac OS X')) os = 'macOS';
        else if (ua.includes('Android')) os = 'Android';
        else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
        else if (ua.includes('Linux')) os = 'Linux';

        return { browser, os };
    }
}