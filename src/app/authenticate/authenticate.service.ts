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
        const data = JSON.stringify(body);
        return this._http.post(environment.API + CONSTANTS.API.AUTHENTICATE.LOGIN, data, { headers: this.myHeader }).pipe();
    }

    register(body: any) {
        const data = JSON.stringify(body);
        return this._http.post(environment.API + CONSTANTS.API.AUTHENTICATE.REGISTER, data, { headers: this.myHeader }).pipe();
    }

    resendEmail(email: string) {
        return this._http.post(`${environment.API + CONSTANTS.API.AUTHENTICATE.RESEND_EMAIL}?email=${email}`, { headers: this.myHeader }).pipe();
    }

    verifyEmail(token: any) {
        return this._http.get(`${environment.API + CONSTANTS.API.AUTHENTICATE.VERIFY_EMAIL}?token=${token}`, { headers: this.myHeader }).pipe();
    }
}