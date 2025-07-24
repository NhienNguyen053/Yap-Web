import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EnumStatusOnline } from '../../enums/EnumStatus';
import { AppService } from '../../app.service';
import { ActivatedRoute, Route, Router } from '@angular/router';

@Component({
  selector: 'app-all-chat',
  templateUrl: './all-chat.component.html',
  styleUrl: './all-chat.component.scss',
  standalone: false
})
export class AllChatComponent {
  @Input() contacts: any[] = [];
  @Input() activeConversation: any;
  @Input() conversations: any[] = [];
  @Input() userInfo: any;
  @Output() goToConversation = new EventEmitter<any>();
  @Output() changeConversation = new EventEmitter<any>();
  EnumStatusOnline = EnumStatusOnline;

  constructor(
    private appService: AppService,
    private router: Router
  ) {}

  go(contact: any) {
    this.goToConversation.emit(contact);
  }

  change(conversation: any) {
    this.changeConversation.emit(conversation);
  }

  navigate(path: string, event: Event) {
    event.preventDefault();
    const [cleanPath, query] = path.split('?');
    const queryParams = this.appService.parseQueryString(query || '');
    this.router.navigate([`/${cleanPath}`], { queryParams });
  }
}
