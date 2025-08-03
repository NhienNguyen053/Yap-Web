import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppService } from '../app.service';
import Swiper from 'swiper';
import { ChatMenuService } from './chat-menu.service';
import { IndexedDBService } from '../services/indexed-db.service';
import { SignalRService } from '../services/signalr.service';
import { find, Subscription } from 'rxjs';
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
  @ViewChild('swiperContainer', { static: false }) swiperContainer:
    | ElementRef
    | undefined;
  userInfo: any;
  activeTab: string = 'chat';
  activeConversation: any;
  contacts: any[] = [];
  groups: any[] = [];
  conversations: any[] = [];
  subscription!: Subscription;
  conversationsStoreName = 'Conversations';
  privateKey: any;
  isModalOpen = false;
  enterPasswordModalId = MODAL_CONSTANTS.ENTER_PASSWORD;
  password: any;
  isLogin: boolean = false;
  isLeftExpanded = false;
  isRightExpanded = false;
  isMobile = false;
  activeBrowsers: any[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private appService: AppService,
    private chatMenuService: ChatMenuService,
    private indexedDBService: IndexedDBService,
    private signalrService: SignalRService,
    private toastrService: ToastrService,
    private encryptionService: EncryptionService
  ) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { password?: string, isLogin?: boolean };
    if (state?.password) {
      this.password = state.password;
    }
    if (state?.isLogin) {
      this.isLogin = state.isLogin;
    }
    history.replaceState({}, '', window.location.href);
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
      await this.signalrService.startConnection(token);
      this.signalrService.onMessage(
        ['ReceiveMessage', 'AcceptContact', 'ContactLogin', 'ContactLogout'],
        this.handleSignalREvent.bind(this)
      );
    }
    this.getContacts();
    this.getActiveBrowsers();
    this.route.queryParams.subscribe((params) => {
      const chatId = params['chatId'];
      const tab = params['tab'];
      if (chatId) {
        const found = this.conversations.find(
          (c) => c.conversationId === chatId
        );
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
    if (
      encryptedData &&
      salt &&
      iv &&
      password &&
      this.userInfo.PublicKey &&
      this.userInfo.PublicKeyId
    ) {
      this.privateKey = await this.encryptionService.decryptPrivateKey(
        encryptedData,
        salt,
        iv,
        password
      );
    } else {
      this.appService.logout(this.userInfo);
    }
    this.isModalOpen = false;
    this.processMessages();
  }

  getActiveBrowsers() {
    this.chatMenuService.getActiveBrowsers().subscribe((res: any) => {
      if (res?.data) {
        this.activeBrowsers = res.data;
      }
    })
  }

  getContacts() {
    this.chatMenuService.getContacts().subscribe((res: any) => {
      if (res?.data) {
        this.contacts = res.data;
        if (this.isLogin) {
          const allIds = this.contacts.flatMap(item =>
            item.activeBrowsers.map((browser: { id: any; }) => browser.id)
          );
          const request = {
            Id: this.userInfo.Id,
            PublicKeyId: this.userInfo.PublicKeyId,
            PublicKey: this.userInfo.PublicKey,
            Receivers: allIds
          }
          this.signalrService.sendMessage("ContactLogin", request)
        }
        this.updateConversations();
      }
    });
  }

  getGroups() {

  }

  updateConversations() {
    if (!this.conversations || !this.contacts) return;

    for (let contact of this.contacts) {
      const conversation = this.conversations.find(
        (conv) => conv.conversationId === contact.id
      );

      if (conversation) {
        const hasChanged =
          conversation.firstName !== contact.firstName ||
          conversation.lastName !== contact.lastName ||
          conversation.avatar !== contact.avatar ||
          JSON.stringify(conversation.activeBrowsers) !==
          JSON.stringify(contact.activeBrowsers);

        if (hasChanged) {
          conversation.firstName = contact.firstName;
          conversation.lastName = contact.lastName;
          conversation.avatar = contact.avatar;
          conversation.activeBrowsers = contact.activeBrowsers;

          // Only update this one conversation in IndexedDB
          this.indexedDBService.updateData(
            conversation,
            this.conversationsStoreName
          );
        }
      }
    }
  }

  async processMessages() {
    for (let conversation of this.conversations) {
      for (let msg of conversation.messages) {
        msg.decryptedMessage = await this.encryptionService.decryptMessage(
          this.privateKey,
          msg.message
        );
        if (msg.files) {
          msg.decryptedFiles = [];
          for (let file of msg.files) {
            msg.decryptedFiles.push(
              await this.encryptionService.decryptFile(
                file.encryptedFile,
                file.encryptedAesKey,
                file.iv,
                file.mimeType,
                file.originalFileName,
                this.privateKey
              )
            );
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

      case 'AcceptContact':
        this.contacts = data.data;
        this.toastrService.success(
          this.contacts.at(-1).firstName +
          ' ' +
          this.contacts.at(-1).lastName +
          ' has accepted your contact request!'
        );
        break;

      case 'ContactLogin':
        if (this.activeConversation?.conversationId === data.id) {
          this.addBrowserId(this.activeConversation, data.publicKeyId, data.publicKey);
        }
        this.addBrowserId(this.conversations.find(x => x.id === data.id), data.publicKeyId, data.publicKey);
        this.addBrowserId(this.contacts.find(x => x.id === data.id), data.publicKeyId, data.publicKey);
        break;

      case 'ContactLogout':
        if (this.activeConversation?.conversationId === data.id) {
          this.removeBrowserId(this.activeConversation, data.publicKeyId);
        }
        this.removeBrowserId(this.conversations.find(x => x.id === data.id), data.publicKeyId);
        this.removeBrowserId(this.contacts.find(x => x.id === data.id), data.publicKeyId);
        break;

      default:
        break;
    }
  }

  async sendMessage(data: any) {
    const trimmedMessage = data.message.trim();
    if (!trimmedMessage && (!data.files || data.files.length === 0)) return; // Prevent sending empty messages

    // Encrypt message for local display (to self)
    const encryptedForSender = await this.encryptionService.encryptMessage(
      this.userInfo.PublicKey,
      trimmedMessage
    );
    const encryptedFilesForSender: any[] = [];
    for (let file of data.files) {
      const encryptedFile = await this.encryptionService.encryptFile(
        file.file,
        this.userInfo.PublicKey
      );
      encryptedFilesForSender.push(encryptedFile);
    }

    const newMessage = {
      id: crypto.randomUUID(),
      sender: this.userInfo.Id,
      message: encryptedForSender,
      files: encryptedFilesForSender,
      timeSent: Math.floor(Date.now() / 1000),
      decryptedMessage: trimmedMessage,
      decryptedFiles: data.files,
      replyTo: data.replyTo?.id
    };

    // Add message to local conversation
    const conversation = this.conversations.find(
      (user) => user.conversationId === this.activeConversation.conversationId
    );
    if (conversation) {
      conversation.messages.push(newMessage);
    }
    const merged = [
      ...this.activeBrowsers.filter(x => x.id !== this.userInfo.PublicKeyId),
      ...this.activeConversation.activeBrowsers,
    ];
    const messages = await Promise.all(
      merged.map(async (browser) => {
        const encryptedMessage = await this.encryptionService.encryptMessage(
          browser.publicKey,
          trimmedMessage
        );
        const encryptedFiles = await Promise.all(
          data.files.map(async (file: { file: File }) => {
            const encrypted = await this.encryptionService.encryptFile(
              file.file,
              browser.publicKey
            );
            const encryptedFileB64 = await this.encryptionService.blobToBase64(
              encrypted.encryptedFile
            );
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
          receiver: browser.id || browser.Id,
          message: encryptedMessage,
          files: encryptedFiles,
        };
      })
    );
    const sendMessages = {
      id: newMessage.id,
      sender: newMessage.sender,
      timeSent: newMessage.timeSent,
      messages: messages,
      replyTo: data.replyTo?.id
    };
    if (sendMessages.messages.length > 0) {
      this.signalrService.sendMessage('SendMessage', sendMessages);
      setTimeout(() => {
        const conversationToStore = this.cleanConversation(conversation);
        this.indexedDBService.updateData(
          conversationToStore,
          this.conversationsStoreName
        );
      });
    }
  }

  async handleIncomingMessage(data: any): Promise<void> {
    const findConversation = this.conversations.find(
      (x) => x.conversationId === data.sender
    );
    if (this.privateKey) {
      data.decryptedMessage = await this.encryptionService.decryptMessage(
        this.privateKey,
        data.message
      );
      data.decryptedFiles = [];
      for (let file of data.files) {
        const blob = this.encryptionService.base64ToBlob(
          file.encryptedFile,
          file.mimeType
        );
        file.encryptedFile = blob;
        data.decryptedFiles.push(
          await this.encryptionService.decryptFile(
            file.encryptedFile,
            file.encryptedAesKey,
            file.iv,
            file.mimeType,
            file.originalFileName,
            this.privateKey
          )
        );
      }
    }
    if (data.sender !== this.userInfo.Id && !findConversation) {
      const findContact = this.contacts.find((user) => user.id === data.sender);
      if (findContact) {
        const newConversation = {
          senderId: this.userInfo.Id,
          conversationId: findContact.id,
          firstName: findContact.firstName,
          lastName: findContact.lastName,
          activeBrowsers: findContact.activeBrowsers,
          messages: [data],
          avatar: findContact.avatar,
        };
        this.conversations.push(newConversation);
        setTimeout(() => {
          const conversationToStore = this.cleanConversation(newConversation);
          this.indexedDBService.updateData(
            conversationToStore,
            this.conversationsStoreName
          );
        });
        return;
      }
    } else if (data.sender !== this.userInfo.Id && findConversation) {
      findConversation.messages.push(data);
      setTimeout(() => {
        const conversationToStore = this.cleanConversation(findConversation);
        this.indexedDBService.updateData(
          conversationToStore,
          this.conversationsStoreName
        );
      });
    }
  }

  cleanConversation(conversation: {
    messages: {
      decryptedMessage?: string;
      decryptedFiles?: any[];
      [key: string]: any;
    }[];
    [key: string]: any;
  }) {
    return {
      ...conversation,
      messages: conversation.messages.map(
        ({ decryptedMessage, decryptedFiles, ...rest }) => rest
      ),
    };
  }

  acceptContact(contact: any): void {
    this.contacts.push(contact);
  }

  async getItems() {
    try {
      return await this.indexedDBService.getAllData<any>(
        this.conversationsStoreName,
        (conversation) => conversation.senderId === this.userInfo.Id
      );
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

  goToConversation(contact: any) {
    const conversation = this.conversations.find(
      (user) => user.conversationId === contact.id
    );
    if (conversation) {
      this.changeConversation(conversation);
    } else {
      const newConversation = {
        senderId: this.userInfo.Id,
        conversationId: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        activeBrowsers: contact.activeBrowsers,
        messages: [],
        avatar: contact.avatar,
      };
      this.conversations.push(newConversation);
      setTimeout(() => {
        this.indexedDBService.updateData(
          newConversation,
          this.conversationsStoreName
        );
        this.changeConversation(newConversation);
      });
    }
  }

  changeConversation(conversation: any) {
    this.isLeftExpanded = false;
    this.isRightExpanded = true;
    const chatId = conversation.conversationId;
    // Trigger logic manually in case same id
    const found = this.conversations.find((c) => c.conversationId === chatId);
    if (found) {
      this.activeConversation = found;
    }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { chatId: conversation.conversationId },
      queryParamsHandling: 'merge',
    });
  }

  logout() {
    const allIds = this.contacts.flatMap(item =>
      item.activeBrowsers.map((browser: { id: any; }) => browser.id)
    );
    const request = {
      Id: this.userInfo.Id,
      PublicKeyId: this.userInfo.PublicKeyId,
      Receivers: allIds
    }
    this.signalrService.sendMessage("ContactLogout", request);
    this.userInfo = this.appService.logout(this.userInfo);
  }

  updateContactList(event: any) {
    this.contacts.push(event);
    const accept = {
      Id: event.id,
      PublicKeyIds: event.publicKeys,
    };
    this.signalrService.sendMessage('AcceptContact', accept);
  }

  toggleLeft() {
    this.isLeftExpanded = true;
    this.isRightExpanded = false;
  }

  toggleRight() {
    this.isLeftExpanded = false;
    this.isRightExpanded = true;
  }

  addBrowserId(item: { activeBrowsers: { id: any; publicKey?: string }[] } | undefined, browserId: any, publicKey: string) {
    if (item) {
      if (!Array.isArray(item.activeBrowsers)) {
        item.activeBrowsers = [];
      }

      const exists = item.activeBrowsers.some(browser => browser.id === browserId);
      if (!exists) {
        item.activeBrowsers.push({ id: browserId, publicKey: publicKey });
      }
    }
  }

  removeBrowserId(item: { activeBrowsers: { id: any }[] } | undefined, browserId: any) {
    if (item && Array.isArray(item.activeBrowsers)) {
      item.activeBrowsers = item.activeBrowsers.filter(browser => browser.id !== browserId);
    }
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
