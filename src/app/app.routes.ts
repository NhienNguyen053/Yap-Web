import { Routes } from '@angular/router';
import { LandingPageComponent } from "./landing-page/landing-page.component";
import { DownloadComponent } from "./download/download.component";

export const routes: Routes = [
    {
        path: '',
        component: LandingPageComponent
    },
    {
        path: 'downloads',
        component: DownloadComponent
    }
];
