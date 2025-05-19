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
        return this._http.post(environment.API + CONSTANTS.API.AUTHENTICATE, { headers: this.myHeader }).pipe();
    }
}