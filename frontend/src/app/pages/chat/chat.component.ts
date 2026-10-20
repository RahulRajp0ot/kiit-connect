import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
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
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, RouterLink, MatCardModule, MatButtonModule,
    MatIconModule, MatInputModule, MatFormFieldModule, MatProgressSpinnerModule, MatSnackBarModule
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

      <!-- Messages Area -->
      <div class="messages-area" #scrollContainer>
        <div class="loading-msgs" *ngIf="loadingHistory">
          <mat-spinner diameter="32"></mat-spinner>
        </div>

        <div class="day-start" *ngIf="messages.length === 0 && !loadingHistory">
          <div class="match-wave-icon">👋</div>
          <h3>You matched with {{ partnerName || 'each other' }}!</h3>
          <span>Break the ice! Say hi, share a photo, and spark a connection 💕</span>
        </div>

        <div *ngFor="let msg of messages"
          class="msg-bubble-row"
          [class.mine]="msg.senderId === myId"
          [class.theirs]="msg.senderId !== myId">
          
          <!-- Delete button for my active messages -->
          <button mat-icon-button class="del-action-btn"
                  *ngIf="msg.senderId === myId && !msg.deletedForUsers"
                  (click)="deleteForEveryone(msg)"
                  title="Delete for everyone">
            <mat-icon>delete_outline</mat-icon>
          </button>

          <div class="bubble-content" [class.deleted-bubble]="msg.deletedForUsers">
            <!-- Deleted Message State -->
            <div *ngIf="msg.deletedForUsers" class="deleted-msg-view">
              <mat-icon class="deleted-icon">block</mat-icon>
              <em>This message was deleted</em>
            </div>

            <!-- Active Message State -->
            <ng-container *ngIf="!msg.deletedForUsers">
              <!-- Attached Photo -->
              <div class="chat-photo-wrap" *ngIf="msg.imageUrl" (click)="openImagePreview(msg.imageUrl)">
                <img [src]="msg.imageUrl" alt="Shared photo" class="chat-photo-img">
              </div>

              <!-- Text Content -->
              <p *ngIf="msg.content">{{msg.content}}</p>
            </ng-container>

            <span class="msg-time">{{formatTime(msg.sentAt)}}</span>
          </div>
        </div>
        <div #bottomAnchor></div>
      </div>

      <!-- Selected Photo Preview Tray -->
      <div class="photo-preview-tray" *ngIf="selectedPhoto">
        <div class="thumb-box">
          <img [src]="photoPreviewUrl" alt="Preview" class="thumb-img">
          <button mat-icon-button class="close-thumb-btn" (click)="removeSelectedPhoto()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <span class="tray-label">Attached Photo (Add optional caption below)</span>
      </div>

      <!-- Input Bar -->
      <div class="input-bar">
        <!-- Hidden Photo Input -->
        <input type="file" #fileInput (change)="onFileSelected($event)" accept="image/*" style="display: none;">
        
        <button mat-icon-button class="attach-btn" (click)="fileInput.click()" title="Send Photo" [disabled]="uploadingPhoto">
          <mat-icon *ngIf="!uploadingPhoto">add_photo_alternate</mat-icon>
          <mat-spinner diameter="20" *ngIf="uploadingPhoto"></mat-spinner>
        </button>

        <mat-form-field appearance="outline" class="msg-field">
          <input matInput [formControl]="messageCtrl"
            [placeholder]="selectedPhoto ? 'Add a caption...' : 'Type a message...'"
            (keydown.enter)="sendMessage()">
        </mat-form-field>

        <button mat-fab class="send-btn" (click)="sendMessage()"
          [disabled]="(!messageCtrl.value?.trim() && !selectedPhoto) || sending || uploadingPhoto">
          <mat-icon *ngIf="!sending">send</mat-icon>
          <mat-spinner diameter="20" *ngIf="sending" color="accent"></mat-spinner>
        </button>
      </div>

      <!-- Lightbox Fullscreen Image Preview -->
      <div class="lightbox-backdrop" *ngIf="lightboxUrl" (click)="lightboxUrl = null">
        <div class="lightbox-content" (click)="$event.stopPropagation()">
          <img [src]="lightboxUrl" alt="Full photo" class="lightbox-img">
          <button mat-icon-button class="lightbox-close" (click)="lightboxUrl = null">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-page {
      height: calc(100vh - 64px);
      display: flex;
      flex-direction: column;
      max-width: 720px;
      margin: 0 auto;
      background: #f8fafc;
      position: relative;
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
      z-index: 10;
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
      gap: 12px;
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
    .msg-bubble-row {
      display: flex;
      align-items: center;
      width: 100%;
      gap: 6px;
    }
    .msg-bubble-row.mine {
      justify-content: flex-end;
    }
    .msg-bubble-row.theirs {
      justify-content: flex-start;
    }
    .del-action-btn {
      width: 28px !important;
      height: 28px !important;
      line-height: 28px !important;
      color: #94a3b8 !important;
      opacity: 0.6;
      transition: all 0.2s;
    }
    .del-action-btn:hover {
      color: #ef4444 !important;
      opacity: 1;
      transform: scale(1.1);
    }
    .del-action-btn mat-icon {
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
    }
    .bubble-content {
      max-width: 78%;
      padding: 10px 14px;
      border-radius: 18px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.04);
      position: relative;
    }
    .msg-bubble-row.mine .bubble-content {
      background: linear-gradient(135deg, #ff4b72, #ec4899);
      color: white;
      border-bottom-right-radius: 4px;
    }
    .msg-bubble-row.theirs .bubble-content {
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
    .chat-photo-wrap {
      cursor: pointer;
      margin-bottom: 6px;
      border-radius: 12px;
      overflow: hidden;
      max-width: 260px;
    }
    .chat-photo-img {
      width: 100%;
      max-height: 240px;
      object-fit: cover;
      display: block;
      border-radius: 12px;
      transition: transform 0.2s;
    }
    .chat-photo-img:hover {
      transform: scale(1.02);
    }
    .deleted-bubble {
      background: #f1f5f9 !important;
      color: #64748b !important;
      border: 1px dashed #cbd5e1 !important;
    }
    .deleted-msg-view {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.88rem;
    }
    .deleted-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #94a3b8;
    }
    .msg-time {
      font-size: 0.68rem;
      display: block;
      margin-top: 4px;
      text-align: right;
      opacity: 0.75;
    }
    .photo-preview-tray {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px;
      background: #fff1f2;
      border-top: 1px solid #ffe4e6;
    }
    .thumb-box {
      position: relative;
      width: 48px;
      height: 48px;
      border-radius: 8px;
      overflow: hidden;
      border: 2px solid #ff4b72;
    }
    .thumb-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .close-thumb-btn {
      position: absolute;
      top: -6px;
      right: -6px;
      width: 22px !important;
      height: 22px !important;
      background: rgba(0,0,0,0.7) !important;
      color: white !important;
    }
    .close-thumb-btn mat-icon {
      font-size: 14px !important;
      width: 14px !important;
      height: 14px !important;
    }
    .tray-label {
      font-size: 0.82rem;
      color: #be123c;
      font-weight: 600;
    }
    .input-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: white;
      box-shadow: 0 -2px 12px rgba(0,0,0,0.05);
      flex-shrink: 0;
      border-top: 1px solid #f1f5f9;
    }
    .attach-btn {
      color: #ff4b72 !important;
      flex-shrink: 0;
    }
    .msg-field { flex: 1; margin-bottom: -1.25em; }
    .send-btn {
      background: linear-gradient(135deg, #ff4b72, #ec4899) !important;
      color: white !important;
      flex-shrink: 0;
      width: 48px !important;
      height: 48px !important;
    }
    /* Lightbox Modal */
    .lightbox-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }
    .lightbox-content {
      position: relative;
      max-width: 90vw;
      max-height: 90vh;
    }
    .lightbox-img {
      max-width: 100%;
      max-height: 85vh;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    }
    .lightbox-close {
      position: absolute;
      top: -16px;
      right: -16px;
      background: white !important;
      color: #0f172a !important;
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
  @ViewChild('fileInput') fileInput!: ElementRef;

  matchId!: number;
  messages: any[] = [];
  messageCtrl = new FormControl('');
  loadingHistory = true;
  connected = false;
  sending = false;
  uploadingPhoto = false;
  partnerName = '';
  partnerPhoto = '';
  myId!: number;

  selectedPhoto: File | null = null;
  photoPreviewUrl: string | null = null;
  lightboxUrl: string | null = null;

  private stompClient?: Client;
  private shouldScroll = false;
  private pollInterval?: any;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private auth: AuthService,
    private snack: MatSnackBar
  ) {}

  ngOnInit() {
    this.matchId = +this.route.snapshot.paramMap.get('matchId')!;
    const user = this.auth.currentUserValue;
    this.myId = user?.userId ?? 0;

    this.loadHistory();
    this.loadPartnerInfo();
    this.connectWebSocket();

    // Polling fallback every 3 seconds to guarantee 100% real-time delivery
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
          const idx = this.messages.findIndex(existing => existing.id === m.id);
          if (idx === -1) {
            this.messages.push(m);
            hasNew = true;
          } else {
            // Update deleted status if changed
            if (this.messages[idx].deletedForUsers !== m.deletedForUsers) {
              this.messages[idx] = m;
            }
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
              if (!msg) return;

              const idx = this.messages.findIndex(m => m.id === msg.id);
              if (idx === -1) {
                this.messages.push(msg);
                this.shouldScroll = true;
              } else {
                // Real-time update (e.g. Delete for Everyone triggered)
                this.messages[idx] = msg;
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

  onFileSelected(event: any) {
    const file = event.target?.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.snack.open('Please select an image file (PNG, JPG, etc.)', 'OK', { duration: 3000 });
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      this.snack.open('Image size exceeds 15MB limit', 'OK', { duration: 3000 });
      return;
    }

    this.selectedPhoto = file;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.photoPreviewUrl = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  removeSelectedPhoto() {
    this.selectedPhoto = null;
    this.photoPreviewUrl = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  sendMessage() {
    const content = this.messageCtrl.value?.trim();
    if ((!content && !this.selectedPhoto) || this.sending || this.uploadingPhoto) return;

    // Case 1: Photo upload with optional caption
    if (this.selectedPhoto) {
      this.uploadingPhoto = true;
      const fileToSend = this.selectedPhoto;
      this.removeSelectedPhoto();
      this.messageCtrl.reset();

      this.api.sendChatPhoto(this.matchId, fileToSend, content || undefined).subscribe({
        next: (savedMsg: any) => {
          this.uploadingPhoto = false;
          if (savedMsg && !this.messages.some(m => m.id === savedMsg.id)) {
            this.messages.push(savedMsg);
            this.shouldScroll = true;
          }
        },
        error: () => {
          this.uploadingPhoto = false;
          this.snack.open('Failed to send photo. Please try again.', 'OK', { duration: 3000 });
        }
      });
      return;
    }

    // Case 2: Regular text message
    this.sending = true;
    this.messageCtrl.reset();

    this.api.sendChatMessage(this.matchId, content!).subscribe({
      next: (savedMsg: any) => {
        this.sending = false;
        if (savedMsg && !this.messages.some(m => m.id === savedMsg.id)) {
          this.messages.push(savedMsg);
          this.shouldScroll = true;
        }
      },
      error: () => {
        this.sending = false;
        this.snack.open('Failed to send message.', 'OK', { duration: 2500 });
      }
    });
  }

  deleteForEveryone(msg: any) {
    if (!confirm('Delete this message for everyone in this chat?')) return;

    this.api.deleteChatMessageForEveryone(this.matchId, msg.id).subscribe({
      next: (updatedMsg: any) => {
        const idx = this.messages.findIndex(m => m.id === msg.id);
        if (idx !== -1) {
          this.messages[idx] = updatedMsg;
        }
        this.snack.open('Message deleted for everyone', 'OK', { duration: 2500 });
      },
      error: () => {
        this.snack.open('Could not delete message. Please try again.', 'OK', { duration: 3000 });
      }
    });
  }

  openImagePreview(url: string) {
    this.lightboxUrl = url;
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
