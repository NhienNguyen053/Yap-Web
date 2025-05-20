import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToastrModule } from 'ngx-toastr';
import { routes } from './app.routes';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { AuthenticateComponent } from './authenticate/authenticate.component';
import { AuthenticateService } from './authenticate/authenticate.service';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { AppComponent } from './app.component';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  declarations: [
    AuthenticateComponent,
    HeaderComponent,
    FooterComponent,
    LandingPageComponent,
    AppComponent
  ],
  imports: [
    RouterModule.forRoot(routes),
    ToastrModule.forRoot({timeOut: 20000}),
    CommonModule,
    FormsModule,
    BrowserModule,
    BrowserAnimationsModule
  ],
  providers: [AuthenticateService, provideHttpClient(), provideAnimations()],
  bootstrap: [AppComponent]
})
export class AppModule { }
