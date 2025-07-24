import { Component } from "@angular/core";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { filter } from "rxjs";
import { AuthenticateService } from "./authenticate.service";
import { ToastrService } from "ngx-toastr";
import { AppService } from "../app.service";
import { EncryptionService } from "../services/encryption.service";
import { MODAL_CONSTANTS } from "../../constants/modal-constants";

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
    // rememberMe: boolean = false;
    emailError: string | null = null;
    firstnameError: string | null = null;
    lastnameError: string | null = null;
    passwordError: string | null = null;
    isLoading: boolean = false;
    resendEmail: boolean = false;
    tempEmail = '';
    isModalOpen = false;
    showConnectionModalId = MODAL_CONSTANTS.SHOW_CONNECTIONS;
    isModalOpen2 = false;
    showLogoutWarning2 = MODAL_CONSTANTS.LOGOUT_WARNING2;
    userInfo: any;
    loginBody: any;
    privateKey: any;

    constructor(
        private router: Router,
        private authenticateService: AuthenticateService,
        private toastService: ToastrService,
        private route: ActivatedRoute,
        private appService: AppService,
        private encryptionService: EncryptionService
    ) {
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe(() => {
            this.currentRoute = this.router.url.split('/').pop()?.split('?')[0] ?? '';
        });
    }

    ngOnInit() {
        this.userInfo = this.appService.decodeToken();
        this.appService.initTheme();
        this.route.queryParams.subscribe(params => {
            const token = params['token'];
            if (token) {
                this.verifyToken(token);
            }
        });
    }

    verifyToken(token: string): void {
        const body = { token };
        this.authenticateService.verifyEmail(body).subscribe({
            next: (response: any) => {
                if (response.status === 200) {
                    this.toastService.success(response.message);
                } else {
                    this.toastService.warning(response.message);
                }
            },
            error: (error) => {
                console.error('Verification failed:', error);
            }
        });
    }

    resendVerifyEmail() {
        const body = { email: this.tempEmail };
        this.authenticateService.resendEmail(body).subscribe({
            next: (response: any) => {
                if (response.status === 200) {
                    this.toastService.success("A verification email has been sent. Please check it to activate your account!");
                }
            },
            error: () => {
                this.toastService.error("An error occurred. Please try again later!");
                this.isLoading = false;
            }
        });
    }

    async onSubmit() {
        this.emailError = this.getEmailError();
        this.firstnameError = this.getUsernameError(this.firstname, "Firstname");
        this.lastnameError = this.getUsernameError(this.lastname, "Lastname");
        this.passwordError = this.getPasswordError();

        const hasErrors = this.emailError || this.passwordError ||
            (this.currentRoute === 'signup' && (this.firstnameError || this.lastnameError));

        if (hasErrors) return;

        this.isLoading = true;

        const info = this.appService.getBrowserInfo();

        const keyPair = await this.encryptionService.generateKeyPair();
        const publicKey = await this.encryptionService.exportPublicKey(keyPair.publicKey);
        this.privateKey = await this.encryptionService.exportPrivateKey(keyPair.privateKey);
        const publicKeyId = crypto.randomUUID();

        const activeBrowser = {
            id: publicKeyId,
            publicKey,
            browserInfo: info.browser,
            OS: info.os,
        };

        this.loginBody = {
            email: this.email,
            password: this.password,
            // rememberMe: this.rememberMe,
            activeBrowser,
        };

        const registerBody = {
            email: this.email,
            password: this.password,
            firstname: this.firstname,
            lastname: this.lastname
        };

        if (this.currentRoute === 'login') {
            this.tempEmail = this.email;
            if (this.userInfo) {
                this.isModalOpen2 = true;
            } else {
                this.authenticateService.login(this.loginBody).subscribe({
                    next: (res: any) => this.handleLoginResponse(res, this.privateKey),
                    error: () => this.handleError()
                });
            }
        } else if (this.currentRoute === 'signup') {
            this.authenticateService.register(registerBody).subscribe({
                next: (res: any) => this.handleRegisterResponse(res),
                error: () => this.handleError()
            });
        }
    }

    async handleLoginResponse(response: any, privateKey: string) {
        this.isLoading = false;
        switch (response.status) {
            case 200:
                localStorage.setItem('token', response.data.token);
                if (privateKey) {
                    const data: any = await this.encryptionService.encryptPrivateKey(privateKey, this.password);
                    localStorage.setItem('privateKey', data.encryptedData);
                    localStorage.setItem('salt', data.salt);
                    localStorage.setItem('iv', data.iv);
                    this.privateKey = null;
                }
                this.router.navigate(['/chat'], {
                    state: { password: this.password, isLogin: true }
                });
                this.password = '';
                break;
            case 400:
                this.passwordError = response.message;
                break;
            case 204:
                this.passwordError = response.message;
                break;
            case 401:
                this.resendEmail = true;
                this.passwordError = response.message;
                break;
            case 403: 
                this.isModalOpen = true;
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
        const body = { email: this.tempEmail }
        this.authenticateService.resendEmail(body).subscribe({
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

    confirmLogout() {
        this.appService.logout(this.userInfo, false);
        this.authenticateService.login(this.loginBody).subscribe({
            next: (res: any) => this.handleLoginResponse(res, this.privateKey),
            error: () => this.handleError()
        });
        this.isModalOpen2 = false;
    }

    cancel() {
        this.isModalOpen2 = false;
        this.router.navigate(['/chat']);
    }
}