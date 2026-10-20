import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../core/services/api.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-matches',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <div class="matches-container">
      <div class="matches-header">
        <h1>Matches</h1>
        <p class="subtitle">People who liked you back 💕</p>
      </div>

      <div class="loading-state" *ngIf="loading">
        <mat-spinner diameter="48"></mat-spinner>
      </div>

      <div class="empty-state" *ngIf="!loading && matches.length === 0">
        <div class="empty-emoji">💔</div>
        <h2>No matches yet</h2>
        <p>Keep swiping — your match is out there!</p>
        <button mat-raised-button color="primary" routerLink="/discover">Discover People</button>
      </div>

      <div class="matches-grid" *ngIf="!loading && matches.length > 0">
        <div class="match-card" *ngFor="let match of matches" (click)="openChat(match)">
          <div class="match-photo-wrapper">
            <img [src]="resolvePhotoUrl(match.matchedUserPhoto) || getAvatarUrl(match.matchedUserName)"
              [alt]="match.matchedUserName" class="match-photo">
            <div class="online-dot"></div>
          </div>
          <div class="match-info">
            <h3>{{match.matchedUserName}}</h3>
            <p class="match-date">Matched {{formatDate(match.matchedAt)}}</p>
          </div>
          <div class="match-actions" (click)="$event.stopPropagation()">
            <button mat-icon-button class="chat-btn" (click)="openChat(match)" title="Open Chat">
              <mat-icon>chat_bubble</mat-icon>
            </button>
            <button mat-icon-button class="unmatch-card-btn" (click)="unmatch(match)" title="Unmatch student">
              <mat-icon>heart_broken</mat-icon>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .matches-container {
      max-width: 700px;
      margin: 0 auto;
      padding: 24px 16px;
    }
    .matches-header { text-align: center; margin-bottom: 32px; }
    .matches-header h1 {
      font-size: 2rem;
      font-weight: 700;
      background: linear-gradient(135deg, #ff6b9d, #c44dff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 0;
    }
    .subtitle { color: #666; margin: 8px 0 0; }
    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 80px 0;
      text-align: center;
    }
    .empty-emoji { font-size: 4rem; }
    .empty-state h2 { margin: 0; color: #333; }
    .empty-state p { color: #999; margin: 0; }
    .matches-grid { display: flex; flex-direction: column; gap: 12px; }
    .match-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .match-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(255,107,157,0.15);
    }
    .match-photo-wrapper {
      position: relative;
      flex-shrink: 0;
    }
    .match-photo {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid transparent;
      background: linear-gradient(white, white) padding-box,
                  linear-gradient(135deg, #ff6b9d, #c44dff) border-box;
    }
    .online-dot {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 14px;
      height: 14px;
      background: #4caf50;
      border-radius: 50%;
      border: 2px solid white;
    }
    .match-info { flex: 1; }
    .match-info h3 { margin: 0 0 4px; font-size: 1rem; font-weight: 600; color: #222; }
    .match-date { margin: 0; font-size: 0.8rem; color: #999; }
    .chat-btn {
      background: linear-gradient(135deg, #ff6b9d, #c44dff) !important;
      color: white !important;
    }
    .match-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .unmatch-card-btn {
      color: #94a3b8 !important;
      transition: color 0.2s, background 0.2s;
    }
    .unmatch-card-btn:hover {
      color: #ef4444 !important;
      background: #fee2e2 !important;
    }
    @media (max-width: 600px) {
      .matches-container {
        padding: 16px 12px 20px;
      }
      .matches-header {
        margin-bottom: 20px;
      }
      .matches-header h1 {
        font-size: 1.6rem;
      }
      .match-card {
        padding: 12px 14px;
        gap: 12px;
        border-radius: 14px;
      }
      .match-photo {
        width: 52px;
        height: 52px;
      }
      .match-info h3 {
        font-size: 0.95rem;
      }
      .match-date {
        font-size: 0.75rem;
      }
    }
  `]
})
export class MatchesComponent implements OnInit {
  matches: any[] = [];
  loading = true;

  constructor(private api: ApiService, private router: Router, private snack: MatSnackBar) {}

  ngOnInit() {
    this.api.getMatches().subscribe({
      next: (data: any[]) => { this.matches = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  openChat(match: any) {
    this.router.navigate(['/chat', match.matchId]);
  }

  unmatch(match: any) {
    if (!confirm(`Are you sure you want to unmatch with ${match.matchedUserName}? You won't be able to chat with each other anymore.`)) {
      return;
    }
    this.api.unmatch(match.matchId).subscribe({
      next: () => {
        this.matches = this.matches.filter(m => m.matchId !== match.matchId);
        this.snack.open(`Unmatched with ${match.matchedUserName}.`, 'OK', { duration: 3000 });
      },
      error: () => {
        this.snack.open('Failed to unmatch. Please try again.', 'Dismiss', { duration: 3000 });
      }
    });
  }

  getAvatarUrl(name: string) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ff6b9d&color=fff&size=128`;
  }

  resolvePhotoUrl(url?: string): string {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;
    const backendOrigin = environment.apiUrl.replace(/\/api\/?$/, '');
    if (url.includes('localhost:') || url.includes('127.0.0.1:')) {
      if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
        return url.replace(/^http:\/\/(localhost|127\.0\.0\.1):\d+/, backendOrigin);
      }
    }
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${backendOrigin}${cleanPath}`;
  }

  formatDate(dateStr: string) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
}
