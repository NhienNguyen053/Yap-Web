import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AppService } from '../../app.service';
import { ModalService } from './modal.service';
import { ToastrService } from 'ngx-toastr';
import { MODAL_CONSTANTS } from '../../../constants/modal-constants';

@Component({
    selector: 'app-modal',
    templateUrl: './modal.component.html',
    styleUrls: ['./modal.component.scss'],
    standalone: false
})
export class ModalComponent {
    @Input() show = false;
    @Input() modalId: string | undefined;
    @Input() title: string | undefined;
    @Output() close = new EventEmitter<void>();
    @Output() closeAction = new EventEmitter<string>();
    @Output() userAction = new EventEmitter<any>()
    activeTab: string = '';
    activeOption: string = '';
    isLoading: boolean = false;
    inputText: string = '';
    userInfo: any;
    requestId: string = '';
    copied = false;
    modalConstants = MODAL_CONSTANTS;

    constructor(
        private appService: AppService,
        private modalService: ModalService,
        private toastService: ToastrService
    ) { }

    ngOnInit() {
        this.userInfo = this.appService.decodeToken();
    }

    authenticate() {
        if (this.inputText.trim()) {
            this.isLoading = true;
            const body = {
                id: this.userInfo.Id,
                password: this.inputText
            };
            this.modalService.authenticate(body).subscribe((res: any) => {
                if (res?.status === 200) {
                    this.closeAction.emit(this.inputText);
                } else {
                    this.toastService.error(res?.message);
                }
                this.isLoading = false;
                this.inputText = '';
            });
        }
    }

    sendRequest() {
        this.isLoading = true;
        const body = { requestId: this.inputText }
        this.modalService.sendFriendRequest(body).subscribe((res: any) => {
            this.isLoading = false;
            if (res?.status === 200) {
                this.toastService.success("Add friend successfully!");
                this.requestId = '';
                this.userAction.emit(res?.data);
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

    onConfirm() {
        this.isLoading = true;
        this.userAction.emit();
    }

    onClose() {
        this.close.emit();
    }
}
