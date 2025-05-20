import { Component } from "@angular/core";

@Component({
    selector: 'app-download',
    templateUrl: './download.component.html',
    styleUrls: ['./download.component.scss'],
    standalone: false
})
export class DownloadComponent {
    downloadMac(event: Event) {
        event.preventDefault();
    }

    downloadLinux(event: Event) {
        event.preventDefault();
    }
}