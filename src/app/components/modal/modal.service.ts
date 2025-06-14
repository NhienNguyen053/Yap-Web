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

    sendFriendRequest(requestId: any) {
        return this._http.post(environment.API + CONSTANTS.API.USER.SEND_FRIEND_REQUEST + '?requestId=' + requestId, { headers: this.myHeader }).pipe();
    }

    getRequestId() {
        return this._http.get(environment.API + CONSTANTS.API.USER.GET_REQUEST_ID, { headers: this.myHeader }).pipe();
    }
}
