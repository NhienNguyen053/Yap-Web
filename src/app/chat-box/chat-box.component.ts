import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppService } from '../app.service';
import { EnumDeliveryStatus, EnumStatusOnline } from '../enums/EnumStatus';
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
  activeFriend: any;
  message: string = '';
  conversations: any[] = [];
  subscription!: Subscription;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private appService: AppService,
    private datePipe: DatePipe,
    private chatBoxService: ChatBoxService,
    private indexedDBService: IndexedDBService,
    private signalrService: SignalRService,
  ) { }

  async ngOnInit() {
    this.conversations = await this.getItems();
    document.documentElement.setAttribute('data-theme', this.theme);
    this.userInfo = this.appService.decodeToken();
    const token = localStorage.getItem('token');
    if (token) {
      this.signalrService.startConnection(token);
      this.signalrService.onMessage([
        'ReceiveMessage',
        'AcceptFriend'
      ], this.handleSignalREvent.bind(this));
    }
    this.getFriends();
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

  getFriends() {
    this.chatBoxService.getFriends().subscribe((res: any) => {
      if (res?.data) {
        this.friends = res.data;
      }
    });
  }

  handleSignalREvent(event: any): void {
    const { type, ...data } = event;

    switch (type) {
      case 'ReceiveMessage':
        this.handleIncomingMessage(data);
        break;

      case 'AcceptFriend':
        this.getFriends();
        break;

      default:
        break;
    }
  }

  handleIncomingMessage(message: any): void {
    const findConversation = this.conversations.find(x => x.conversationId === message.sender);
    if (message.sender !== this.userInfo.Id && !findConversation) {
      const findFriend = this.friends.find(user => user.id === message.sender);
      if (findFriend) {
        const newConversation = {
          senderId: this.userInfo.Id,
          conversationId: findFriend.id,
          firstName: findFriend.firstName,
          lastName: findFriend.lastName,
          messages: [message],
          avatar: findFriend.avatar
        }
        this.conversations.push(newConversation);
      }
    } else if (message.sender !== this.userInfo.Id && findConversation) {
      findConversation.messages.push(message);
    } else {
      const conversation = this.conversations.find(x => x.conversationId === message.receiver);
      const findMessage = conversation.messages.find((x: { id: any; }) => x.id === message.id);
      const findActiveMessage = conversation.messages.find((x: { id: any; }) => x.id === message.id);
      findMessage.deliveryStatus = EnumDeliveryStatus.Sent;
      findActiveMessage.deliveryStatus = EnumDeliveryStatus.Sent;
    }
  }

  acceptFriend(friend: any): void {
    this.friends.push(friend);
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
        firstName: friend.firstName,
        lastName: friend.lastName,
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

  updateFriendList(event: any) {
    this.friends.push(event);
    this.signalrService.sendMessage("AcceptFriend", event.id);
  }

  sendMessage() {
    const trimmedMessage = this.message.trim();
    this.message = '';
    const newMessage = {
      id: crypto.randomUUID(),
      sender: this.userInfo.Id,
      message: trimmedMessage,
      timeSent: Math.floor(Date.now() / 1000),
      deliveryStatus: EnumDeliveryStatus.NotSent
    }
    const conversation = this.conversations.find(user => user.conversationId === this.activeConversation.conversationId);
    if (conversation) {
      conversation.messages.push(newMessage);
    }
    if (trimmedMessage) {
      const sendMessage = {
        id: newMessage.id,
        sender: newMessage.sender,
        receiver: this.activeConversation.conversationId,
        timeSent: newMessage.timeSent,
        message: trimmedMessage
      };
      this.signalrService.sendMessage("SendMessage", sendMessage);
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

  navigate(path: string, event: Event) {
    event.preventDefault();
    const [cleanPath, query] = path.split('?');
    const queryParams = this.appService.parseQueryString(query || '');
    this.router.navigate([`/${cleanPath}`], { queryParams });
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
