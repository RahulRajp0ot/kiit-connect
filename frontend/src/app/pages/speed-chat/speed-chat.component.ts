import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Client } from '@stomp/stompjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-speed-chat',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatInputModule, MatFormFieldModule, MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <div class="speed-chat-container">

      <!-- ── 1. SETUP / LOBBY STATE ────────────────────────────────────── -->
      <div class="lobby-card" *ngIf="state === 'IDLE'">
        <div class="lobby-badge">
          <mat-icon>bolt</mat-icon>
          <span>Speed Connect · Real-time Anonymous Match</span>
        </div>
        <h1 class="lobby-title">Random 1-on-1 Chat</h1>
        <p class="lobby-desc">
          Match with another KIIT student instantly in real time!
          No profile photos are shared. Chats are temporary and disappear forever when you disconnect or refresh.
        </p>

        <div class="anon-preview-pill">
          <div class="anon-avatar">🎭</div>
          <div class="anon-info">
            <span class="anon-label">Your Public Persona</span>
            <span class="anon-name">{{ tempName || 'KIITian' }} (Age: {{ age }})</span>
          </div>
        </div>

        <div class="setup-form">
          <div class="form-row">
            <mat-form-field appearance="outline" class="flex-field">
              <mat-label>Temporary Nickname</mat-label>
              <input matInput [(ngModel)]="tempName" placeholder="e.g. KIITian, Batman, CoffeeLover" maxlength="25">
              <mat-hint>Default is "KIITian". Can be anything you want.</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="age-field">
              <mat-label>Age (18+)</mat-label>
              <input matInput type="number" [(ngModel)]="age" min="18" max="99">
              <mat-hint>Must be 18</mat-hint>
            </mat-form-field>
          </div>

          <div class="guidelines-box">
            <mat-icon>shield</mat-icon>
            <div> 
            <strong>Campus Safety Note:</strong> 
            Please keep all conversations respectful and appropriate. Harassment or abusive behavior is not permitted. </div>
          </div>

          <div class="limit-warning-banner" *ngIf="limitExceeded">
            <mat-icon>warning_amber</mat-icon>
            <div class="limit-warning-text">
              <strong>Limit Exceeded</strong>
              <p>{{ limitExceededMessage || 'Ur daily speed connect limit exceed' }}</p>
            </div>
          </div>

          <button mat-raised-button class="start-btn" (click)="startMatching()">
            <mat-icon>shuffle</mat-icon>
            <span>Start Random Connect</span>
          </button>
        </div>
      </div>

      <!-- ── 2. SEARCHING / RADAR STATE ────────────────────────────────── -->
      <div class="searching-card" *ngIf="state === 'SEARCHING'">
        <div class="radar-wrap">
          <div class="radar-pulse ring-1"></div>
          <div class="radar-pulse ring-2"></div>
          <div class="radar-pulse ring-3"></div>
          <div class="radar-core">
            <mat-icon>radar</mat-icon>
          </div>
        </div>

        <h2 class="search-title">Finding an active KIITian...</h2>
        <p class="search-sub">
          Looking for someone online looking for a chat. You'll be connected the instant a match appears!
        </p>

        <button mat-stroked-button class="cancel-search-btn" (click)="cancelSearch()">
          <mat-icon>close</mat-icon>
          <span>Cancel Search</span>
        </button>
      </div>

      <!-- ── 3. CHATTING STATE ─────────────────────────────────────────── -->
      <div class="chat-interface" *ngIf="state === 'CHATTING'">
        <!-- Chat Header -->
        <div class="chat-header">
          <div class="partner-meta">
            <div class="partner-avatar">🎭</div>
            <div>
              <div class="partner-name-row">
                <h3 class="partner-name">{{ partnerTempName }}</h3>
                <span class="age-tag">Age: {{ partnerAge }}</span>
              </div>
              <span class="live-status" [class.connected]="connected && !partnerDisconnected">
                <span class="status-dot"></span>
                {{ partnerDisconnected ? 'Partner left chat' : (connected ? 'Live Connected' : 'Connecting...') }}
              </span>
            </div>
          </div>

          <div class="chat-actions">
            <button mat-flat-button class="next-btn" (click)="skipToNext()" title="Skip and match with someone else">
              <mat-icon>skip_next</mat-icon>
              <span>Next</span>
            </button>
            <button mat-stroked-button class="leave-btn" (click)="leaveChat()" title="End chat session">
              <mat-icon>exit_to_app</mat-icon>
              <span>Leave</span>
            </button>
          </div>
        </div>

        <!-- Disconnect / Admin Terminated Banner -->
        <div class="partner-left-banner admin-terminated-banner" *ngIf="partnerDisconnected && adminTerminated">
          <div class="banner-text-wrap">
            <mat-icon>gavel</mat-icon>
            <span><strong>Chat Ended due to Tech issue:</strong> Connect An administrator if this happening multiple times.</span>
          </div>
          <button mat-flat-button class="find-new-btn admin-new-btn" (click)="resetToLobby()">
            Back to Lobby
          </button>
        </div>

        <div class="partner-left-banner" *ngIf="partnerDisconnected && !adminTerminated">
          <mat-icon>person_off</mat-icon>
          <span>Partner has disconnected or left the chat.</span>
          <button mat-flat-button class="find-new-btn" (click)="skipToNext()">
            Match Someone New 🚀
          </button>
        </div>

        <!-- Messages Area -->
        <div class="messages-area" #scrollContainer>
          <div class="system-bubble welcome-bubble">
            <mat-icon>lock</mat-icon>
            <div>
              <strong>You're connected!</strong> Say hi to <strong>{{ partnerTempName }}</strong>. This chat is temporary and will be cleared when you leave.
            </div>
          </div>

          <div *ngFor="let msg of messages"
               class="msg-bubble"
               [class.mine]="msg.senderId === myUserId"
               [class.theirs]="msg.senderId !== myUserId">
            <div class="bubble-content">
              <span class="bubble-sender" *ngIf="msg.senderId !== myUserId">{{ msg.senderTempName }}</span>
              <p>{{ msg.content }}</p>
              <span class="msg-time">{{ formatTime(msg.sentAt) }}</span>
            </div>
          </div>
          <div #bottomAnchor></div>
        </div>

        <!-- Input Bar -->
        <div class="input-bar">
          <mat-form-field appearance="outline" class="msg-field">
            <input matInput [formControl]="messageCtrl"
                   placeholder="Type a message... (Press Enter)"
                   [disabled]="partnerDisconnected || !connected"
                   (keydown.enter)="sendMessage()">
          </mat-form-field>
          <button mat-fab class="send-btn" (click)="sendMessage()"
                  [disabled]="!messageCtrl.value?.trim() || !connected || partnerDisconnected">
            <mat-icon>send</mat-icon>
          </button>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .speed-chat-container {
      max-width: 760px;
      margin: 24px auto;
      padding: 0 16px 40px;
    }

    /* ── Lobby ───────────────────────────────────────────────────────── */
    .lobby-card {
      background: white;
      border-radius: 28px;
      padding: 40px 32px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
      text-align: center;
    }

    .lobby-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #fdf2f8;
      color: #db2777;
      padding: 6px 16px;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 700;
      letter-spacing: 0.4px;
      margin-bottom: 16px;
      border: 1px solid #fbcfe8;
    }

    .lobby-badge mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .lobby-title {
      font-size: 2.3rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
      margin: 0 0 12px;
    }

    .lobby-desc {
      color: #64748b;
      font-size: 1rem;
      line-height: 1.6;
      max-width: 580px;
      margin: 0 auto 28px;
    }

    .anon-preview-pill {
      display: inline-flex;
      align-items: center;
      gap: 14px;
      background: #f8fafc;
      border: 2px dashed #cbd5e1;
      border-radius: 20px;
      padding: 12px 24px;
      margin-bottom: 28px;
    }

    .anon-avatar {
      font-size: 2rem;
      line-height: 1;
    }

    .anon-info {
      text-align: left;
    }

    .anon-label {
      display: block;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #94a3b8;
    }

    .anon-name {
      font-size: 1.1rem;
      font-weight: 800;
      color: #1e293b;
    }

    .setup-form {
      max-width: 520px;
      margin: 0 auto;
    }

    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }

    .flex-field {
      flex: 1;
      margin-bottom: -1em;
    }

    .age-field {
      width: 120px;
      margin-bottom: -1em;
    }

    .guidelines-box {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 14px;
      padding: 12px 16px;
      font-size: 0.85rem;
      color: #166534;
      line-height: 1.4;
      text-align: left;
      margin-bottom: 24px;
    }

    .guidelines-box mat-icon {
      color: #16a34a;
      font-size: 20px;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .limit-warning-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 14px;
      padding: 12px 16px;
      color: #b91c1c;
      text-align: left;
      margin-bottom: 20px;
    }

    .limit-warning-banner mat-icon {
      color: #ef4444;
      font-size: 26px;
      width: 26px;
      height: 26px;
      flex-shrink: 0;
    }

    .limit-warning-text strong {
      display: block;
      font-size: 0.92rem;
      margin-bottom: 2px;
    }

    .limit-warning-text p {
      margin: 0;
      font-size: 0.85rem;
      color: #7f1d1d;
    }

    .start-btn {
      width: 100%;
      height: 52px !important;
      border-radius: 16px !important;
      background: linear-gradient(135deg, #ec4899, #8b5cf6) !important;
      color: white !important;
      font-size: 1.1rem !important;
      font-weight: 700 !important;
      letter-spacing: 0.3px;
      box-shadow: 0 8px 24px rgba(236, 72, 153, 0.3) !important;
    }

    /* ── Searching / Radar ────────────────────────────────────────────── */
    .searching-card {
      background: white;
      border-radius: 28px;
      padding: 60px 32px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
      text-align: center;
    }

    .radar-wrap {
      position: relative;
      width: 140px;
      height: 140px;
      margin: 0 auto 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .radar-core {
      position: relative;
      z-index: 2;
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, #ec4899, #8b5cf6);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 6px 20px rgba(236, 72, 153, 0.4);
    }

    .radar-core mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .radar-pulse {
      position: absolute;
      border-radius: 50%;
      border: 2px solid rgba(236, 72, 153, 0.4);
      animation: ripple 2.4s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
    }

    .ring-1 { width: 64px; height: 64px; animation-delay: 0s; }
    .ring-2 { width: 64px; height: 64px; animation-delay: 0.8s; }
    .ring-3 { width: 64px; height: 64px; animation-delay: 1.6s; }

    @keyframes ripple {
      0% {
        transform: scale(1);
        opacity: 0.8;
      }
      100% {
        transform: scale(2.6);
        opacity: 0;
      }
    }

    .search-title {
      font-size: 1.6rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 8px;
    }

    .search-sub {
      color: #64748b;
      font-size: 0.95rem;
      max-width: 440px;
      margin: 0 auto 32px;
      line-height: 1.5;
    }

    .cancel-search-btn {
      border-radius: 12px !important;
      border-color: #cbd5e1 !important;
      color: #64748b !important;
      font-weight: 600 !important;
    }

    /* ── Chat Interface ───────────────────────────────────────────────── */
    .chat-interface {
      background: white;
      border-radius: 28px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      height: 80vh;
      min-height: 540px;
    }

    .chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: #ffffff;
      border-bottom: 1px solid #f1f5f9;
      flex-shrink: 0;
    }

    .partner-meta {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .partner-avatar {
      font-size: 2rem;
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: #fdf2f8;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #fbcfe8;
    }

    .partner-name-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .partner-name {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }

    .age-tag {
      font-size: 0.75rem;
      font-weight: 700;
      background: #f1f5f9;
      color: #475569;
      padding: 2px 8px;
      border-radius: 9999px;
    }

    .live-status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.78rem;
      font-weight: 600;
      color: #94a3b8;
    }

    .live-status.connected {
      color: #059669;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
    }

    .chat-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .next-btn {
      background: #fdf2f8 !important;
      color: #db2777 !important;
      font-weight: 700 !important;
      border-radius: 12px !important;
    }

    .leave-btn {
      border-radius: 12px !important;
      border-color: #cbd5e1 !important;
      color: #64748b !important;
    }

    .partner-left-banner {
      background: #fef2f2;
      border-bottom: 1px solid #fecaca;
      color: #dc2626;
      padding: 10px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.9rem;
      font-weight: 600;
      flex-shrink: 0;
    }

    .find-new-btn {
      background: #dc2626 !important;
      color: white !important;
      border-radius: 8px !important;
      font-size: 0.82rem !important;
    }

    .admin-terminated-banner {
      background: #450a0a !important;
      border-bottom: 1px solid #7f1d1d !important;
      color: #fecaca !important;
    }

    .admin-terminated-banner .banner-text-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .admin-terminated-banner mat-icon {
      color: #f87171;
    }

    .admin-new-btn {
      background: #ef4444 !important;
      color: white !important;
    }

    /* Messages Area */
    .messages-area {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      background: #f8fafc;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .system-bubble {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 10px 14px;
      font-size: 0.85rem;
      color: #475569;
      line-height: 1.4;
      align-self: center;
      max-width: 85%;
    }

    .welcome-bubble mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #8b5cf6;
      flex-shrink: 0;
    }

    .msg-bubble {
      display: flex;
      flex-direction: column;
      max-width: 75%;
    }

    .msg-bubble.mine {
      align-self: flex-end;
    }

    .msg-bubble.theirs {
      align-self: flex-start;
    }

    .bubble-content {
      padding: 10px 16px;
      border-radius: 18px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.04);
      word-break: break-word;
    }

    .mine .bubble-content {
      background: linear-gradient(135deg, #ec4899, #8b5cf6);
      color: white;
      border-bottom-right-radius: 4px;
    }

    .theirs .bubble-content {
      background: white;
      color: #1e293b;
      border-bottom-left-radius: 4px;
      border: 1px solid #e2e8f0;
    }

    .bubble-sender {
      display: block;
      font-size: 0.72rem;
      font-weight: 700;
      color: #ec4899;
      margin-bottom: 2px;
    }

    .bubble-content p {
      margin: 0 0 4px;
      line-height: 1.4;
    }

    .msg-time {
      display: block;
      font-size: 0.65rem;
      opacity: 0.7;
      text-align: right;
    }

    /* Input Bar */
    .input-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 20px;
      background: white;
      border-top: 1px solid #f1f5f9;
      flex-shrink: 0;
    }

    .msg-field {
      flex: 1;
      margin-bottom: -1.25em;
    }

    .send-btn {
      background: linear-gradient(135deg, #ec4899, #8b5cf6) !important;
      color: white !important;
      width: 48px !important;
      height: 48px !important;
      flex-shrink: 0;
    }
  `]
})
export class SpeedChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('bottomAnchor') bottomAnchor!: ElementRef;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  state: 'IDLE' | 'SEARCHING' | 'CHATTING' = 'IDLE';

  tempName = 'KIITian';
  age = 18;

  sessionUuid: string | null = null;
  partnerTempName = '';
  partnerAge = 18;
  partnerDisconnected = false;
  adminTerminated = false;
  limitExceeded = false;
  limitExceededMessage = '';

  myUserId = 0;
  messages: any[] = [];
  messageCtrl = new FormControl('');
  connected = false;

  private stompClient!: Client;
  private shouldScroll = false;
  private userTopicSub: any = null;
  private sessionTopicSub: any = null;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private snack: MatSnackBar
  ) {}

  ngOnInit() {
    const user = this.auth.currentUserValue;
    this.myUserId = user?.userId ?? 0;
    this.initStomp();
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy() {
    this.leaveChat(false);
    if (this.stompClient) {
      this.stompClient.deactivate();
    }
  }

  private initStomp() {
    const token = this.auth.getToken();
    const wsUrl = environment.wsUrl.replace(/^http/, 'ws');
    this.stompClient = new Client({
      brokerURL: wsUrl,
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        this.connected = true;
        // Listen for match events for this user
        this.userTopicSub = this.stompClient.subscribe(`/topic/speed-chat/user/${this.myUserId}`, (frame) => {
          const payload = JSON.parse(frame.body);
          if (payload.status === 'MATCHED') {
            this.onMatchFound(payload);
          }
        });
      },
      onDisconnect: () => {
        this.connected = false;
      },
      reconnectDelay: 4000
    });
    this.stompClient.activate();
  }

  startMatching() {
    if (!this.tempName?.trim()) {
      this.tempName = 'KIITian';
    }
    if (this.age < 18) {
      this.age = 18;
    }

    this.state = 'SEARCHING';
    this.messages = [];
    this.partnerDisconnected = false;
    this.adminTerminated = false;

    this.api.speedChatFindMatch(this.tempName.trim(), this.age).subscribe({
      next: (res) => {
        if (res.status === 'LIMIT_EXCEEDED') {
          this.state = 'IDLE';
          this.limitExceeded = true;
          this.limitExceededMessage = res.message || 'Ur daily speed connect limit exceed';
          this.snack.open(this.limitExceededMessage, 'Close', { duration: 6000 });
        } else if (res.status === 'MATCHED') {
          this.limitExceeded = false;
          this.onMatchFound(res);
        } else {
          this.limitExceeded = false;
          // Waiting state -> wait for WebSocket notification
          this.state = 'SEARCHING';
        }
      },
      error: (err) => {
        this.state = 'IDLE';
        const msg = err.error?.message || 'Failed to enter matching queue. Please try again.';
        this.snack.open(msg, 'Dismiss', { duration: 3000 });
      }
    });
  }

  cancelSearch() {
    this.api.speedChatCancel().subscribe({
      next: () => {
        this.state = 'IDLE';
      }
    });
  }

  private onMatchFound(match: any) {
    this.sessionUuid = match.sessionUuid;
    this.partnerTempName = match.partnerTempName;
    this.partnerAge = match.partnerAge;
    this.partnerDisconnected = false;
    this.adminTerminated = false;
    this.state = 'CHATTING';
    this.messages = [];
    this.shouldScroll = true;

    // Subscribe to this session's broadcast channel
    if (this.sessionTopicSub) {
      this.sessionTopicSub.unsubscribe();
    }
    this.sessionTopicSub = this.stompClient.subscribe(`/topic/speed-chat/session/${this.sessionUuid}`, (frame) => {
      const payload = JSON.parse(frame.body);
      if (payload.event === 'PARTNER_LEFT') {
        this.partnerDisconnected = true;
        this.snack.open('Partner has left the conversation', 'OK', { duration: 3000 });
      } else if (payload.event === 'TERMINATED_BY_ADMIN') {
        this.partnerDisconnected = true;
        this.adminTerminated = true;
        this.snack.open('⚠️ This chat was terminated by the administrator.', 'OK', { duration: 6000 });
      } else if (payload.content) {
        // Message received
        this.messages.push(payload);
        this.shouldScroll = true;
      }
    });

    this.snack.open(`Matched with ${this.partnerTempName} 🎉 Say hello!`, 'OK', { duration: 3000 });
  }

  sendMessage() {
    const text = this.messageCtrl.value?.trim();
    if (!text || !this.sessionUuid || !this.connected || this.partnerDisconnected) return;

    // Send via REST endpoint (which persists and broadcasts)
    this.api.speedChatSendMessage(this.sessionUuid, text).subscribe({
      next: () => {
        this.messageCtrl.reset();
      },
      error: () => {
        this.snack.open('Message sending failed', 'Dismiss', { duration: 2500 });
      }
    });
  }

  skipToNext() {
    if (this.sessionUuid) {
      this.api.speedChatLeave(this.sessionUuid).subscribe();
    }
    if (this.sessionTopicSub) {
      this.sessionTopicSub.unsubscribe();
      this.sessionTopicSub = null;
    }
    this.sessionUuid = null;
    this.startMatching();
  }

  leaveChat(notifyServer: boolean = true) {
    if (this.sessionUuid && notifyServer) {
      this.api.speedChatLeave(this.sessionUuid).subscribe();
    }
    if (this.sessionTopicSub) {
      this.sessionTopicSub.unsubscribe();
      this.sessionTopicSub = null;
    }
    this.sessionUuid = null;
    this.state = 'IDLE';
    this.messages = [];
    this.partnerDisconnected = false;
    this.adminTerminated = false;
  }

  resetToLobby() {
    this.leaveChat(false);
    this.adminTerminated = false;
    this.partnerDisconnected = false;
    this.state = 'IDLE';
  }

  scrollToBottom() {
    try {
      this.bottomAnchor?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    } catch (_) {}
  }

  formatTime(isoStr: string): string {
    if (!isoStr) return '';
    return new Date(isoStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }
}
