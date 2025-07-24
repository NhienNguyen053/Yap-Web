import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MODAL_CONSTANTS } from '../../../constants/modal-constants';

@Component({
    selector: 'app-contact-menu',
    templateUrl: './contact-menu.component.html',
    styleUrl: './contact-menu.component.scss',
    standalone: false,
})
export class ContactMenuComponent {
    @Input() contacts: any[] = [];
    @Output() updateContactList = new EventEmitter<any>();
    addContactModalId = MODAL_CONSTANTS.ADD_CONTACT;
    isModalOpen = false;
    
    constructor(
    ) { }

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

    contactMenuAction(event: Event) {
        this.updateContactList.emit(event);
    }
}