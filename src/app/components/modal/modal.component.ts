import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AppService } from '../../app.service';
import { ModalService } from './modal.service';
import { ToastrService } from 'ngx-toastr';

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
    @Output() newFriend = new EventEmitter<any>()
    activeTab: string = '';
    activeOption: string = '';
    isLoading: boolean = false;
    inputText: string = '';
    userInfo: any;
    requestId: string = '';
    copied = false;

    constructor(
        private appService: AppService,
        private modalService: ModalService,
        private toastService: ToastrService
    ) { }

    ngOnInit() {
        this.userInfo = this.appService.decodeToken();
    }

    sendRequest() {
        this.isLoading = true;
        this.modalService.sendFriendRequest(this.inputText).subscribe((res: any) => {
            this.isLoading = false;
            if (res?.status === 200) {
                this.toastService.success("Add friend successfully!");
                this.requestId = '';
                this.newFriend.emit(res?.data);
            } else {
                this.toastService.warning(res?.message);
            }
        });
    }

    generateID(event: Event) {
        event.preventDefault();
        this.activeTab = 'left';
        this.activeOption = 'a';
        if (!this.requestId) {
            this.isLoading = true;
            this.modalService.getRequestId().subscribe((res: any) => {
                if (res?.data) {
                    this.requestId = res.data.requestId;
                    this.isLoading = false;
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

    copyToClipboard(): void {
        if (!this.requestId) return;

        navigator.clipboard.writeText(this.requestId).then(() => {
            this.copied = true;

            setTimeout(() => {
                this.copied = false;
            }, 3000);
        });
    }

    onClose() {
        this.close.emit();
    }
}
