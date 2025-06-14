import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import * as signalR from '@microsoft/signalr';

@Injectable({
    providedIn: 'root'
})
export class SignalRService {
    private hubConnection!: signalR.HubConnection;

    startConnection(token: string) {
        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl(environment.WEBSOCKET + '/user', {
                accessTokenFactory: () => token,
                transport: signalR.HttpTransportType.WebSockets
            })
            .withAutomaticReconnect()
            .build();

        this.hubConnection
            .start()
            .then(() => console.log('SignalR Connected!'))
            .catch(err => console.error('SignalR Error: ', err));
    }

    onMessage(callback: (message: any) => void) {
        this.hubConnection.on('ReceiveMessage', callback);
    }

    sendMessage(method: string, data: any) {
        this.hubConnection.invoke(method, data).catch(err => console.error(err));
    }

    stopConnection() {
        this.hubConnection?.stop();
    }
}
