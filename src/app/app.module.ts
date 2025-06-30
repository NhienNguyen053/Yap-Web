import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToastrModule } from 'ngx-toastr';
import { routes } from './app.routes';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { AuthenticateComponent } from './authenticate/authenticate.component';
import { AuthenticateService } from './authenticate/authenticate.service';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { ChatMenuComponent } from './chat-menu/chat-menu.component';
import { ModalComponent } from './components/modal/modal.component';
import { CustomDatePipe } from './pipes/DatePipe.pipe';
import { JwtInterceptor } from './auth/jwtInterceptor';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { ChatBoxComponent } from './chat-menu/chat-box/chat-box.component';
import { FriendMenuComponent } from './chat-menu/friend-menu/friend-menu.component';
import { NavMenuComponent } from './chat-menu/nav-menu/nav-menu.component';
import { ProfileMenuComponent } from './chat-menu/profile-menu/profile-menu.component';
import { AllChatComponent } from './chat-menu/all-chat/all-chat.component';

@NgModule({
  declarations: [
    AppComponent,
    AuthenticateComponent,
    HeaderComponent,
    FooterComponent,
    LandingPageComponent,
    NotFoundComponent,
    VerifyEmailComponent,
    ChatMenuComponent,
    ModalComponent,
    CustomDatePipe,
    LoadingSpinnerComponent,
    ChatBoxComponent,
    FriendMenuComponent,
    NavMenuComponent,
    ProfileMenuComponent,
    AllChatComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    RouterModule.forRoot(routes),
    BrowserAnimationsModule,
    ToastrModule.forRoot(),
    HttpClientModule
  ],
  providers: [
    DatePipe,
    AuthenticateService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
