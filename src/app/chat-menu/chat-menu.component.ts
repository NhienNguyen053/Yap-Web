import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppService } from '../app.service';
import Swiper from 'swiper';
import { ChatMenuService } from './chat-menu.service';
import { IndexedDBService } from '../services/indexed-db.service';
import { SignalRService } from '../services/signalr.service';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-chat-menu',
  templateUrl: './chat-menu.component.html',
  styleUrl: './chat-menu.component.scss',
  standalone: false,
})
export class ChatMenuComponent implements OnInit {
  @ViewChild('swiperContainer', { static: false }) swiperContainer: ElementRef | undefined;
  userInfo: any;
  activeTab: string = 'chat';
  activeConversation: any;
  friends: any[] = [];
  activeFriend: any;
  conversations: any[] = [];
  subscription!: Subscription;
  conversationsStoreName = "Conversations";

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private appService: AppService,
    private chatMenuService: ChatMenuService,
    private indexedDBService: IndexedDBService,
    private signalrService: SignalRService,
    private toastrService: ToastrService
  ) { }

  async ngOnInit() {
    this.userInfo = this.appService.decodeToken();
    this.conversations = await this.getItems();
    this.appService.initTheme();
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
    this.chatMenuService.getFriends().subscribe((res: any) => {
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
        this.friends = data.data;
        this.toastrService.success(this.friends.at(-1).firstName + " " + this.friends.at(-1).lastName + " has accepted your friend request!")
        break;

      default:
        break;
    }
  }

  sendMessage(message: any) {
    const trimmedMessage = message.trim();
    const newMessage = {
      id: crypto.randomUUID(),
      sender: this.userInfo.Id,
      message: trimmedMessage,
      timeSent: Math.floor(Date.now() / 1000),
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
    }
  }

  acceptFriend(friend: any): void {
    this.friends.push(friend);
  }

  async getItems() {
    try {
      return await this.indexedDBService.getAllData<any>(this.conversationsStoreName, conversation => conversation.senderId === this.userInfo.Id);
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
        this.indexedDBService.updateData(newConversation, this.conversationsStoreName);
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
    const accept = {
      Id: event.id,
      PublicKeyIds: event.publicKeys
    }
    this.signalrService.sendMessage("AcceptFriend", accept);
  }

  ngOnDestroy() {
    this.signalrService.stopConnection();
  }
}
