import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-profile-menu',
  templateUrl: './profile-menu.component.html',
  styleUrl: './profile-menu.component.scss',
  standalone: false
})
export class ProfileMenuComponent {
  @Input() userInfo: any;
}
