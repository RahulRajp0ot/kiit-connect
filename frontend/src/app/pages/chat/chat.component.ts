import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
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
    CommonModule, ReactiveFormsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatInputModule, MatFormFieldModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="chat-page">
      <!-- Chat Header -->
      <div class="chat-header">
        <img [src]="partnerPhoto" [alt]="partnerName" class="partner-avatar">
        <div class="partner-info">
          <h3>{{partnerName}}</h3>
          <span class="status" [class.connected]="connected">
            {{connected ? 'Online' : 'Connecting...'}}
          </span>
        </div>
      </div>

      <!-- Messages -->
      <div class="messages-area" #scrollContainer>
        <div class="loading-msgs" *ngIf="loadingHistory">
          <mat-spinner diameter="32"></mat-spinner>
        </div>

        <div class="day-start" *ngIf="messages.length === 0 && !loadingHistory">
          <span>Send your first message! 👋</span>
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
          [disabled]="!messageCtrl.value?.trim() || !connected">
          <mat-icon>send</mat-icon>
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
      background: #f9f9f9;
    }
    .chat-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      background: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      flex-shrink: 0;
    }
    .partner-avatar {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #ff6b9d;
    }
    .partner-info h3 { margin: 0; font-size: 1rem; font-weight: 600; }
    .status { font-size: 0.75rem; color: #999; }
    .status.connected { color: #4caf50; }
    .messages-area {
      flex: 1;
      overflow-y: auto;
      padding: 20px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .loading-msgs { display: flex; justify-content: center; padding: 32px; }
    .day-start {
      text-align: center;
      color: #bbb;
      font-size: 0.85rem;
      padding: 16px 0;
    }
    .msg-bubble { display: flex; }
    .msg-bubble.mine { justify-content: flex-end; }
    .msg-bubble.theirs { justify-content: flex-start; }
    .bubble-content {
      max-width: 70%;
      padding: 10px 14px;
      border-radius: 18px;
      position: relative;
    }
    .mine .bubble-content {
      background: linear-gradient(135deg, #ff6b9d, #c44dff);
      color: white;
      border-bottom-right-radius: 4px;
    }
    .theirs .bubble-content {
      background: white;
      color: #333;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }
    .bubble-content p { margin: 0 0 4px; line-height: 1.4; word-break: break-word; }
    .msg-time {
      font-size: 0.65rem;
      opacity: 0.7;
      display: block;
      text-align: right;
    }
    .input-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: white;
      box-shadow: 0 -2px 8px rgba(0,0,0,0.06);
      flex-shrink: 0;
    }
    .msg-field { flex: 1; margin-bottom: -1.25em; }
    .send-btn {
      background: linear-gradient(135deg, #ff6b9d, #c44dff) !important;
      color: white !important;
      flex-shrink: 0;
      width: 48px !important;
      height: 48px !important;
    }
    @media (max-width: 768px) {
      .chat-page {
        height: calc(100dvh - 145px);
        margin-bottom: 20px;
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
        border-radius: 16px;
      }
      .input-bar {
        padding: 8px 10px;
        gap: 6px;
      }
      .send-btn {
        width: 40px !important;
        height: 40px !important;
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
  partnerName = '';
  partnerPhoto = '';
  myId!: number;
  private stompClient!: Client;
  private shouldScroll = false;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.matchId = +this.route.snapshot.paramMap.get('matchId')!;
    const user = this.auth.currentUserValue;
    this.myId = user?.userId ?? 0;

    this.api.getChatHistory(this.matchId).subscribe({
      next: (msgs: any[]) => {
        this.messages = msgs;
        this.loadingHistory = false;
        this.shouldScroll = true;
        // Get partner info from match
        this.api.getMatches().subscribe((matches: any[]) => {
          const match = matches.find((m: any) => m.matchId === this.matchId);
          if (match) {
            this.partnerName = match.matchedUserName;
            this.partnerPhoto = match.matchedUserPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(match.matchedUserName)}&background=ff6b9d&color=fff&size=128`;
          }
        });
      }
    });

    this.connectWebSocket();
  }

  connectWebSocket() {
    const token = this.auth.getToken();
    const wsUrl = environment.wsUrl.replace(/^http/, 'ws');
    this.stompClient = new Client({
      brokerURL: wsUrl,
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        this.connected = true;
        this.stompClient.subscribe(`/topic/match/${this.matchId}`, (frame) => {
          const msg = JSON.parse(frame.body);
          this.messages.push(msg);
          this.shouldScroll = true;
        });
      },
      onDisconnect: () => { this.connected = false; },
      reconnectDelay: 5000
    });
    this.stompClient.activate();
  }

  sendMessage() {
    const content = this.messageCtrl.value?.trim();
    if (!content || !this.connected) return;

    this.stompClient.publish({
      destination: `/app/chat/${this.matchId}`,
      body: JSON.stringify({ content, matchId: this.matchId })
    });
    this.messageCtrl.reset();
  }

  formatTime(isoStr: string) {
    if (!isoStr) return '';
    return new Date(isoStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.bottomAnchor?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
      this.shouldScroll = false;
    }
  }

  ngOnDestroy() {
    this.stompClient?.deactivate();
  }
}
