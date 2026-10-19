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
      state('liked', style({ transform: 'translateX(150%) rotate(20deg)', opacity: 0 })),
      state('disliked', style({ transform: 'translateX(-150%) rotate(-20deg)', opacity: 0 })),
      transition('center => liked', animate('350ms ease-out')),
      transition('center => disliked', animate('350ms ease-out')),
    ])
  ],
  template: `
    <div class="discover-container">
      <div class="discover-header">
        <h1>Discover</h1>
        <p class="subtitle">Swipe right to like, left to pass 💘</p>
      </div>

      <!-- Loading -->
      <div class="loading-state" *ngIf="loading">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Finding people for you...</p>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!loading && users.length === 0">
        <div class="empty-icon">🎉</div>
        <h2>You've seen everyone!</h2>
        <p>Check back later for new profiles</p>
        <button mat-raised-button color="primary" (click)="loadUsers()">Refresh</button>
      </div>

      <!-- Swipe Card Stack -->
      <div class="card-stack" *ngIf="!loading && users.length > 0">
        <div class="card-wrapper" [@cardAnim]="cardState">
          <div class="swipe-card">
            <div class="card-photo-container">
              <img [src]="currentUser?.photos?.[0] || 'assets/default-avatar.png'"
                [alt]="currentUser?.name" class="card-photo"
                onerror="this.src='https://ui-avatars.com/api/?name=' + currentUser?.name + '&background=ff6b9d&color=fff&size=400'">
              <div class="card-gradient"></div>
              <div class="card-info-overlay">
                <h2>{{currentUser?.name}}, {{getAge(currentUser?.dob)}}</h2>
                <p class="department" *ngIf="currentUser?.department">{{currentUser.department}}</p>
              </div>
            </div>
            <div class="card-body">
              <p class="bio" *ngIf="currentUser?.bio">{{currentUser.bio}}</p>
              <p class="bio empty" *ngIf="!currentUser?.bio">No bio yet</p>
              <div class="interests" *ngIf="currentUser?.interests?.length">
                <span class="interest-tag" *ngFor="let i of currentUser?.interests?.slice(0,5)">{{i}}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Match Toast -->
        <div class="match-toast" *ngIf="showMatch">
          <div class="match-content">
            <div class="match-icon">💕</div>
            <h3>It's a Match!</h3>
            <p>You and {{matchedName}} liked each other</p>
            <button mat-raised-button (click)="showMatch = false">Continue Swiping</button>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button mat-fab class="action-btn dislike-btn" (click)="swipe('dislike')" [disabled]="swiping">
            <mat-icon>close</mat-icon>
          </button>
          <div class="like-hint">{{currentIndex + 1}} / {{users.length}}</div>
          <button mat-fab class="action-btn like-btn" (click)="swipe('like')" [disabled]="swiping">
            <mat-icon>favorite</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .discover-container {
      max-width: 480px;
      margin: 0 auto;
      padding: 24px 16px;
      min-height: calc(100vh - 80px);
      display: flex;
      flex-direction: column;
    }
    .discover-header { text-align: center; margin-bottom: 24px; }
    .discover-header h1 {
      font-size: 2rem;
      font-weight: 700;
      background: linear-gradient(135deg, #ff6b9d, #c44dff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 0;
    }
    .subtitle { color: #666; margin: 6px 0 0; }
    .loading-state, .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      text-align: center;
    }
    .empty-icon { font-size: 4rem; }
    .empty-state h2 { margin: 0; color: #333; }
    .empty-state p { color: #999; margin: 0; }
    .card-stack { flex: 1; display: flex; flex-direction: column; align-items: center; }
    .card-wrapper { width: 100%; max-width: 380px; }
    .swipe-card {
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 8px 40px rgba(0,0,0,0.15);
      background: white;
    }
    .card-photo-container { position: relative; height: 420px; overflow: hidden; }
    .card-photo { width: 100%; height: 100%; object-fit: cover; }
    .card-gradient {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 60%;
      background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
    }
    .card-info-overlay {
      position: absolute;
      bottom: 16px;
      left: 16px;
      color: white;
    }
    .card-info-overlay h2 { margin: 0; font-size: 1.6rem; font-weight: 700; }
    .department { margin: 4px 0 0; opacity: 0.85; font-size: 0.9rem; }
    .card-body { padding: 16px; }
    .bio { color: #555; font-size: 0.95rem; line-height: 1.5; margin: 0 0 12px; }
    .bio.empty { color: #bbb; font-style: italic; }
    .interests { display: flex; flex-wrap: wrap; gap: 6px; }
    .interest-tag {
      background: linear-gradient(135deg, rgba(255,107,157,0.1), rgba(196,77,255,0.1));
      border: 1px solid rgba(255,107,157,0.3);
      border-radius: 16px;
      padding: 3px 10px;
      font-size: 0.8rem;
      color: #c44dff;
    }
    .action-buttons {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 32px;
      margin-top: 24px;
    }
    .action-btn { transition: transform 0.15s; }
    .action-btn:hover { transform: scale(1.1); }
    .dislike-btn { background: white !important; color: #ff4458 !important; box-shadow: 0 4px 20px rgba(255,68,88,0.3) !important; }
    .like-btn { background: linear-gradient(135deg, #ff6b9d, #c44dff) !important; color: white !important; box-shadow: 0 4px 20px rgba(255,107,157,0.4) !important; }
    .like-hint { color: #999; font-size: 0.85rem; font-weight: 500; }
    .match-toast {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.3s ease;
    }
    .match-content {
      background: white;
      border-radius: 24px;
      padding: 48px 32px;
      text-align: center;
      max-width: 320px;
    }
    .match-icon { font-size: 4rem; }
    .match-content h3 {
      font-size: 2rem;
      font-weight: 700;
      background: linear-gradient(135deg, #ff6b9d, #c44dff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 12px 0 8px;
    }
    .match-content p { color: #666; margin: 0 0 24px; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
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

  get currentUser() { return this.users[this.currentIndex]; }

  constructor(private api: ApiService, private snack: MatSnackBar) {}

  ngOnInit() { this.loadUsers(); }

  loadUsers() {
    this.loading = true;
    this.api.getDiscoverUsers().subscribe({
      next: (users: any[]) => {
        this.users = users;
        this.currentIndex = 0;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  getAge(dob: string): number {
    if (!dob) return 0;
    return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
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
    }, 380);
  }
}
