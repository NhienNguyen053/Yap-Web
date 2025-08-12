import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MODAL_CONSTANTS } from '../../../constants/modal-constants';
import { ChatMenuService } from '../chat-menu.service';

@Component({
  selector: 'app-group-menu',
  templateUrl: './group-menu.component.html',
  styleUrl: './group-menu.component.scss',
  standalone: false
})
export class GroupMenuComponent {
  @Input() contacts: any[] = [];
  @Input() userInfo: any;
  createGroupModalId = MODAL_CONSTANTS.CREATE_GROUP;
  isModalOpen = false;
  groups: any[] = [];

  constructor(
    private chatMenuService: ChatMenuService
  ) { }

  ngOnInit() {
    this.chatMenuService.getGroups().subscribe((res: any) => {
      if (res.data) {
        this.groups = res.data;
      }
    });
  }

  get groupedContacts() {
    const groups: { [key: string]: any[] } = {};
    this.contacts.forEach(contact => {
      const letter = contact.firstName.charAt(0).toUpperCase();
      if (!groups[letter]) {
        groups[letter] = [];
      }
      groups[letter].push(contact);
    });

    return Object.keys(groups).sort().map(letter => ({
      letter,
      contacts: groups[letter]
    }));
  }

  groupMenuAction(event: Event) {
    this.isModalOpen = false;
    this.groups.push(event);
  }
}
