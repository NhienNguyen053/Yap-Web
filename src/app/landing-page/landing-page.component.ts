import { Component } from "@angular/core";
import { HeaderComponent } from "../components/header/header.component";
import { FooterComponent } from "../components/footer/footer.component";
import { Router, RouterModule } from "@angular/router";

@Component({
	selector: 'app-landing-page',
	templateUrl: './landing-page.component.html',
	styleUrls: ['./landing-page.component.scss'],
	standalone: true,
	imports: [HeaderComponent, FooterComponent, RouterModule],
})
export class LandingPageComponent {
	
	constructor(
		private router: Router,
	) { }

	goToDownload() {
		// this.router.navigate(['/downloads']);
	}
}