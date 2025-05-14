import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { NavigationEnd, Router, RouterModule } from "@angular/router";
import { filter } from "rxjs";

@Component({
    selector: 'app-authenticate',
    templateUrl: './authenticate.component.html',
    styleUrls: ['./authenticate.component.scss'],
    standalone: true,
    imports: [RouterModule, CommonModule, FormsModule],
})
export class AuthenticateComponent {
    currentRoute: string = "";
    email = '';
    username = '';
    password = '';
    emailError: string | null = null;
    usernameError: string | null = null;
    passwordError: string | null = null;

    constructor(private router: Router) {
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

        if (this.emailError || this.usernameError || this.passwordError) {
            return;
        } else {
            console.log("success");
        }
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
        if (this.currentRoute === 'login') return null;
        if (!this.email.trim()) return 'Email required!';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(this.email)) return 'Invalid email!';
        return null;
    }

    getUsernameError(): string | null {
        if (this.currentRoute === 'forget') return null;
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