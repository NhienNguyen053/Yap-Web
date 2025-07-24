import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { CONSTANTS } from '../../constants/constants';

@Injectable({
    providedIn: 'root'
})
export class AuthenticateService {
    myHeader = new HttpHeaders({
        'Content-Type': 'application/json',
    });

    constructor(
        private _http: HttpClient,
    ) { }

    login(body: any) {
        return this._http.post(environment.API_AUTH + CONSTANTS.API.AUTHENTICATE.LOGIN, body, { headers: this.myHeader }).pipe();
    }

    register(body: any) {
        return this._http.post(environment.API_AUTH + CONSTANTS.API.AUTHENTICATE.REGISTER, body, { headers: this.myHeader }).pipe();
    }

    resendEmail(body: any) {
        return this._http.post(`${environment.API_AUTH + CONSTANTS.API.AUTHENTICATE.RESEND_EMAIL}`, body, { headers: this.myHeader }).pipe();
    }

    verifyEmail(body: any) {
        return this._http.post(`${environment.API_AUTH + CONSTANTS.API.AUTHENTICATE.VERIFY_EMAIL}`, body, { headers: this.myHeader }).pipe();
    }
}