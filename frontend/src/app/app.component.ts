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
    <header class="navbar-wrapper" *ngIf="auth.isLoggedIn()">
      <div class="navbar-container">
        <!-- Logo -->
        <a routerLink="/discover" class="brand-logo">
          <div class="heart-badge">
            <mat-icon class="brand-icon">favorite</mat-icon>
          </div>
          <div class="brand-text-col">
            <span class="brand-name">KIIT<span class="brand-accent">Connects</span></span>
            <span class="brand-sub">by KIIT Confession</span>
          </div>
        </a>

        <!-- Center Nav Links (Desktop only) -->
        <nav class="nav-menu desktop-nav">
          <a routerLink="/discover" routerLinkActive="active" class="nav-item">
            <mat-icon class="nav-icon">explore</mat-icon>
            <span class="nav-text">Discover</span>
          </a>
          <a routerLink="/feed" routerLinkActive="active" class="nav-item">
            <mat-icon class="nav-icon">dynamic_feed</mat-icon>
            <span class="nav-text">Campus Feed</span>
          </a>
          <a routerLink="/speed-chat" routerLinkActive="active" class="nav-item speed-chat-nav">
            <mat-icon class="nav-icon">bolt</mat-icon>
            <span class="nav-text">Speed Connect</span>
          </a>
          <a routerLink="/matches" routerLinkActive="active" class="nav-item">
            <mat-icon class="nav-icon">favorite_border</mat-icon>
            <span class="nav-text">Matches</span>
          </a>
          <a routerLink="/profile" routerLinkActive="active" class="nav-item">
            <mat-icon class="nav-icon">person</mat-icon>
            <span class="nav-text">Profile</span>
          </a>
          <a routerLink="/admin" routerLinkActive="active" class="nav-item admin-item" *ngIf="auth.isAdmin()">
            <mat-icon class="nav-icon">shield</mat-icon>
            <span class="nav-text">Admin</span>
          </a>
        </nav>

        <!-- Right User Actions -->
        <div class="user-actions">
          <button mat-icon-button [matMenuTriggerFor]="userMenu" class="avatar-btn" aria-label="Account menu">
            <mat-icon class="avatar-icon">account_circle</mat-icon>
          </button>
          <mat-menu #userMenu="matMenu" xPosition="before" class="custom-menu">
            <div class="menu-user-info" *ngIf="auth.getCurrentUser() as user">
              <span class="user-name">{{ user.name }}</span>
              <span class="user-email">{{ user.email }}</span>
            </div>
            <button mat-menu-item routerLink="/profile">
              <mat-icon>edit</mat-icon>
              <span>Edit Profile</span>
            </button>
            <button mat-menu-item (click)="auth.logout()" class="logout-btn">
              <mat-icon>logout</mat-icon>
              <span>Sign Out</span>
            </button>
          </mat-menu>
        </div>
      </div>
    </header>

    <main class="page-viewport" [class.authenticated]="auth.isLoggedIn()">
      <router-outlet></router-outlet>
    </main>

    <!-- Mobile Dedicated Bottom Navigation Dock -->
    <nav class="mobile-bottom-nav" *ngIf="auth.isLoggedIn()">
      <a routerLink="/discover" routerLinkActive="active" class="mobile-nav-link">
        <mat-icon class="m-icon">explore</mat-icon>
        <span class="m-label">Discover</span>
      </a>
      <a routerLink="/feed" routerLinkActive="active" class="mobile-nav-link">
        <mat-icon class="m-icon">dynamic_feed</mat-icon>
        <span class="m-label">Feed</span>
      </a>
      <a routerLink="/speed-chat" routerLinkActive="active" class="mobile-nav-link speed-link">
        <mat-icon class="m-icon">bolt</mat-icon>
        <span class="m-label">Speed</span>
      </a>
      <a routerLink="/matches" routerLinkActive="active" class="mobile-nav-link">
        <mat-icon class="m-icon">favorite</mat-icon>
        <span class="m-label">Matches</span>
      </a>
      <a routerLink="/profile" routerLinkActive="active" class="mobile-nav-link">
        <mat-icon class="m-icon">person</mat-icon>
        <span class="m-label">Profile</span>
      </a>
      <a routerLink="/admin" routerLinkActive="active" class="mobile-nav-link admin-link" *ngIf="auth.isAdmin()">
        <mat-icon class="m-icon">shield</mat-icon>
        <span class="m-label">Admin</span>
      </a>
    </nav>
  `,
  styles: [`
    .navbar-wrapper {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(226, 232, 240, 0.8);
      box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
    }

    .navbar-container {
      max-width: 1100px;
      margin: 0 auto;
      height: 68px;
      padding: 0 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    /* Brand Logo */
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: inherit;
      cursor: pointer;
    }

    .heart-badge {
      width: 38px;
      height: 38px;
      border-radius: 12px;
      background: linear-gradient(135deg, #ff4b72, #c026d3);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(255, 75, 114, 0.4);
    }

    .brand-icon {
      color: white;
      font-size: 22px;
      width: 22px;
      height: 22px;
      line-height: 22px;
    }

    .brand-text-col {
      display: flex;
      flex-direction: column;
      line-height: 1.1;
    }

    .brand-name {
      font-size: 1.3rem;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #0f172a;
    }

    .brand-accent {
      background: linear-gradient(135deg, #ff4b72, #c026d3);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-left: 2px;
    }

    .brand-sub {
      font-size: 0.68rem;
      font-weight: 700;
      color: #9333ea;
      letter-spacing: 0.3px;
    }

    .speed-chat-nav.active {
      background: linear-gradient(135deg, #ec4899, #8b5cf6) !important;
      color: white !important;
    }

    /* Nav Links */
    .nav-menu {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f1f5f9;
      padding: 5px 6px;
      border-radius: 9999px;
    }

    .nav-item {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 18px;
      border-radius: 9999px;
      color: #64748b;
      font-size: 0.9rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .nav-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      line-height: 20px;
    }

    .nav-text {
      line-height: 1;
    }

    .nav-item:hover {
      color: #0f172a;
      background: rgba(255, 255, 255, 0.6);
    }

    .nav-item.active {
      color: white;
      background: linear-gradient(135deg, #ff4b72, #c026d3);
      box-shadow: 0 4px 12px rgba(255, 75, 114, 0.35);
    }

    .nav-item.admin-item.active {
      background: linear-gradient(135deg, #4f46e5, #06b6d4);
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);
    }

    /* User Avatar */
    .user-actions {
      display: flex;
      align-items: center;
    }

    .avatar-btn {
      color: #64748b;
      transition: transform 0.2s, color 0.2s;
    }

    .avatar-btn:hover {
      color: #ff4b72;
      transform: scale(1.08);
    }

    .avatar-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      line-height: 32px;
    }

    .menu-user-info {
      padding: 12px 16px;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .user-name {
      font-weight: 700;
      color: #0f172a;
      font-size: 0.95rem;
    }

    .user-email {
      color: #64748b;
      font-size: 0.8rem;
    }

    .page-viewport {
      min-height: 100vh;
    }

    .page-viewport.authenticated {
      min-height: calc(100vh - 68px);
    }

    .mobile-bottom-nav {
      display: none;
    }

    /* Responsive for Mobile Phones */
    @media (max-width: 768px) {
      .desktop-nav {
        display: none !important;
      }

      .navbar-container {
        height: 60px;
        padding: 0 16px;
      }

      .brand-logo {
        gap: 10px;
      }

      .heart-badge {
        width: 36px;
        height: 36px;
        border-radius: 10px;
      }

      .brand-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        line-height: 20px;
      }

      .brand-name {
        font-size: 1.2rem;
        font-weight: 800;
      }

      .brand-sub {
        font-size: 0.68rem;
        font-weight: 700;
        color: #9333ea;
      }

      .avatar-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        line-height: 28px;
      }

      /* Mobile Bottom Navigation Bar (Docked at the very bottom of the screen) */
      .mobile-bottom-nav {
        display: flex;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 9999;
        background: rgba(255, 255, 255, 0.98);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-top: 1px solid #e2e8f0;
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
        padding: 6px 4px calc(6px + env(safe-area-inset-bottom, 0px));
        justify-content: space-around;
        align-items: center;
      }

      .mobile-nav-link {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-decoration: none;
        color: #64748b;
        flex: 1;
        min-width: 0;
        padding: 4px 2px;
        border-radius: 12px;
        transition: all 0.2s ease;
        gap: 2px;
      }

      .mobile-nav-link .m-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
        line-height: 22px;
      }

      .mobile-nav-link .m-label {
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.2px;
      }

      .mobile-nav-link.active {
        color: #ff4b72;
      }

      .mobile-nav-link.active .m-icon {
        transform: scale(1.12);
      }

      .mobile-nav-link.speed-link.active {
        color: #ec4899;
      }

      .mobile-nav-link.admin-link.active {
        color: #4f46e5;
      }

      /* Ensure page content never gets covered by bottom nav */
      .page-viewport.authenticated {
        min-height: calc(100vh - 60px);
        padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px)) !important;
      }
    }
  `]
})
export class AppComponent {
  constructor(public auth: AuthService) {}
}
