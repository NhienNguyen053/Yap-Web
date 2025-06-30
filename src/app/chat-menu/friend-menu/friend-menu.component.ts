import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MODAL_CONSTANTS } from '../../../constants/modal-constants';

@Component({
    selector: 'app-friend-menu',
    templateUrl: './friend-menu.component.html',
    styleUrl: './friend-menu.component.scss',
    standalone: false,
})
export class FriendMenuComponent {
    @Input() friends: any[] = [];
    @Output() updateFriendList = new EventEmitter<any>();
    addFriendModalId = MODAL_CONSTANTS.ADD_FRIEND;
    isModalOpen = false;
    
    constructor(
    ) { }

    get groupedFriends() {
        const groups: { [key: string]: any[] } = {};
        this.friends.forEach(friend => {
            const letter = friend.firstName.charAt(0).toUpperCase();
            if (!groups[letter]) {
                groups[letter] = [];
            }
            groups[letter].push(friend);
        });

        return Object.keys(groups).sort().map(letter => ({
            letter,
            friends: groups[letter]
        }));
    }

    friendMenuAction(event: Event) {
        this.updateFriendList.emit(event);
    }
}