import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/auth/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'discover',
    loadComponent: () => import('./pages/discover/discover.component').then(m => m.DiscoverComponent),
    canActivate: [authGuard]
  },
  {
    path: 'feed',
    loadComponent: () => import('./pages/feed/feed.component').then(m => m.FeedComponent),
    canActivate: [authGuard]
  },
  {
    path: 'matches',
    loadComponent: () => import('./pages/matches/matches.component').then(m => m.MatchesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'chat/:matchId',
    loadComponent: () => import('./pages/chat/chat.component').then(m => m.ChatComponent),
    canActivate: [authGuard]
  },
  {
    path: 'speed-chat',
    loadComponent: () => import('./pages/speed-chat/speed-chat.component').then(m => m.SpeedChatComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent),
    canActivate: [adminGuard]
  },
  { path: '**', redirectTo: 'discover' }
];
