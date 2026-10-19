import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatProgressSpinnerModule, MatSnackBarModule, MatChipsModule
  ],
  template: `
    <div class="admin-container">
      <div class="admin-header">
        <h1>🛡️ Admin Panel</h1>
        <p class="subtitle">KIIT Dating — User Management</p>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <mat-card class="stat-card">
          <div class="stat-value">{{stats.total}}</div>
          <div class="stat-label">Total Users</div>
        </mat-card>
        <mat-card class="stat-card active">
          <div class="stat-value">{{stats.active}}</div>
          <div class="stat-label">Active</div>
        </mat-card>
        <mat-card class="stat-card inactive">
          <div class="stat-value">{{stats.disabled}}</div>
          <div class="stat-label">Disabled</div>
        </mat-card>
      </div>

      <!-- Users Table -->
      <mat-card class="table-card">
        <mat-card-header>
          <mat-card-title>All Users</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="loading-state" *ngIf="loading">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
          <table mat-table [dataSource]="users" class="users-table" *ngIf="!loading">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let u">
                <div class="user-cell">
                  <img [src]="u.photoUrls?.[0] || u.photos?.[0] || getAvatar(u.name)" class="user-thumb">
                  <span>{{u.name}}</span>
                </div>
              </td>
            </ng-container>
            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Email</th>
              <td mat-cell *matCellDef="let u">{{u.email}}</td>
            </ng-container>
            <ng-container matColumnDef="gender">
              <th mat-header-cell *matHeaderCellDef>Gender</th>
              <td mat-cell *matCellDef="let u">
                <span class="gender-badge" [class.male]="u.gender==='MALE'" [class.female]="u.gender==='FEMALE'">
                  {{u.gender}}
                </span>
              </td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let u">
                <span class="status-badge" [class.active]="u.active" [class.disabled]="!u.active">
                  {{u.active ? 'Active' : 'Disabled'}}
                </span>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let u">
                <button mat-icon-button [title]="u.active ? 'Disable' : 'Activate'"
                  (click)="toggleUser(u)">
                  <mat-icon [style.color]="u.active ? '#ff9800' : '#4caf50'">
                    {{u.active ? 'block' : 'check_circle'}}
                  </mat-icon>
                </button>
                <button mat-icon-button title="Delete" (click)="deleteUser(u)" style="color: #f44336">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .admin-container { max-width: 960px; margin: 0 auto; padding: 24px 16px; }
    .admin-header { text-align: center; margin-bottom: 32px; }
    .admin-header h1 { font-size: 2rem; font-weight: 700; margin: 0; }
    .subtitle { color: #666; margin: 6px 0 0; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      border-radius: 16px !important;
      padding: 24px;
      text-align: center;
    }
    .stat-value { font-size: 2.5rem; font-weight: 700; color: #333; }
    .stat-label { color: #999; font-size: 0.9rem; margin-top: 4px; }
    .stat-card.active .stat-value { color: #4caf50; }
    .stat-card.inactive .stat-value { color: #f44336; }
    .table-card { border-radius: 16px !important; overflow: hidden; }
    .loading-state { display: flex; justify-content: center; padding: 40px; }
    .users-table { width: 100%; }
    .user-cell { display: flex; align-items: center; gap: 10px; }
    .user-thumb { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
    .gender-badge {
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 0.78rem;
      font-weight: 600;
    }
    .gender-badge.male { background: #e3f2fd; color: #1565c0; }
    .gender-badge.female { background: #fce4ec; color: #c62828; }
    .status-badge {
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 0.78rem;
      font-weight: 600;
    }
    .status-badge.active { background: #e8f5e9; color: #2e7d32; }
    .status-badge.disabled { background: #ffebee; color: #c62828; }
  `]
})
export class AdminComponent implements OnInit {
  users: any[] = [];
  loading = true;
  columns = ['name', 'email', 'gender', 'status', 'actions'];
  stats = { total: 0, active: 0, disabled: 0 };

  constructor(private api: ApiService, private snack: MatSnackBar) {}

  ngOnInit() { this.loadUsers(); }

  loadUsers() {
    this.loading = true;
    this.api.adminGetUsers().subscribe({
      next: (users: any[]) => {
        this.users = users;
        this.stats.total = users.length;
        this.stats.active = users.filter(u => u.active).length;
        this.stats.disabled = users.filter(u => !u.active).length;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  toggleUser(user: any) {
    const obs = user.active ? this.api.adminDeactivate(user.id) : this.api.adminActivate(user.id);
    obs.subscribe({
      next: () => {
        user.active = !user.active;
        this.stats.active = this.users.filter(u => u.active).length;
        this.stats.disabled = this.users.filter(u => !u.active).length;
        this.snack.open(user.active ? 'User activated ✅' : 'User disabled 🚫', '', { duration: 2000 });
      }
    });
  }

  deleteUser(user: any) {
    if (!confirm(`Delete ${user.name}? This cannot be undone.`)) return;
    this.api.adminDelete(user.id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== user.id);
        this.stats.total--;
        if (user.active) this.stats.active--; else this.stats.disabled--;
        this.snack.open('User deleted', '', { duration: 2000 });
      }
    });
  }

  getAvatar(name: string) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=667eea&color=fff&size=64`;
  }
}
