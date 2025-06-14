import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { CONSTANTS } from '../../constants/constants';

@Injectable({
    providedIn: 'root'
})
export class ChatBoxService {
    myHeader = new HttpHeaders({
        'Content-Type': 'application/json',
    });

    constructor(
        private _http: HttpClient,
    ) { }

    getFriends() {
        return this._http.get(environment.API + CONSTANTS.API.USER.GET_FRIENDS, { headers: this.myHeader }).pipe();
    }
}
