import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { VerifyEmailService } from "./verify-email.service";
import { AuthenticateService } from "../authenticate/authenticate.service";
import { ToastrService } from "ngx-toastr";

@Component({
    selector: 'app-verify-email',
    templateUrl: './verify-email.component.html',
    styleUrls: ['./verify-email.component.scss'],
    standalone: false,
    providers: [VerifyEmailService, AuthenticateService]
})
export class VerifyEmailComponent implements OnInit {
    isLoading: boolean = true;
    status: any;
    tempEmail: any;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private verifyEmailService: VerifyEmailService,
        private authenticateService: AuthenticateService,
        private toastService: ToastrService
    ) { }

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            const token = params['token'];
            if (token) {
                this.verifyToken(token);
            }
        });
    }

    verifyToken(token: string): void {
        this.verifyEmailService.verifyEmail(token).subscribe({
            next: (response: any) => {
                this.isLoading = false;
                this.status = response.status;
                if (response.status === 400) {
                    this.tempEmail = response.data.email;
                }
            },
            error: (error) => {
                console.error('Verification failed:', error);
            }
        });
    }

    resendEmail() {
        this.authenticateService.resendEmail(this.tempEmail).subscribe({
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

    goToLogin() {
        this.router.navigate(['/login']);
    }
}
