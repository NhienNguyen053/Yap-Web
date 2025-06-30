import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EnumStatusOnline } from '../../enums/EnumStatus';
import { DatePipe } from '@angular/common';

@Component({
    selector: 'app-chat-box',
    templateUrl: './chat-box.component.html',
    styleUrl: './chat-box.component.scss',
    standalone: false,
})
export class ChatBoxComponent {
    @Input() activeConversation: any;
    @Input() userInfo: any;
    @Input() activeFriend: any;
    @Output() sendMessage = new EventEmitter<any>();
    message: string = '';
    EnumStatusOnline = EnumStatusOnline;

    constructor(
        private datePipe: DatePipe,
    ) { }

    send() {
        this.sendMessage.emit(this.message);
        this.message = '';
    }

    formatUnixTime(unixTimestamp: number): string | null {
        return this.datePipe.transform(unixTimestamp * 1000, 'h:mm a');
    }
}