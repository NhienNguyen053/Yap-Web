import { Component, ElementRef, EventEmitter, HostListener, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { EnumStatusOnline } from '../../enums/EnumStatus';
import { DatePipe } from '@angular/common';

@Component({
    selector: 'app-chat-box',
    templateUrl: './chat-box.component.html',
    styleUrl: './chat-box.component.scss',
    standalone: false,
})
export class ChatBoxComponent {
    @ViewChild('messageBox') messageBox!: ElementRef;
    @Input() activeConversation: any;
    @Input() userInfo: any;
    @Output() sendMessage = new EventEmitter<any>();
    message: string = '';
    EnumStatusOnline = EnumStatusOnline;
    selectedFiles: any[] = [];
    blobUrlCache = new Map<Blob, string>();
    openedMenuMessageId: string | null = null;
    repliedMessage: any;
    replyMap: Map<string, any> = new Map();

    constructor(
        private datePipe: DatePipe,
    ) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['activeConversation']) {
            this.buildReplyMap();
        }
    }

    buildReplyMap(): void {
        console.log('Building reply map for messages:', this.activeConversation.messages.length);

        this.replyMap.clear();

        for (const msg of this.activeConversation.messages) {
            this.replyMap.set(msg.id, msg);
        }

        for (const msg of this.activeConversation.messages) {
            if (msg.replyTo) {
                msg.repliedMessage = this.replyMap.get(msg.replyTo);
                console.log(`↪ Resolved reply: ${msg.id} → ${msg.replyTo}`, msg.repliedMessage);
            }
        }
    }

    replyMessage(message: any) {
        this.openedMenuMessageId = null;
        this.repliedMessage = message;
    }

    onFilesSelected(event: any) {
        const files: FileList = event.target.files;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            const fileObj: any = {
                file,
                name: file.name,
                type: file.type,
                preview: ''
            };

            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e: any) => {
                    fileObj.preview = e.target.result;
                    this.selectedFiles.push(fileObj);
                };
                reader.readAsDataURL(file);
            } else {
                this.selectedFiles.push(fileObj);
            }
        }

        event.target.value = '';
    }

    removeFile(index: number) {
        this.selectedFiles.splice(index, 1);
    }

    getBlobUrl(blob: Blob): string {
        // Avoid creating duplicate object URLs
        if (!this.blobUrlCache.has(blob)) {
            const url = URL.createObjectURL(blob);
            this.blobUrlCache.set(blob, url);
        }
        return this.blobUrlCache.get(blob)!;
    }

    send() {
        const data: any = {
            message: this.message,
            files: this.selectedFiles.map(({ preview, ...rest }) => rest),
            replyTo: this.repliedMessage
        };
        this.sendMessage.emit(data);
        this.message = '';
        this.selectedFiles = [];
        this.repliedMessage = null;
        setTimeout(() => {
            this.scrollToBottom();
        }, 100);
    }

    formatUnixTime(unixTimestamp: number): string | null {
        return this.datePipe.transform(unixTimestamp * 1000, 'h:mm a');
    }

    toggleMenu(messageId: string) {
        // Delay to let HostListener finish before opening the menu
        setTimeout(() => {
            if (this.openedMenuMessageId === messageId) {
                this.openedMenuMessageId = null; // Close it
            } else {
                this.openedMenuMessageId = messageId; // Open it
            }
        }, 0);
    }

    scrollToBottom(): void {
        try {
            this.messageBox.nativeElement.scrollTop = this.messageBox.nativeElement.scrollHeight;
        } catch (err) {
            console.warn('Scroll to bottom failed:', err);
        }
    }

    ngOnDestroy() {
        // Revoke all created URLs on destroy
        for (const url of this.blobUrlCache.values()) {
            URL.revokeObjectURL(url);
        }
        this.blobUrlCache.clear();
    }

    @HostListener('document:click', ['$event'])
    onClickOutside(event: MouseEvent) {
        const target = event.target as HTMLElement;
        const openedId = this.openedMenuMessageId;

        const clickedMenu = target.closest('[data-menu-id]');
        const clickedIcon = target.closest('[data-icon-id]');

        const isClickInsideMenu = clickedMenu?.getAttribute('data-menu-id') === openedId;
        const isClickOnIcon = clickedIcon?.getAttribute('data-icon-id') === openedId;

        if (!isClickInsideMenu && !isClickOnIcon) {
            this.openedMenuMessageId = null;
        }
    }
}