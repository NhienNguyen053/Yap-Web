import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AppService } from '../../app.service';
import { ModalService } from './modal.service';

@Component({
    selector: 'app-modal',
    templateUrl: './modal.component.html',
    styleUrls: ['./modal.component.scss'],
    standalone: false
})
export class ModalComponent {
    @Input() show = false;
    @Input() index: number = 0;
    @Output() close = new EventEmitter<void>();
    activeTab: string = '';
    activeOption: string = '';
    isLoading: boolean = false;
    inputText: string = '';
    userInfo: any;
    requestId: string = '';

    constructor(
        private appService: AppService,
        private modalService: ModalService
    ) { }

    ngOnInit() {
        this.userInfo = this.appService.decodeToken();
    }

    sendRequest() {
        this.modalService.sendFriendRequest(this.inputText).subscribe((res: any) => {
            console.log(res);
        });
    }

    generateID(event: Event) {
        event.preventDefault();
        this.activeTab = 'left';
        this.activeOption = 'a';
        if (!this.requestId) {
            this.modalService.getRequestId().subscribe((res: any) => {
                if (res?.data) {
                    this.requestId = res.data.requestId;
                }
            });
        }
    }

    generateQR(event: Event) {
        event.preventDefault();
        this.activeTab = 'right';
        this.activeOption = 'a';
    }

    changeTab(tab: string, option: string) {
        this.activeTab = tab;
        this.activeOption = option;
    }

    onClose() {
        this.close.emit();
    }
}
