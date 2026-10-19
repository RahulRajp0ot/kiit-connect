import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Client } from '@stomp/stompjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink, MatCardModule, MatButtonModule,
    MatIconModule, MatInputModule, MatFormFieldModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="chat-page">
      <!-- Chat Header -->
      <div class="chat-header">
        <button mat-icon-button class="back-btn" routerLink="/matches" title="Back to Matches">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <img [src]="getPartnerAvatar(partnerPhoto)" [alt]="partnerName" class="partner-avatar" (error)="onAvatarError($event)">
        <div class="partner-info">
          <h3>{{partnerName || 'Chat'}}</h3>
          <span class="status" [class.connected]="connected">
            <span class="dot" [class.online]="connected"></span>
            {{connected ? 'Live Chat Active' : 'Connecting...'}}
          </span>
        </div>
      </div>

      <!-- Messages -->
      <div class="messages-area" #scrollContainer>
        <div class="loading-msgs" *ngIf="loadingHistory">
          <mat-spinner diameter="32"></mat-spinner>
        </div>

        <div class="day-start" *ngIf="messages.length === 0 && !loadingHistory">
          <div class="match-wave-icon">👋</div>
          <h3>You matched with {{ partnerName || 'each other' }}!</h3>
          <span>Break the ice! Say hi and spark a conversation 💕</span>
        </div>

        <div *ngFor="let msg of messages"
          class="msg-bubble"
          [class.mine]="msg.senderId === myId"
          [class.theirs]="msg.senderId !== myId">
          <div class="bubble-content">
            <p>{{msg.content}}</p>
            <span class="msg-time">{{formatTime(msg.sentAt)}}</span>
          </div>
        </div>
        <div #bottomAnchor></div>
      </div>

      <!-- Input Bar -->
      <div class="input-bar">
        <mat-form-field appearance="outline" class="msg-field">
          <input matInput [formControl]="messageCtrl"
            placeholder="Type a message..."
            (keydown.enter)="sendMessage()">
        </mat-form-field>
        <button mat-fab class="send-btn" (click)="sendMessage()"
          [disabled]="!messageCtrl.value?.trim() || sending">
          <mat-icon *ngIf="!sending">send</mat-icon>
          <mat-spinner diameter="20" *ngIf="sending" color="accent"></mat-spinner>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .chat-page {
      height: calc(100vh - 64px);
      display: flex;
      flex-direction: column;
      max-width: 700px;
      margin: 0 auto;
      background: #f8fafc;
    }
    .chat-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      flex-shrink: 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .back-btn {
      color: #64748b;
      margin-right: -4px;
    }
    .partner-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #ff4b72;
    }
    .partner-info h3 {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 700;
      color: #0f172a;
    }
    .status {
      font-size: 0.75rem;
      color: #94a3b8;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .status.connected {
      color: #10b981;
      font-weight: 600;
    }
    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #cbd5e1;
    }
    .dot.online {
      background: #10b981;
    }
    .messages-area {
      flex: 1;
      overflow-y: auto;
      padding: 20px 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .loading-msgs { display: flex; justify-content: center; padding: 32px; }
    .day-start {
      text-align: center;
      padding: 40px 16px;
      background: white;
      border-radius: 20px;
      margin: 20px auto;
      max-width: 380px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.03);
      border: 1px dashed #fbcfe8;
    }
    .match-wave-icon {
      font-size: 2.5rem;
      margin-bottom: 8px;
    }
    .day-start h3 {
      font-size: 1.05rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .day-start span {
      font-size: 0.85rem;
      color: #64748b;
    }
    .msg-bubble { display: flex; width: 100%; }
    .msg-bubble.mine { justify-content: flex-end; }
    .msg-bubble.theirs { justify-content: flex-start; }
    .bubble-content {
      max-width: 75%;
      padding: 10px 14px;
      border-radius: 18px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.04);
      position: relative;
    }
    .msg-bubble.mine .bubble-content {
      background: linear-gradient(135deg, #ff4b72, #ec4899);
      color: white;
      border-bottom-right-radius: 4px;
    }
    .msg-bubble.theirs .bubble-content {
      background: white;
      color: #1e293b;
      border-bottom-left-radius: 4px;
      border: 1px solid #f1f5f9;
    }
    .bubble-content p {
      margin: 0;
      font-size: 0.95rem;
      line-height: 1.45;
      word-break: break-word;
      white-space: pre-wrap;
    }
    .msg-time {
      font-size: 0.68rem;
      display: block;
      margin-top: 4px;
      text-align: right;
      opacity: 0.75;
    }
    .input-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: white;
      box-shadow: 0 -2px 12px rgba(0,0,0,0.05);
      flex-shrink: 0;
      border-top: 1px solid #f1f5f9;
    }
    .msg-field { flex: 1; margin-bottom: -1.25em; }
    .send-btn {
      background: linear-gradient(135deg, #ff4b72, #ec4899) !important;
      color: white !important;
      flex-shrink: 0;
      width: 48px !important;
      height: 48px !important;
    }
    @media (max-width: 768px) {
      .chat-page {
        height: calc(100dvh - 140px);
        margin-bottom: 70px;
      }
      .chat-header {
        padding: 8px 12px;
      }
      .partner-avatar {
        width: 38px;
        height: 38px;
      }
      .bubble-content {
        max-width: 85%;
        padding: 8px 12px;
      }
      .input-bar {
        padding: 8px 10px;
        gap: 6px;
      }
      .send-btn {
        width: 42px !important;
        height: 42px !important;
      }
    }
  `]
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('bottomAnchor') bottomAnchor!: ElementRef;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  matchId!: number;
  messages: any[] = [];
  messageCtrl = new FormControl('');
  loadingHistory = true;
  connected = false;
  sending = false;
  partnerName = '';
  partnerPhoto = '';
  myId!: number;
  private stompClient?: Client;
  private shouldScroll = false;
  private pollInterval?: any;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.matchId = +this.route.snapshot.paramMap.get('matchId')!;
    const user = this.auth.currentUserValue;
    this.myId = user?.userId ?? 0;

    this.loadHistory();
    this.loadPartnerInfo();
    this.connectWebSocket();

    // Polling fallback every 3 seconds to guarantee 100% message delivery
    this.pollInterval = setInterval(() => {
      this.pollMessages();
    }, 3000);
  }

  loadPartnerInfo() {
    this.api.getMatches().subscribe({
      next: (matches: any[]) => {
        const match = matches?.find((m: any) => m.matchId === this.matchId);
        if (match) {
          this.partnerName = match.matchedUserName;
          this.partnerPhoto = match.matchedUserPhoto || '';
        }
      }
    });
  }

  loadHistory() {
    this.api.getChatHistory(this.matchId).subscribe({
      next: (msgs: any[]) => {
        this.messages = msgs || [];
        this.loadingHistory = false;
        this.shouldScroll = true;
      },
      error: () => {
        this.loadingHistory = false;
      }
    });
  }

  pollMessages() {
    this.api.getChatHistory(this.matchId).subscribe({
      next: (msgs: any[]) => {
        if (!msgs) return;
        let hasNew = false;
        for (const m of msgs) {
          if (!this.messages.some(existing => existing.id === m.id)) {
            this.messages.push(m);
            hasNew = true;
          }
        }
        if (hasNew) {
          this.shouldScroll = true;
        }
      }
    });
  }

  connectWebSocket() {
    try {
      const token = this.auth.getToken();
      let wsBase = environment.wsUrl;
      if (typeof window !== 'undefined' && wsBase.includes('localhost') && window.location.hostname !== 'localhost') {
        wsBase = wsBase.replace('localhost', window.location.hostname);
      }
      const wsUrl = wsBase.replace(/^http/, 'ws');

      this.stompClient = new Client({
        brokerURL: wsUrl,
        connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
        onConnect: () => {
          this.connected = true;
          this.stompClient?.subscribe(`/topic/match/${this.matchId}`, (frame) => {
            try {
              const msg = JSON.parse(frame.body);
              if (msg && !this.messages.some(m => m.id === msg.id)) {
                this.messages.push(msg);
                this.shouldScroll = true;
              }
            } catch (e) {}
          });
        },
        onDisconnect: () => { this.connected = false; },
        reconnectDelay: 4000
      });
      this.stompClient.activate();
    } catch (e) {
      this.connected = false;
    }
  }

  sendMessage() {
    const content = this.messageCtrl.value?.trim();
    if (!content || this.sending) return;

    this.sending = true;
    this.messageCtrl.reset();

    // 1. Send via REST endpoint (100% reliable - persists to database and triggers WS broadcast)
    this.api.sendChatMessage(this.matchId, content).subscribe({
      next: (savedMsg: any) => {
        this.sending = false;
        if (savedMsg && !this.messages.some(m => m.id === savedMsg.id)) {
          this.messages.push(savedMsg);
          this.shouldScroll = true;
        }
      },
      error: () => {
        this.sending = false;
      }
    });

    // 2. Also publish over STOMP if connected (including senderId)
    if (this.connected && this.stompClient) {
      try {
        this.stompClient.publish({
          destination: `/app/chat/${this.matchId}`,
          body: JSON.stringify({ content, matchId: this.matchId, senderId: this.myId })
        });
      } catch (e) {}
    }
  }

  getPartnerAvatar(url?: string): string {
    if (url) {
      if (typeof window !== 'undefined' && url.startsWith('http://localhost:8088') && window.location.hostname !== 'localhost') {
        return url.replace('http://localhost:8088', `${window.location.protocol}//${window.location.hostname}:8088`);
      }
      return url;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.partnerName || 'Match')}&background=ff4b72&color=fff&size=128`;
  }

  onAvatarError(event: any) {
    event.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.partnerName || 'Match')}&background=ff4b72&color=fff&size=128`;
  }

  formatTime(isoStr: string) {
    if (!isoStr) return '';
    try {
      return new Date(isoStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.bottomAnchor?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
      this.shouldScroll = false;
    }
  }

  ngOnDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    try {
      this.stompClient?.deactivate();
    } catch (e) {}
  }
}
