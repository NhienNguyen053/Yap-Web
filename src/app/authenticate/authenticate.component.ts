import { Component } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { filter } from "rxjs";
import { AuthenticateService } from "./authenticate.service";
import { ToastrService } from "ngx-toastr";

@Component({
    selector: 'app-authenticate',
    templateUrl: './authenticate.component.html',
    styleUrls: ['./authenticate.component.scss'],
    standalone: false
})

export class AuthenticateComponent {
    currentRoute: string = "";
    email = '';
    username = '';
    password = '';
    emailError: string | null = null;
    usernameError: string | null = null;
    passwordError: string | null = null;

    constructor
        (
            private router: Router,
            private authenticateService: AuthenticateService,
            private toastService: ToastrService
        ) {
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe(() => {
            const urlSegments = this.router.url.split('/');
            this.currentRoute = urlSegments[urlSegments.length - 1];
        });
    }

    onSubmit() {
        this.emailError = this.getEmailError();
        this.usernameError = this.getUsernameError();
        this.passwordError = this.getPasswordError();

        if (this.currentRoute === 'login') {
            if (this.emailError || this.passwordError) {
                return;
            }
        } else {
            if (this.emailError || this.usernameError || this.passwordError) {
                return;
            }
        }

        const body = {
            email: this.email,
            password: this.password
        }
        this.authenticateService.login(body).subscribe({
            next: (response: any) => {
                if (response.status === 200) {
                    localStorage.setItem('token', response.data.token);
                    this.router.navigate(['/']);
                } else {
                    if (response.status === 400) {
                        this.toastService.warning("Incorrect password. Please try again!");
                    } else if (response.status === 204) {
                        this.toastService.warning("Account doesn't exist. Please sign up!");
                    }
                }
            },
            error: () => {
                this.toastService.error("An error occurred. Please try again later!");
            }
        })
    }

    onEmailChange() {
        this.emailError = null;
    }

    onUsernameChange() {
        this.usernameError = null;
    }

    onPasswordChange() {
        this.passwordError = null;
    }

    getEmailError(): string | null {
        if (!this.email.trim()) return 'Email required!';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(this.email)) return 'Invalid email!';
        return null;
    }

    getUsernameError(): string | null {
        if (this.currentRoute === 'forget' || this.currentRoute === 'login') return null;
        if (!this.username.trim()) return 'Username required!';
        return null;
    }

    getPasswordError(): string | null {
        if (this.currentRoute === 'forget') return null;
        if (!this.password.trim()) return 'Password required!';
        if (this.password.length < 6) return 'Password must be at least 6 characters!';
        if (!/\d/.test(this.password)) return 'Password must contain at least one number!';
        return null;
    }

    goToLogin(event: Event) {
        event.preventDefault();
        this.router.navigate(['/login']);
    }

    goToForgetPassword(event: Event) {
        event.preventDefault();
        this.router.navigate(['/forget-password']);
    }

    goToSignup(event: Event) {
        event.preventDefault();
        this.router.navigate(['/signup']);
    }
}