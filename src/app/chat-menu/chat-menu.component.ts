import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppService } from '../app.service';
import Swiper from 'swiper';
import { ChatMenuService } from './chat-menu.service';
import { IndexedDBService } from '../services/indexed-db.service';
import { SignalRService } from '../services/signalr.service';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { EncryptionService } from '../services/encryption.service';
import { MODAL_CONSTANTS } from '../../constants/modal-constants';

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
  privateKey: any;
  isModalOpen = false;
  enterPasswordModalId = MODAL_CONSTANTS.ENTER_PASSWORD;
  password: any;
  isLeftExpanded = false;
  isRightExpanded = false;
  isMobile = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private appService: AppService,
    private chatMenuService: ChatMenuService,
    private indexedDBService: IndexedDBService,
    private signalrService: SignalRService,
    private toastrService: ToastrService,
    private encryptionService: EncryptionService,
  ) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { password?: string };
    if (state?.password) {
      this.password = state.password;
    }
  }

  async ngOnInit() {
    this.isMobile = window.innerWidth <= 1000;
    if (this.isMobile) {
      this.isLeftExpanded = true;
      this.isRightExpanded = false;
    }
    this.userInfo = this.appService.decodeToken();
    if (!this.password) {
      this.isModalOpen = true;
    } else {
      this.setPrivateKey(this.password);
    }
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

  async setPrivateKey(password: string) {
    const encryptedData = localStorage.getItem('privateKey');
    const salt = localStorage.getItem('salt');
    const iv = localStorage.getItem('iv');
    if (encryptedData && salt && iv && password && this.userInfo.PublicKey && this.userInfo.PublicKeyId) {
      this.privateKey = await this.encryptionService.decryptPrivateKey(encryptedData, salt, iv, password);
    } else {
      this.appService.logout(this.userInfo);
    }
    this.isModalOpen = false;
    this.processMessages()
  }

  getFriends() {
    this.chatMenuService.getFriends().subscribe((res: any) => {
      if (res?.data) {
        this.friends = res.data;
        this.updateConversations();
      }
    });
  }

  updateConversations() {
    if (!this.conversations || !this.friends) return;

    for (let friend of this.friends) {
      const conversation = this.conversations.find(conv => conv.conversationId === friend.id);

      if (conversation) {
        const hasChanged =
          conversation.firstName !== friend.firstName ||
          conversation.lastName !== friend.lastName ||
          conversation.avatar !== friend.avatar ||
          JSON.stringify(conversation.activeBrowsers) !== JSON.stringify(friend.activeBrowsers);

        if (hasChanged) {
          conversation.firstName = friend.firstName;
          conversation.lastName = friend.lastName;
          conversation.avatar = friend.avatar;
          conversation.activeBrowsers = friend.activeBrowsers;

          // Only update this one conversation in IndexedDB
          this.indexedDBService.updateData(conversation, this.conversationsStoreName);
        }
      }
    }
  }

  async processMessages() {
    for (let conversation of this.conversations) {
      for (let msg of conversation.messages) {
        msg.decryptedMessage = await this.encryptionService.decryptMessage(this.privateKey, msg.message);
        if (msg.files) {
          msg.decryptedFiles = [];
          for (let file of msg.files) {
            msg.decryptedFiles.push(await this.encryptionService.decryptFile(file.encryptedFile, file.encryptedAesKey, file.iv, file.mimeType, file.originalFileName, this.privateKey))
          }
        }
      }
    }
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

  async sendMessage(data: any) {
    const trimmedMessage = data.message.trim();
    if (!trimmedMessage && (!data.files || data.files.length === 0)) return; // Prevent sending empty messages

    // Encrypt message for local display (to self)
    const encryptedForSender = await this.encryptionService.encryptMessage(this.userInfo.PublicKey, trimmedMessage);
    const encryptedFilesForSender: any[] = [];
    for (let file of data.files) {
      const encryptedFile = await this.encryptionService.encryptFile(file.file, this.userInfo.PublicKey);
      encryptedFilesForSender.push(encryptedFile);
    }

    const newMessage = {
      id: crypto.randomUUID(),
      sender: this.userInfo.Id,
      message: encryptedForSender,
      files: encryptedFilesForSender,
      timeSent: Math.floor(Date.now() / 1000),
      decryptedMessage: trimmedMessage,
      decryptedFiles: data.files
    };

    // Add message to local conversation
    const conversation = this.conversations.find(
      user => user.conversationId === this.activeConversation.conversationId
    );
    if (conversation) {
      conversation.messages.push(newMessage);
    }
    const merged = [...this.userInfo.ActiveBrowsers, ...this.activeConversation.activeBrowsers];
    const messages = await Promise.all(
      merged.map(async browser => {
        const encryptedMessage = await this.encryptionService.encryptMessage(browser.publicKey, trimmedMessage);
        const encryptedFiles = await Promise.all(
          data.files.map(async (file: { file: File; }) => {
            const encrypted = await this.encryptionService.encryptFile(file.file, browser.publicKey);
            const encryptedFileB64 = await this.encryptionService.blobToBase64(encrypted.encryptedFile);
            return {
              encryptedFile: encryptedFileB64,
              encryptedAesKey: encrypted.encryptedAesKey,
              iv: encrypted.iv,
              originalFileName: file.file.name,
              mimeType: file.file.type,
            };
          })
        );
        return {
          receiver: browser.id,
          message: encryptedMessage,
          files: encryptedFiles
        };
      })
    );
    const sendMessages = {
      id: newMessage.id,
      sender: newMessage.sender,
      timeSent: newMessage.timeSent,
      messages: messages
    };
    this.signalrService.sendMessage("SendMessage", sendMessages);
    setTimeout(() => {
      const conversationToStore = this.cleanConversation(conversation);
      this.indexedDBService.updateData(conversationToStore, this.conversationsStoreName);
    });
  }

  async handleIncomingMessage(data: any): Promise<void> {
    const findConversation = this.conversations.find(x => x.conversationId === data.sender);
    if (this.privateKey) {
      data.decryptedMessage = await this.encryptionService.decryptMessage(this.privateKey, data.message);
      data.decryptedFiles = [];
      for (let file of data.files) {
        const blob = this.encryptionService.base64ToBlob(file.encryptedFile, file.mimeType);
        file.encryptedFile = blob;
        data.decryptedFiles.push(await this.encryptionService.decryptFile(file.encryptedFile, file.encryptedAesKey, file.iv, file.mimeType, file.originalFileName, this.privateKey))
      }
    }
    if (data.sender !== this.userInfo.Id && !findConversation) {
      const findFriend = this.friends.find(user => user.id === data.sender);
      if (findFriend) {
        const newConversation = {
          senderId: this.userInfo.Id,
          conversationId: findFriend.id,
          firstName: findFriend.firstName,
          lastName: findFriend.lastName,
          activeBrowsers: findFriend.activeBrowsers,
          messages: [data],
          avatar: findFriend.avatar
        };
        this.conversations.push(newConversation);
        setTimeout(() => {
          const conversationToStore = this.cleanConversation(newConversation);
          this.indexedDBService.updateData(conversationToStore, this.conversationsStoreName);
        });
        return;
      }
    } else if (data.sender !== this.userInfo.Id && findConversation) {
      findConversation.messages.push(data);
      setTimeout(() => {
        const conversationToStore = this.cleanConversation(findConversation);
        this.indexedDBService.updateData(conversationToStore, this.conversationsStoreName);
      });
    }
  }

  cleanConversation(conversation: { messages: { decryptedMessage?: string; decryptedFiles?: any[];[key: string]: any }[];[key: string]: any; }) {
    return {
      ...conversation,
      messages: conversation.messages.map(({ decryptedMessage, decryptedFiles, ...rest }) => rest)
    };
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
        activeBrowsers: friend.activeBrowsers,
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
    this.isLeftExpanded = false;
    this.isRightExpanded = true;
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

  toggleLeft() {
    this.isLeftExpanded = true;
    this.isRightExpanded = false;
  }

  toggleRight() {
    this.isLeftExpanded = false;
    this.isRightExpanded = true;
  }

  ngOnDestroy() {
    this.signalrService.stopConnection();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.isMobile = window.innerWidth <= 1000;
    if (!this.isMobile) {
      this.isLeftExpanded = true;
      this.isRightExpanded = false;
    } else {
      this.isLeftExpanded = true;
      this.isRightExpanded = true;
    }
  }
}
