import { Routes } from '@angular/router';
import { LandingPageComponent } from "./landing-page/landing-page.component";
import { AuthenticateComponent } from './authenticate/authenticate.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';

export const routes: Routes = [
    {
        path: '',
        component: LandingPageComponent
    },
    {
        path: 'login',
        component: AuthenticateComponent
    },
    {
        path: 'signup',
        component: AuthenticateComponent
    },
    {
        path: 'forget-password',
        component: AuthenticateComponent
    },
    {
        path: 'verify-email',
        component: VerifyEmailComponent
    },
    {
        path: '**',
        component: NotFoundComponent
    }
];
