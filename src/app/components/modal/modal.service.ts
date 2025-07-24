import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CONSTANTS } from '../../../constants/constants';
import { AppService } from '../../app.service';

@Injectable({
    providedIn: 'root'
})
export class ModalService {
    myHeader = new HttpHeaders({
        'Content-Type': 'application/json',
    });

    constructor(
        private _http: HttpClient,
    ) { }

    authenticate(body: any) {
        return this._http.post(environment.API_AUTH + CONSTANTS.API.AUTHENTICATE.AUTHENTICATE, body, { headers: this.myHeader }).pipe();
    }

    sendContactRequest(body: any) {
        return this._http.post(environment.API_USER + CONSTANTS.API.USER.SEND_CONTACT_REQUEST, body, { headers: this.myHeader }).pipe();
    }

    getRequestId() {
        return this._http.get(environment.API_USER + CONSTANTS.API.USER.GET_REQUEST_ID, { headers: this.myHeader }).pipe();
    }
}
