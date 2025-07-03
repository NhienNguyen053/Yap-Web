import { Routes } from '@angular/router';
import { LandingPageComponent } from "./landing-page/landing-page.component";
import { AuthenticateComponent } from './authenticate/authenticate.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { ChatMenuComponent } from './chat-menu/chat-menu.component';
import { AuthGuard } from './auth/auth.guard.service';

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
        path: 'chat',
        component: ChatMenuComponent,
        canActivate: [AuthGuard]
    },
    {
        path: '**',
        component: NotFoundComponent
    }
];
