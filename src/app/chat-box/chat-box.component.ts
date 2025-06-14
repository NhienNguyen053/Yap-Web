import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppService } from '../app.service';
import { EnumStatusOnline } from '../enums/EnumStatus';
import { DatePipe } from '@angular/common';
import Swiper from 'swiper';
import { ChatBoxService } from './chat-box.service';
import { IndexedDBService } from '../services/indexed-db.service';
import { SignalRService } from '../services/signalr.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-box',
  templateUrl: './chat-box.component.html',
  styleUrl: './chat-box.component.scss',
  standalone: false,
})
export class ChatBoxComponent implements OnInit {
  @ViewChild('profile') profile!: ElementRef;
  @ViewChild('swiperContainer', { static: false }) swiperContainer: ElementRef | undefined;
  theme: string = localStorage.getItem('theme') || 'light';
  userInfo: any;
  activeTab: string = 'chat';
  activeProfile: boolean = false;
  EnumStatusOnline = EnumStatusOnline;
  activeConversation: any;
  isModalOpen = false;
  friends: any[] = [];
  message: string = '';
  // conversations = [
  //   {
  //     conversationId: 'sdfhsjdhfkshf',
  //     status: EnumStatusOnline.DoNotDisturb,
  //     firstName: 'Joel',
  //     lastName: 'Miller',
  //     lastMessage: 'hello joel',
  //     lastMessageSent: 1748695030,
  //     lastUserSent: '',
  //     messages: [

  //     ],
  //     avatar: 'https://firebasestorage.googleapis.com/v0/b/yap-web-27230.firebasestorage.app/o/avatars%2Fjoelmiller053%40gmail.com.png?alt=media&token=ca1e8caf-c955-4877-8494-8ba04967c8d9'
  //   },
  //   {
  //     conversationId: '2',
  //     status: EnumStatusOnline.Online,
  //     firstName: 'Nathan', lastName: 'Drake',
  //     lastMessage: 'hello nathan',
  //     lastMessageSent: 1717050030,
  //     messages: [

  //     ],
  //     avatar: 'https://firebasestorage.googleapis.com/v0/b/yap-web-27230.firebasestorage.app/o/avatars%2Frigbybaby123%40gmail.com.png?alt=media&token=e1ac95d3-b8fd-46e6-b240-192ab7401bbf'
  //   }
  // ]
  conversations: any[] = [];
  subscription!: Subscription;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private appService: AppService,
    private datePipe: DatePipe,
    private chatBoxService: ChatBoxService,
    private indexedDBService: IndexedDBService,
    private signalrService: SignalRService
  ) { }

  async ngOnInit() {
    this.conversations = await this.getItems();
    document.documentElement.setAttribute('data-theme', this.theme);
    this.userInfo = this.appService.decodeToken();
    const token = localStorage.getItem('token');
    if (token) {
      this.signalrService.startConnection(token);
      this.signalrService.onMessage((event: any) => {
        this.handleSignalREvent(event);
      });
    }
    this.chatBoxService.getFriends().subscribe((res: any) => {
      if (res?.data) {
        this.friends = res.data;
      }
    });
    this.route.queryParams.subscribe(params => {
      const chatId = params['chatId'];
      const tab = params['tab']
      if (chatId) {
        const found = this.conversations.find(c => c.conversationId === chatId);
        if (found) {
          this.activeConversation = found;
        }
      }
      if (tab) {
        if (tab === 'chat') {
          this.initSwiper();
        }
        this.activeTab = tab;
      }
    });
  }

  handleSignalREvent(event: any): void {
    switch (event.type || 'ReceiveMessage') {
      case 'ReceiveMessage':
        this.handleIncomingMessage(event);
        break;

      // future types:
      case 'Typing':
        // handle typing indicator here
        break;

      default:
        console.warn('Unhandled SignalR event:', event);
        break;
    }
  }

  handleIncomingMessage(message: any): void {
    console.log('📩 Received message:', message);
  }

  async getItems() {
    try {
      return await this.indexedDBService.getAllData();
    } catch (error) {
      return [];
    }
  }

  ngAfterViewInit(): void {
    this.initSwiper();
  }

  initSwiper(): void {
    setTimeout(() => {
      new Swiper(this.swiperContainer?.nativeElement, {
        slidesPerView: 'auto',
      });
    });
  }

  onTabClick(tab: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tab },
      queryParamsHandling: 'merge',
    });
  }

  goToConversation(friend: any) {
    const conversation = this.conversations.find(user => user.conversationId === friend.id);
    if (conversation) {
      this.changeConversation(conversation);
    } else {
      const newConversation = {
        senderId: this.userInfo.Id,
        conversationId: friend.id,
        status: EnumStatusOnline.Offline,
        firstName: friend.firstName,
        lastName: friend.lastName,
        lastMessage: '',
        lastMessageSent: null,
        lastUserSent: '',
        messages: [],
        avatar: friend.avatar
      };
      this.conversations.push(newConversation);
      setTimeout(() => {
        this.indexedDBService.updateData(newConversation);
        this.changeConversation(newConversation);
      });
    }
  }

  changeConversation(conversation: any) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { chatId: conversation.conversationId },
      queryParamsHandling: 'merge',
    });
  }

  updateFriendList(event: Event) {
    this.friends.push(event);
  }

  sendMessage() {
    const trimmedMessage = this.message.trim();
    if (trimmedMessage) {
      const newMessage = {
        sender: this.userInfo.Id,
        receiver: this.activeConversation.conversationId,
        message: trimmedMessage
      };
      this.signalrService.sendMessage("SendMessage", newMessage);
    }
  }

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

  formatUnixTime(unixTimestamp: number): string | null {
    return this.datePipe.transform(unixTimestamp * 1000, 'h:mm a');
  }

  toggleTheme() {
    this.theme = this.appService.toggleTheme(this.theme);
  }

  logout() {
    this.userInfo = this.appService.logout();
  }

  goToHome() {
    this.router.navigate(['/']);
  }

  @HostListener('document:click', ['$event.target'])
  onClickOutside(targetElement: HTMLElement) {
    const clickedInside = this.profile?.nativeElement.contains(targetElement);
    if (!clickedInside && this.activeProfile) {
      this.activeProfile = false;
    }
  }

  ngOnDestroy() {
    this.signalrService.stopConnection();
  }
}
