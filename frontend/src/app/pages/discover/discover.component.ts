import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { ApiService } from '../../core/services/api.service';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatChipsModule
  ],
  animations: [
    trigger('cardAnim', [
      state('center', style({ transform: 'translateX(0) rotate(0deg)', opacity: 1 })),
      state('liked', style({ transform: 'translateX(140%) rotate(20deg)', opacity: 0 })),
      state('disliked', style({ transform: 'translateX(-140%) rotate(-20deg)', opacity: 0 })),
      transition('center => liked', animate('320ms cubic-bezier(0.4, 0, 0.2, 1)')),
      transition('center => disliked', animate('320ms cubic-bezier(0.4, 0, 0.2, 1)')),
    ])
  ],
  template: `
    <div class="discover-page">
      <div class="discover-container">
        <!-- Header -->
        <div class="discover-header">
          <h1 class="header-title">Discover</h1>
          <p class="header-subtitle">Find your match on KIIT campus 💕</p>
        </div>

        <!-- Loading State -->
        <div class="state-card" *ngIf="loading">
          <mat-spinner diameter="44" color="accent"></mat-spinner>
          <p class="state-text">Finding students near you...</p>
        </div>

        <!-- Empty State -->
        <div class="state-card empty-card" *ngIf="!loading && (!users || users.length === 0 || currentIndex >= users.length)">
          <div class="empty-icon-wrap">
            <mat-icon class="huge-icon">favorite_border</mat-icon>
          </div>
          <h2 class="empty-title">You've seen everyone!</h2>
          <p class="empty-desc">Check back later when more KIIT students sign up.</p>
          <button mat-raised-button color="primary" class="reload-btn" (click)="loadUsers()">
            <mat-icon>refresh</mat-icon>
            <span>Refresh Feed</span>
          </button>
        </div>

        <!-- Swipe Card Stack -->
        <div class="card-area" *ngIf="!loading && users && users.length > 0 && currentIndex < users.length">
          <div class="card-wrapper" [@cardAnim]="cardState">
            <div class="tinder-card">
              <!-- Profile Photo & Gradient Overlay -->
              <div class="photo-wrapper">
                <img [src]="getPhoto(currentUser)"
                     [alt]="currentUser?.name"
                     class="card-img"
                     (error)="onImageError($event, currentUser?.name)">
                
                <div class="gradient-scrim"></div>

                <!-- Text Overlay on Photo -->
                <div class="photo-content">
                  <div class="name-row">
                    <h2 class="user-name">{{ currentUser?.name }}</h2>
                    <span class="user-age" *ngIf="getAge(currentUser?.dateOfBirth || currentUser?.dob) as age">
                      {{ age }}
                    </span>
                  </div>
                  <div class="campus-pill">
                    <mat-icon class="pin-icon">school</mat-icon>
                    <span>{{ currentUser?.college || 'KIIT University' }}</span>
                  </div>
                </div>
              </div>

              <!-- Card Body Info -->
              <div class="card-details">
                <!-- Bio -->
                <p class="bio-text" *ngIf="currentUser?.bio">{{ currentUser.bio }}</p>
                <p class="bio-text empty" *ngIf="!currentUser?.bio">No bio yet — say hi!</p>

                <!-- Interests -->
                <div class="interests-tags" *ngIf="currentUser?.interests?.length">
                  <span class="interest-pill" *ngFor="let interest of currentUser.interests">
                    {{ interest }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Action Buttons -->
          <div class="controls-row">
            <button class="round-btn pass-btn" (click)="swipe('dislike')" [disabled]="swiping" title="Pass">
              <mat-icon class="control-icon">close</mat-icon>
            </button>

            <div class="deck-counter">
              <span>{{ currentIndex + 1 }}</span> / {{ users.length }}
            </div>

            <button class="round-btn like-btn" (click)="swipe('like')" [disabled]="swiping" title="Like">
              <mat-icon class="control-icon">favorite</mat-icon>
            </button>
          </div>
        </div>

        <!-- Mutual Match Celebration Modal -->
        <div class="match-modal" *ngIf="showMatch">
          <div class="match-backdrop" (click)="showMatch = false"></div>
          <div class="match-dialog">
            <div class="match-sparkle">💖</div>
            <h2 class="match-heading">It's a Match!</h2>
            <p class="match-subtext">You and <strong>{{ matchedName }}</strong> liked each other</p>
            <div class="match-actions">
              <button mat-raised-button color="primary" class="match-chat-btn" routerLink="/matches">
                <mat-icon>chat</mat-icon>
                <span>Send a Message</span>
              </button>
              <button mat-button class="match-keep-btn" (click)="showMatch = false">
                Keep Swiping
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .discover-page {
      padding: 24px 16px 40px;
      display: flex;
      justify-content: center;
      background: #f8fafc;
      min-height: calc(100vh - 68px);
    }

    .discover-container {
      width: 100%;
      max-width: 440px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    /* Header */
    .discover-header {
      text-align: center;
      margin-bottom: 20px;
    }

    .header-title {
      font-size: 2.2rem;
      font-weight: 800;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #ff4b72 0%, #c026d3 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 0;
    }

    .header-subtitle {
      color: #64748b;
      font-size: 0.95rem;
      font-weight: 500;
      margin-top: 4px;
    }

    /* State Cards */
    .state-card {
      background: white;
      border-radius: 24px;
      padding: 48px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
      border: 1px solid #f1f5f9;
      width: 100%;
      margin-top: 30px;
    }

    .state-text {
      color: #64748b;
      font-weight: 500;
      margin-top: 16px;
    }

    .empty-icon-wrap {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #fdf2f8;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }

    .huge-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: #f43f5e;
    }

    .empty-title {
      font-size: 1.4rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 8px;
    }

    .empty-desc {
      color: #64748b;
      font-size: 0.92rem;
      max-width: 280px;
      margin-bottom: 24px;
      line-height: 1.4;
    }

    .reload-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 0 24px !important;
      height: 46px !important;
    }

    /* Card Area */
    .card-area {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .card-wrapper {
      width: 100%;
      perspective: 1000px;
    }

    .tinder-card {
      width: 100%;
      background: white;
      border-radius: 28px;
      overflow: hidden;
      box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04);
      transition: box-shadow 0.3s ease;
    }

    /* Photo section */
    .photo-wrapper {
      position: relative;
      width: 100%;
      height: 420px;
      background: #e2e8f0;
      overflow: hidden;
    }

    .card-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .gradient-scrim {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(15, 23, 42, 0.88) 0%, rgba(15, 23, 42, 0.3) 50%, transparent 100%);
    }

    .photo-content {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 24px 20px;
      color: white;
    }

    .name-row {
      display: flex;
      align-items: baseline;
      gap: 10px;
      margin-bottom: 6px;
    }

    .user-name {
      font-size: 1.75rem;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    }

    .user-age {
      font-size: 1.4rem;
      font-weight: 600;
      opacity: 0.9;
    }

    .campus-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(8px);
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 0.82rem;
      font-weight: 500;
      color: #f8fafc;
    }

    .pin-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    /* Details Section */
    .card-details {
      padding: 20px;
      background: white;
    }

    .bio-text {
      font-size: 0.95rem;
      line-height: 1.5;
      color: #334155;
      margin: 0 0 16px 0;
    }

    .bio-text.empty {
      color: #94a3b8;
      font-style: italic;
    }

    .interests-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .interest-pill {
      background: #fdf2f8;
      color: #db2777;
      border: 1px solid #fbcfe8;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.2px;
    }

    /* Controls */
    .controls-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 36px;
      margin-top: 24px;
      width: 100%;
    }

    .round-btn {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      outline: none;
    }

    .pass-btn {
      background: white;
      color: #ef4444;
      box-shadow: 0 8px 25px rgba(239, 68, 68, 0.2), 0 2px 4px rgba(0, 0, 0, 0.04);
      border: 2px solid #fee2e2;
    }

    .pass-btn:hover:not(:disabled) {
      transform: scale(1.12);
      background: #ef4444;
      color: white;
      box-shadow: 0 12px 30px rgba(239, 68, 68, 0.35);
    }

    .like-btn {
      background: linear-gradient(135deg, #ff4b72, #c026d3);
      color: white;
      box-shadow: 0 8px 25px rgba(255, 75, 114, 0.4);
    }

    .like-btn:hover:not(:disabled) {
      transform: scale(1.12);
      box-shadow: 0 12px 35px rgba(255, 75, 114, 0.55);
    }

    .round-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none !important;
    }

    .control-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      line-height: 32px;
    }

    .deck-counter {
      font-size: 0.9rem;
      font-weight: 700;
      color: #94a3b8;
    }

    .deck-counter span {
      color: #0f172a;
    }

    /* Match Modal */
    .match-modal {
      position: fixed;
      inset: 0;
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .match-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(10px);
    }

    .match-dialog {
      position: relative;
      background: white;
      border-radius: 32px;
      padding: 40px 28px;
      max-width: 360px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
      animation: popIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .match-sparkle {
      font-size: 4rem;
      line-height: 1;
      margin-bottom: 12px;
    }

    .match-heading {
      font-size: 2rem;
      font-weight: 800;
      background: linear-gradient(135deg, #ff4b72, #c026d3);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 0 0 8px 0;
    }

    .match-subtext {
      color: #64748b;
      font-size: 0.95rem;
      margin-bottom: 28px;
    }

    .match-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .match-chat-btn {
      height: 48px !important;
      border-radius: 14px !important;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .match-keep-btn {
      color: #64748b !important;
      font-weight: 600 !important;
    }

    @keyframes popIn {
      from { opacity: 0; transform: scale(0.85); }
      to   { opacity: 1; transform: scale(1); }
    }
  `]
})
export class DiscoverComponent implements OnInit {
  users: any[] = [];
  currentIndex = 0;
  loading = true;
  swiping = false;
  cardState: 'center' | 'liked' | 'disliked' = 'center';
  showMatch = false;
  matchedName = '';

  get currentUser(): any {
    return this.users && this.users[this.currentIndex] ? this.users[this.currentIndex] : null;
  }

  constructor(private api: ApiService, private snack: MatSnackBar) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.api.getDiscoverUsers().subscribe({
      next: (users: any[]) => {
        this.users = users || [];
        this.currentIndex = 0;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getPhoto(user: any): string {
    if (!user) return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600';
    const photos = user.photoUrls || user.photos;
    if (photos && photos.length > 0 && photos[0]) {
      return photos[0];
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=ff4b72&color=fff&size=500`;
  }

  onImageError(event: any, name?: string) {
    event.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'KIIT Student')}&background=ff4b72&color=fff&size=500`;
  }

  getAge(dob: string): number | null {
    if (!dob) return null;
    const diff = Date.now() - new Date(dob).getTime();
    const age = Math.floor(diff / (365.25 * 24 * 3600 * 1000));
    return isNaN(age) || age < 10 || age > 90 ? null : age;
  }

  swipe(action: 'like' | 'dislike') {
    if (this.swiping || !this.currentUser) return;
    this.swiping = true;
    this.cardState = action === 'like' ? 'liked' : 'disliked';

    const userId = this.currentUser.id;
    const name = this.currentUser.name;

    setTimeout(() => {
      if (action === 'like') {
        this.api.likeUser(userId).subscribe({
          next: (res: any) => {
            if (res?.matched) {
              this.matchedName = name;
              this.showMatch = true;
            }
          }
        });
      } else {
        this.api.dislikeUser(userId).subscribe();
      }

      this.currentIndex++;
      this.cardState = 'center';
      this.swiping = false;
    }, 320);
  }
}
