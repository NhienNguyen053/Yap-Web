import { Component } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { filter } from "rxjs";
import { AuthenticateService } from "./authenticate.service";
import { ToastrService } from "ngx-toastr";

@Component({
    selector: 'app-authenticate',
    templateUrl: './authenticate.component.html',
    styleUrls: ['./authenticate.component.scss'],
    standalone: false,
    providers: [AuthenticateService]
})

export class AuthenticateComponent {
    currentRoute: string = "";
    email = '';
    lastname = '';
    firstname = '';
    password = '';
    rememberMe: boolean = false;
    emailError: string | null = null;
    firstnameError: string | null = null;
    lastnameError: string | null = null;
    passwordError: string | null = null;
    isLoading: boolean = false;
    resendEmail: boolean = false;
    tempEmail = '';

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
        this.firstnameError = this.getUsernameError(this.firstname, "Firstname");
        this.lastnameError = this.getUsernameError(this.lastname, "Lastname");
        this.passwordError = this.getPasswordError();

        const hasErrors = this.emailError || this.passwordError ||
            (this.currentRoute === 'signup' && (this.firstnameError || this.lastnameError));

        if (hasErrors) return;

        this.isLoading = true;

        const loginBody = {
            email: this.email,
            password: this.password,
            rememberMe: this.rememberMe
        };

        const registerBody = {
            email: this.email,
            password: this.password,
            firstname: this.firstname,
            lastname: this.lastname
        };

        if (this.currentRoute === 'login') {
            this.tempEmail = this.email;
            this.authenticateService.login(loginBody).subscribe({
                next: (res: any) => this.handleLoginResponse(res),
                error: () => this.handleError()
            });
        } else if (this.currentRoute === 'signup') {
            this.authenticateService.register(registerBody).subscribe({
                next: (res: any) => this.handleRegisterResponse(res),
                error: () => this.handleError()
            });
        }
    }

    handleLoginResponse(response: any) {
        this.isLoading = false;
        switch (response.status) {
            case 200:
                localStorage.setItem('token', response.data.token);
                this.router.navigate(['/']);
                break;
            case 400:
                this.passwordError = "Incorrect password. Please try again!";
                break;
            case 204:
                this.passwordError = "Account doesn't exist. Please sign up!";
                break;
            case 401:
                this.resendEmail = true;
                this.passwordError = "Your account hasn't been activated. Please check your email!";
                break;
            default:
                this.toastService.error("An error occurred. Please try again later!");
        }
    }

    handleRegisterResponse(response: any) {
        this.isLoading = false;
        switch (response.status) {
            case 200:
                this.router.navigate(['/login']);
                this.toastService.success("A verification email has been sent. Please check it to activate your account!");
                break;
            case 403:
                this.passwordError = "Account already exists. Please login!";
                break;
            default:
                this.toastService.error("An error occurred. Please try again later!");
        }
    }

    handleResendEmailResponse(response: any) {
        this.isLoading = false;
        switch (response.status) {
            case 200:
                this.toastService.success("A verification email has been sent. Please check it to activate your account!");
                break;
        }
    }

    resendVerificationEmail(event: Event) {
        event.preventDefault();
        this.isLoading = true;
        this.authenticateService.resendEmail(this.tempEmail).subscribe({
            next: (res: any) => this.handleResendEmailResponse(res),
            error: () => this.handleError()
        });
    }

    onEmailChange() {
        this.emailError = null;
    }

    onFirstnameChange() {
        this.firstnameError = null;
    }

    onLastnameChange() {
        this.lastnameError = null;
    }

    onPasswordChange() {
        this.passwordError = null;
        this.resendEmail = false;
    }

    getEmailError(): string | null {
        if (!this.email.trim()) return 'Email required!';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(this.email)) return 'Invalid email!';
        return null;
    }

    getUsernameError(name: string, error: string): string | null {
        if (this.currentRoute === 'forget' || this.currentRoute === 'login') return null;
        if (!name.trim()) return `${error} required!`;
        return null;
    }

    getPasswordError(): string | null {
        if (this.currentRoute === 'forget') return null;
        if (!this.password.trim()) return 'Password required!';
        if (this.password.length < 6) return 'Password must be at least 6 characters!';
        if (!/\d/.test(this.password)) return 'Password must contain at least one number!';
        return null;
    }

    navigate(path: string, event: Event) {
        event.preventDefault();
        this.router.navigate([`/${path}`])
    }

    handleError() {
        this.toastService.error("An error occurred. Please try again later!");
        this.isLoading = false;
    };
}