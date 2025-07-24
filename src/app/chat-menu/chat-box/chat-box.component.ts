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
    @Input() activeContact: any;
    @Output() sendMessage = new EventEmitter<any>();
    message: string = '';
    EnumStatusOnline = EnumStatusOnline;
    selectedFiles: any[] = [];
    blobUrlCache = new Map<Blob, string>();

    constructor(
        private datePipe: DatePipe,
    ) { }

    onFilesSelected(event: any, type: 'file' | 'image') {
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
            files: this.selectedFiles.map(({ preview, ...rest }) => rest)
        };
        this.sendMessage.emit(data);
        this.message = '';
        this.selectedFiles = [];
    }

    formatUnixTime(unixTimestamp: number): string | null {
        return this.datePipe.transform(unixTimestamp * 1000, 'h:mm a');
    }

    ngOnDestroy() {
        // Revoke all created URLs on destroy
        for (const url of this.blobUrlCache.values()) {
            URL.revokeObjectURL(url);
        }
        this.blobUrlCache.clear();
    }
}