import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { VerifyEmailService } from "./verify-email.service";

@Component({
    selector: 'app-verify-email',
    templateUrl: './verify-email.component.html',
    styleUrls: ['./verify-email.component.scss'],
    standalone: false,
    providers: [VerifyEmailService]
})
export class VerifyEmailComponent implements OnInit {

    constructor(
        private route: ActivatedRoute,
        private verifyEmailService: VerifyEmailService
    ) { }

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            const token = params['token'];
            if (token) {
                this.verifyToken(token);
            } else {
                console.log('Token not found in URL');
            }
        });
    }

    verifyToken(token: string): void {
        this.verifyEmailService.verifyEmail(token).subscribe({
            next: (response) => {
                console.log('Email verified successfully:', response);
            },
            error: (error) => {
                console.error('Verification failed:', error);
            }
        });
    }
}
