import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppService } from '../app.service';
import { EnumStatusOnline } from '../enums/EnumStatus';
import { DatePipe } from '@angular/common';
import Swiper from 'swiper';

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
  conversations = [
    {
      conversationId: '1',
      status: EnumStatusOnline.DoNotDisturb,
      firstName: 'Joel',
      lastName: 'Miller',
      lastMessage: 'hello joel',
      lastMessageSent: 1748695030,
      lastUserSent: '',
      messages: [

      ],
      avatar: 'https://firebasestorage.googleapis.com/v0/b/yap-web-27230.firebasestorage.app/o/avatars%2Fjoelmiller053%40gmail.com.png?alt=media&token=ca1e8caf-c955-4877-8494-8ba04967c8d9'
    },
    {
      conversationId: '2',
      status: EnumStatusOnline.Online,
      firstName: 'Nathan', lastName: 'Drake',
      lastMessage: 'hello nathan',
      lastMessageSent: 1717050030,
      messages: [

      ],
      avatar: 'https://firebasestorage.googleapis.com/v0/b/yap-web-27230.firebasestorage.app/o/avatars%2Frigbybaby123%40gmail.com.png?alt=media&token=e1ac95d3-b8fd-46e6-b240-192ab7401bbf'
    }
  ]

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private appService: AppService,
    private datePipe: DatePipe
  ) { }

  ngOnInit() {
    document.documentElement.setAttribute('data-theme', this.theme);
    this.userInfo = this.appService.decodeToken();
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

  changeConversation(conversation: any) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { chatId: conversation.conversationId },
      queryParamsHandling: 'merge',
    });
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
}
