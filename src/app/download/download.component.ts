import { Component } from "@angular/core";
import { HeaderComponent } from "../header/header.component";
import { FooterComponent } from "../footer/footer.component";

@Component({
    selector: 'app-download',
    templateUrl: './download.component.html',
    styleUrls: ['./download.component.scss'],
    standalone: true,
    imports: [HeaderComponent, FooterComponent],
})
export class DownloadComponent {
    downloadMac(event: Event) {
        event.preventDefault();
    }

    downloadLinux(event: Event) {
        event.preventDefault();
    }
}