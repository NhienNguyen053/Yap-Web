import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { CONSTANTS } from '../../constants/constants';

@Injectable({
  providedIn: 'root'
})
export class VerifyEmailService {
    myHeader = new HttpHeaders({
        'Content-Type': 'application/json',
    });
    
    constructor(
        private _http: HttpClient,
    ) { }

    verifyEmail(token: any) {
        return this._http.get(`${environment.API + CONSTANTS.API.AUTHENTICATE.VERIFY_EMAIL}?token=${token}`, { headers: this.myHeader }).pipe();
    }
}