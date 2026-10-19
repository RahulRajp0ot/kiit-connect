import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule
  ],
  template: `
    <mat-toolbar class="app-toolbar" *ngIf="auth.isLoggedIn()">
      <a routerLink="/discover" class="logo-link">
        <mat-icon class="logo-icon">favorite</mat-icon>
        <span class="logo-text">KIIT<span class="logo-accent">Love</span></span>
      </a>

      <span class="spacer"></span>

      <nav class="nav-links">
        <a mat-button routerLink="/discover" routerLinkActive="active-link">
          <mat-icon>explore</mat-icon>
          <span class="nav-label">Discover</span>
        </a>
        <a mat-button routerLink="/matches" routerLinkActive="active-link">
          <mat-icon>favorite_border</mat-icon>
          <span class="nav-label">Matches</span>
        </a>
        <a mat-button routerLink="/profile" routerLinkActive="active-link">
          <mat-icon>person</mat-icon>
          <span class="nav-label">Profile</span>
        </a>
        <a mat-button routerLink="/admin" routerLinkActive="active-link" *ngIf="auth.isAdmin()">
          <mat-icon>shield</mat-icon>
          <span class="nav-label">Admin</span>
        </a>
      </nav>

      <button mat-icon-button [matMenuTriggerFor]="userMenu" class="user-menu-btn">
        <mat-icon>account_circle</mat-icon>
      </button>
      <mat-menu #userMenu="matMenu">
        <button mat-menu-item routerLink="/profile">
          <mat-icon>person</mat-icon> My Profile
        </button>
        <button mat-menu-item (click)="auth.logout()">
          <mat-icon>logout</mat-icon> Sign Out
        </button>
      </mat-menu>
    </mat-toolbar>

    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .app-toolbar {
      background: white !important;
      color: #1a1a2e !important;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      padding: 0 16px;
      position: sticky;
      top: 0;
      z-index: 100;
      height: 64px;
    }
    .logo-link {
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      color: inherit;
    }
    .logo-icon { color: #ff6b9d; font-size: 28px; height: 28px; width: 28px; }
    .logo-text { font-size: 1.3rem; font-weight: 800; color: #1a1a2e; }
    .logo-accent { color: #ff6b9d; }
    .spacer { flex: 1; }
    .nav-links { display: flex; gap: 4px; }
    .nav-links a {
      display: flex;
      align-items: center;
      gap: 4px;
      border-radius: 10px;
      color: #666;
      font-weight: 500;
      font-size: 0.85rem;
    }
    .nav-links a.active-link { color: #ff6b9d; background: rgba(255,107,157,0.08); }
    .nav-label { font-size: 0.82rem; }
    .user-menu-btn { color: #666; margin-left: 8px; }
    .main-content { padding-top: 0; }
    @media (max-width: 600px) {
      .nav-label { display: none; }
      .nav-links a { min-width: 0; padding: 0 8px; }
    }
  `]
})
export class AppComponent {
  constructor(public auth: AuthService) {}
}
