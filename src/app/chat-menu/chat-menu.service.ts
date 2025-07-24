import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { CONSTANTS } from '../../constants/constants';

@Injectable({
    providedIn: 'root'
})
export class ChatMenuService {
    myHeader = new HttpHeaders({
        'Content-Type': 'application/json',
    });

    constructor(
        private _http: HttpClient,
    ) { }

    getContacts() {
        return this._http.get(environment.API_USER + CONSTANTS.API.USER.GET_CONTACTS, { headers: this.myHeader }).pipe();
    }

    getGroups() {
        return this._http.get(environment.API_USER + CONSTANTS.API.GROUP.GET_GROUPS, { headers: this.myHeader }).pipe();
    }

    getActiveBrowsers() {
        return this._http.get(environment.API + CONSTANTS.API.USER.GET_ACTIVE_BROWSERS, { headers: this.myHeader }).pipe();
    }
}
