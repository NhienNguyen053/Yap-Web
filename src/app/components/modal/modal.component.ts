import { Component, EventEmitter, input, Input, Output } from '@angular/core';
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
    @Input() contacts: any[] = [];
    @Output() close = new EventEmitter<void>();
    @Output() closeAction = new EventEmitter<string>();
    @Output() userAction = new EventEmitter<any>()
    activeTab: string = '';
    activeOption: string = '';
    isLoading: boolean = false;
    inputText: string = '';
    inputTextarea: string = '';
    userInfo: any;
    requestId: string = '';
    copied = false;
    modalConstants = MODAL_CONSTANTS;
    isContactsMenuOpen: boolean = false;

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
        this.modalService.sendContactRequest(body).subscribe((res: any) => {
            this.isLoading = false;
            if (res?.status === 200) {
                this.toastService.success("Add contact successfully!");
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

    addContact(group: string, index: number) {
        const contactGroup = this.contacts.find(x => x.letter === group);
        if (contactGroup) {
            const current = contactGroup.contacts[index].checked;
            contactGroup.contacts[index].checked = !current;
        }
    }

    createGroup() {
        if (this.contacts.length > 0) {
            const selectedMemberIds = this.contacts
                .flatMap(group => group.contacts)
                .filter((contact: { checked: boolean }) => contact.checked === true)
                .map((contact: { id: string }) => contact.id); // only get id

            if (!this.inputText.trim()) {
                this.toastService.warning("Please enter group name!");
            }
            else if (selectedMemberIds.length === 0) {
                this.toastService.warning("Please select at least one member!");
            }
            else {
                this.isLoading = true;
                const body = {
                    name: this.inputText,
                    desc: this.inputTextarea,
                    members: selectedMemberIds
                };
                this.modalService.createGroup(body).subscribe(() => {
                    this.isLoading = false;
                    this.userAction.emit(body);
                })
            }
        }
        else {
            this.toastService.warning("Please add people to your contacts to create group!");
        }
    }

    onConfirm() {
        this.isLoading = true;
        this.userAction.emit();
    }

    onClose() {
        this.close.emit();
    }
}
