import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatProgressSpinnerModule, MatSnackBarModule, MatChipsModule,
    MatSlideToggleModule, MatInputModule, MatFormFieldModule
  ],
  template: `
    <div class="admin-page">
      <div class="admin-container">
        <!-- Header -->
        <div class="admin-header">
          <div class="badge-title">
            <mat-icon class="shield-icon">security</mat-icon>
            <span>Administration</span>
          </div>
          <h1 class="page-title">Campus Control Center</h1>
          <p class="subtitle">Manage matching, swipe limits, college domains, and students</p>
        </div>

        <!-- 5 Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-num">{{ stats.total }}</span>
            <span class="stat-name">Total Students</span>
          </div>
          <div class="stat-card active">
            <span class="stat-num">{{ stats.active }}</span>
            <span class="stat-name">Active</span>
          </div>
          <div class="stat-card pending-card" [class.has-pending]="stats.pending > 0">
            <span class="stat-num">{{ stats.pending }}</span>
            <span class="stat-name">Waiting Review</span>
          </div>
          <div class="stat-card deletion-stat-card" [class.has-deletion]="stats.deletionRequests > 0">
            <span class="stat-num">{{ stats.deletionRequests }}</span>
            <span class="stat-name">Deletion Requests</span>
          </div>
          <div class="stat-card" [class.matching-on]="settings.matchingEnabled" [class.matching-off]="!settings.matchingEnabled">
            <span class="stat-num">{{ settings.matchingEnabled ? 'ON' : 'PAUSED' }}</span>
            <span class="stat-name">Matching Status</span>
          </div>
          <div class="stat-card">
            <span class="stat-num">{{ settings.defaultDailySwipeLimit }}</span>
            <span class="stat-name">Default Daily Limit</span>
          </div>
        </div>

        <!-- Section 1 & 2: System Controls (Matching & Limits) -->
        <div class="settings-grid">
          <!-- 1. Matching Control Card -->
          <mat-card class="control-card">
            <div class="card-top">
              <div class="card-icon-wrap" [class.paused]="!settings.matchingEnabled">
                <mat-icon>{{ settings.matchingEnabled ? 'favorite' : 'pause_circle' }}</mat-icon>
              </div>
              <div>
                <h3 class="card-heading">Campus Matching Switch</h3>
                <p class="card-subheading">Turn matching ON when ready, or PAUSE with a custom announcement</p>
              </div>
            </div>

            <div class="matching-toggle-row">
              <mat-slide-toggle [(ngModel)]="settings.matchingEnabled" color="primary">
                <strong>{{ settings.matchingEnabled ? 'Matching is ACTIVE (Live)' : 'Matching is PAUSED' }}</strong>
              </mat-slide-toggle>
            </div>

            <!-- Custom Message Box shown to users when matching is disabled -->
            <div class="message-field-wrap">
              <label class="input-label">Announcement Message (Shown to users when matching is paused):</label>
              <mat-form-field appearance="outline" class="full-width">
                <textarea matInput [(ngModel)]="settings.matchingDisabledMessage" rows="3"
                          placeholder="e.g. Matching will go live once 100 students join! Stay tuned! 🚀"></textarea>
              </mat-form-field>
            </div>

            <button mat-raised-button color="primary" class="save-settings-btn" (click)="saveMatchingSettings()">
              <mat-icon>save</mat-icon>
              <span>Save Matching Settings</span>
            </button>
          </mat-card>

          <!-- 2. Global Swipe Limit & Domains Card -->
          <div class="side-controls">
            <!-- Global Swipe Limit -->
            <mat-card class="control-card compact">
              <div class="card-top">
                <div class="card-icon-wrap bolt">
                  <mat-icon>bolt</mat-icon>
                </div>
                <div>
                  <h3 class="card-heading">Default Daily Swipe Limit</h3>
                  <p class="card-subheading">Default number of profiles any student can swipe per 24 hours</p>
                </div>
              </div>

              <div class="limit-input-row">
                <mat-form-field appearance="outline" class="limit-field">
                  <input matInput type="number" min="1" max="100" [(ngModel)]="settings.defaultDailySwipeLimit">
                  <span matSuffix class="suffix-text">swipes/day</span>
                </mat-form-field>
                <button mat-raised-button color="primary" (click)="saveDefaultLimit()">Save</button>
              </div>
            </mat-card>

            <!-- 3. Allowed College Domains -->
            <mat-card class="control-card compact">
              <div class="card-top">
                <div class="card-icon-wrap school">
                  <mat-icon>domain</mat-icon>
                </div>
                <div>
                  <h3 class="card-heading">Allowed College Domains</h3>
                  <p class="card-subheading">Students can only register with emails from these domains</p>
                </div>
              </div>

              <div class="domains-chips-list">
                <span class="domain-tag" *ngFor="let domain of settings.allowedDomains">
                  &#64;{{ domain }}
                  <button type="button" class="tag-del-btn" (click)="removeDomain(domain)" title="Remove domain">×</button>
                </span>
              </div>

              <div class="add-domain-row">
                <mat-form-field appearance="outline" class="domain-input">
                  <mat-label>Add Domain</mat-label>
                  <input matInput [(ngModel)]="newDomain" placeholder="e.g. soa.ac.in" (keydown.enter)="addDomain()">
                </mat-form-field>
                <button mat-raised-button color="primary" class="add-dom-btn" (click)="addDomain()" [disabled]="!newDomain.trim()">
                  + Add
                </button>
              </div>
            </mat-card>
          </div>
        </div>

        <!-- Section 3: Student Management & Per-User Specific Limits Table -->
        <mat-card class="table-card">
          <div class="table-card-header">
            <div>
              <h2 class="table-title">Registered Students ({{ users.length }})</h2>
              <p class="table-subtitle">View profiles, configure specific custom swipe limits, block or remove accounts</p>
            </div>
            <button mat-button class="refresh-table-btn" (click)="loadAllData()">
              <mat-icon>refresh</mat-icon>
              <span>Refresh</span>
            </button>
          </div>

          <div class="table-loading" *ngIf="loading">
            <mat-spinner diameter="40"></mat-spinner>
          </div>

          <div class="table-responsive" *ngIf="!loading">
            <table mat-table [dataSource]="users" class="custom-table">
              <!-- Name & Photo Column -->
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Student</th>
                <td mat-cell *matCellDef="let u">
                  <div class="user-row-cell">
                    <img [src]="getPhoto(u)" class="user-avatar-img">
                    <div>
                      <div class="cell-name">{{ u.name }}</div>
                      <div class="cell-college">{{ u.college || 'KIIT' }}</div>
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Email Column -->
              <ng-container matColumnDef="email">
                <th mat-header-cell *matHeaderCellDef>College Email</th>
                <td mat-cell *matCellDef="let u">
                  <span class="cell-email">{{ u.email }}</span>
                </td>
              </ng-container>

              <!-- Gender Column -->
              <ng-container matColumnDef="gender">
                <th mat-header-cell *matHeaderCellDef>Gender</th>
                <td mat-cell *matCellDef="let u">
                  <span class="gender-pill" [class.male]="u.gender === 'MALE'" [class.female]="u.gender === 'FEMALE'">
                    {{ u.gender }}
                  </span>
                </td>
              </ng-container>

              <!-- Approval / Verification Column -->
              <ng-container matColumnDef="approval">
                <th mat-header-cell *matHeaderCellDef>Verification</th>
                <td mat-cell *matCellDef="let u">
                  <div class="approval-cell">
                    <span class="approval-pill"
                          [class.approved]="u.approvalStatus === 'APPROVED'"
                          [class.pending]="u.approvalStatus === 'PENDING' || !u.approvalStatus"
                          [class.rejected]="u.approvalStatus === 'REJECTED'">
                      <mat-icon class="pill-mini-icon">
                        {{ u.approvalStatus === 'APPROVED' ? 'verified' : (u.approvalStatus === 'REJECTED' ? 'cancel' : 'hourglass_top') }}
                      </mat-icon>
                      {{ u.approvalStatus || 'PENDING' }}
                    </span>
                    <div class="approval-btn-group" *ngIf="u.role !== 'ADMIN'">
                      <button mat-icon-button *ngIf="u.approvalStatus !== 'APPROVED'"
                              class="mini-approve-btn" (click)="approveUser(u)" title="Approve student for matching">
                        <mat-icon>check_circle</mat-icon>
                      </button>
                      <button mat-icon-button *ngIf="u.approvalStatus !== 'REJECTED'"
                              class="mini-reject-btn" (click)="rejectUser(u)" title="Reject student">
                        <mat-icon>cancel</mat-icon>
                      </button>
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let u">
                  <span class="status-pill" [class.active]="u.active" [class.disabled]="!u.active">
                    {{ u.active ? 'Active' : 'Blocked' }}
                  </span>
                </td>
              </ng-container>

              <!-- Daily Swipe Limit Column (Customizable per user!) -->
              <ng-container matColumnDef="swipeLimit">
                <th mat-header-cell *matHeaderCellDef>Daily Limit</th>
                <td mat-cell *matCellDef="let u">
                  <div class="limit-cell">
                    <span class="limit-badge" [class.custom]="u.customDailySwipeLimit">
                      {{ u.customDailySwipeLimit ? u.customDailySwipeLimit + ' (Custom)' : settings.defaultDailySwipeLimit + ' (Default)' }}
                    </span>
                    <button mat-icon-button class="edit-limit-btn" (click)="promptUserLimit(u)" title="Set specific limit for this user">
                      <mat-icon>tune</mat-icon>
                    </button>
                  </div>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let u">
                  <div class="actions-cell">
                    <!-- Deletion Requested Action Group -->
                    <div class="deletion-action-box" *ngIf="u.deletionRequested">
                      <span class="del-req-tag">Delete Requested</span>
                      <button mat-icon-button class="del-approve-btn" (click)="approveDeletion(u)" title="Approve & Permanently Delete Account">
                        <mat-icon>delete_forever</mat-icon>
                      </button>
                      <button mat-icon-button class="del-reject-btn" (click)="rejectDeletion(u)" title="Reject Deletion Request (Keep Active)">
                        <mat-icon>cancel</mat-icon>
                      </button>
                    </div>

                    <!-- Normal Actions (when no deletion requested) -->
                    <ng-container *ngIf="!u.deletionRequested">
                      <button mat-icon-button [title]="u.active ? 'Block Student' : 'Unblock Student'"
                              (click)="toggleUser(u)" class="status-btn">
                        <mat-icon [style.color]="u.active ? '#f59e0b' : '#10b981'">
                          {{ u.active ? 'block' : 'check_circle' }}
                        </mat-icon>
                      </button>
                      <button mat-icon-button title="Delete Account" (click)="deleteUser(u)" class="del-btn">
                        <mat-icon>delete_outline</mat-icon>
                      </button>
                    </ng-container>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns;"></tr>
            </table>
          </div>
        </mat-card>

      </div>
    </div>
  `,
  styles: [`
    .admin-page {
      padding: 32px 20px 60px;
      background: #f8fafc;
      min-height: calc(100vh - 68px);
    }

    .admin-container {
      max-width: 1100px;
      margin: 0 auto;
    }

    /* Header */
    .admin-header {
      margin-bottom: 28px;
    }

    .badge-title {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #e0e7ff;
      color: #4338ca;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .shield-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .page-title {
      font-size: 2.2rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
      margin: 0 0 6px 0;
    }

    .subtitle {
      color: #64748b;
      font-size: 1rem;
      margin: 0;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card.pending-card.has-pending {
      border-color: #fde68a;
      background: #fffdf5;
    }

    .stat-card.pending-card.has-pending .stat-num {
      color: #d97706;
    }

    .stat-card.deletion-stat-card.has-deletion {
      border-color: #fca5a5;
      background: #fff5f5;
    }

    .stat-card.deletion-stat-card.has-deletion .stat-num {
      color: #dc2626;
    }

    .stat-card {
      background: white;
      border-radius: 20px;
      padding: 20px 24px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
      border: 1px solid #f1f5f9;
      display: flex;
      flex-direction: column;
    }

    .stat-num {
      font-size: 2rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.1;
    }

    .stat-name {
      font-size: 0.82rem;
      font-weight: 600;
      color: #64748b;
      margin-top: 6px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .stat-card.active .stat-num {
      color: #10b981;
    }

    .stat-card.matching-on .stat-num {
      color: #ff4b72;
    }

    .stat-card.matching-off .stat-num {
      color: #f59e0b;
    }

    /* Settings Grid */
    .settings-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 20px;
      margin-bottom: 28px;
    }

    .side-controls {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .control-card {
      background: white;
      border-radius: 24px !important;
      padding: 24px;
      border: 1px solid #e2e8f0 !important;
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.04) !important;
    }

    .card-top {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 18px;
    }

    .card-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      background: linear-gradient(135deg, #ff4b72, #c026d3);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .card-icon-wrap.paused {
      background: #f59e0b;
    }

    .card-icon-wrap.bolt {
      background: linear-gradient(135deg, #3b82f6, #06b6d4);
    }

    .card-icon-wrap.school {
      background: linear-gradient(135deg, #8b5cf6, #ec4899);
    }

    .card-heading {
      font-size: 1.15rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .card-subheading {
      font-size: 0.85rem;
      color: #64748b;
      margin: 2px 0 0 0;
    }

    .matching-toggle-row {
      margin-bottom: 16px;
      padding: 12px 16px;
      background: #f8fafc;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
    }

    .message-field-wrap {
      margin-bottom: 12px;
    }

    .input-label {
      font-size: 0.82rem;
      font-weight: 600;
      color: #475569;
      display: block;
      margin-bottom: 6px;
    }

    .full-width {
      width: 100%;
    }

    .save-settings-btn {
      height: 44px !important;
      border-radius: 12px !important;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .limit-input-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .limit-field {
      flex: 1;
      margin-bottom: -1.25em;
    }

    .suffix-text {
      font-size: 0.8rem;
      color: #94a3b8;
      margin-right: 8px;
    }

    /* Domains Chips */
    .domains-chips-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
      min-height: 36px;
    }

    .domain-tag {
      background: #f1f5f9;
      color: #0f172a;
      border: 1px solid #cbd5e1;
      border-radius: 9999px;
      padding: 4px 12px;
      font-size: 0.85rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .tag-del-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.1rem;
      line-height: 1;
      color: #ef4444;
      padding: 0;
    }

    .add-domain-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .domain-input {
      flex: 1;
      margin-bottom: -1.25em;
    }

    .add-dom-btn {
      height: 44px !important;
      border-radius: 12px !important;
    }

    /* Table Card */
    .table-card {
      border-radius: 24px !important;
      overflow: hidden;
      border: 1px solid #e2e8f0 !important;
      padding: 24px;
    }

    .table-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .table-title {
      font-size: 1.3rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }

    .table-subtitle {
      font-size: 0.85rem;
      color: #64748b;
      margin: 2px 0 0 0;
    }

    .refresh-table-btn {
      color: #4338ca;
      font-weight: 600;
    }

    .table-loading {
      display: flex;
      justify-content: center;
      padding: 40px;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .custom-table {
      width: 100%;
    }

    .user-row-cell {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
    }

    .user-avatar-img {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #ff4b72;
    }

    .cell-name {
      font-weight: 700;
      color: #0f172a;
      font-size: 0.95rem;
    }

    .cell-college {
      font-size: 0.75rem;
      color: #64748b;
    }

    .cell-email {
      font-size: 0.88rem;
      color: #334155;
    }

    .gender-pill {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.3px;
    }

    .gender-pill.male {
      background: #eff6ff;
      color: #2563eb;
      border: 1px solid #bfdbfe;
    }

    .gender-pill.female {
      background: #fdf2f8;
      color: #db2777;
      border: 1px solid #fbcfe8;
    }

    .approval-cell {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .approval-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.3px;
    }

    .approval-pill.approved {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }

    .approval-pill.pending {
      background: #fef3c7;
      color: #b45309;
      border: 1px solid #fde68a;
    }

    .approval-pill.rejected {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    .pill-mini-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      line-height: 14px;
    }

    .approval-btn-group {
      display: flex;
      align-items: center;
    }

    .mini-approve-btn {
      width: 28px !important;
      height: 28px !important;
      color: #10b981;
    }

    .mini-approve-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      line-height: 18px;
    }

    .mini-reject-btn {
      width: 28px !important;
      height: 28px !important;
      color: #ef4444;
    }

    .mini-reject-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      line-height: 18px;
    }

    .status-pill {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .status-pill.active {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }

    .status-pill.disabled {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    .limit-cell {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .limit-badge {
      font-size: 0.82rem;
      font-weight: 600;
      color: #475569;
      background: #f1f5f9;
      padding: 3px 8px;
      border-radius: 8px;
    }

    .limit-badge.custom {
      background: #fef3c7;
      color: #b45309;
      border: 1px solid #fde68a;
    }

    .edit-limit-btn {
      width: 28px !important;
      height: 28px !important;
      color: #64748b;
    }

    .edit-limit-btn mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      line-height: 16px;
    }

    .actions-cell {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .del-btn {
      color: #ef4444 !important;
    }

    .deletion-action-box {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 12px;
      padding: 2px 6px;
    }

    .del-req-tag {
      font-size: 0.72rem;
      font-weight: 700;
      color: #dc2626;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      padding: 0 4px;
    }

    .del-approve-btn {
      color: #dc2626 !important;
      width: 28px !important;
      height: 28px !important;
    }

    .del-approve-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      line-height: 18px;
    }

    .del-reject-btn {
      color: #64748b !important;
      width: 28px !important;
      height: 28px !important;
    }

    .del-reject-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      line-height: 18px;
    }

    @media (max-width: 900px) {
      .settings-grid {
        grid-template-columns: 1fr;
      }
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class AdminComponent implements OnInit {
  users: any[] = [];
  loading = true;
  columns = ['name', 'email', 'gender', 'approval', 'status', 'swipeLimit', 'actions'];
  stats = { total: 0, active: 0, pending: 0, deletionRequests: 0 };

  settings: any = {
    matchingEnabled: false,
    matchingDisabledMessage: '',
    defaultDailySwipeLimit: 5,
    allowedDomains: []
  };

  newDomain = '';

  constructor(private api: ApiService, private snack: MatSnackBar) {}

  ngOnInit() {
    this.loadAllData();
  }

  loadAllData() {
    this.loading = true;
    this.api.adminGetSettings().subscribe({
      next: (data: any) => {
        if (data) this.settings = data;
      }
    });

    this.api.adminGetUsers().subscribe({
      next: (users: any[]) => {
        this.users = users || [];
        this.stats.total = this.users.length;
        this.stats.active = this.users.filter(u => u.active).length;
        this.stats.pending = this.users.filter(u => u.approvalStatus === 'PENDING' || !u.approvalStatus).length;
        this.stats.deletionRequests = this.users.filter(u => u.deletionRequested).length;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  saveMatchingSettings() {
    this.api.adminUpdateMatching(this.settings.matchingEnabled, this.settings.matchingDisabledMessage).subscribe({
      next: (res: any) => {
        this.settings = res;
        const msg = this.settings.matchingEnabled
          ? 'Campus Matching is now LIVE for all students! 🚀'
          : 'Campus Matching has been PAUSED. Announcement updated! 📢';
        this.snack.open(msg, 'OK', { duration: 3500 });
      },
      error: () => {
        this.snack.open('Failed to update matching settings', 'Dismiss', { duration: 3000 });
      }
    });
  }

  saveDefaultLimit() {
    this.api.adminUpdateDefaultLimit(this.settings.defaultDailySwipeLimit).subscribe({
      next: (res: any) => {
        this.settings = res;
        this.snack.open(`Default daily limit updated to ${this.settings.defaultDailySwipeLimit} swipes/day!`, 'OK', { duration: 3000 });
      }
    });
  }

  addDomain() {
    if (!this.newDomain?.trim()) return;
    this.api.adminAddDomain(this.newDomain.trim()).subscribe({
      next: (res: any) => {
        this.settings = res;
        this.snack.open(`Domain @${this.newDomain.trim()} added!`, 'OK', { duration: 2500 });
        this.newDomain = '';
      }
    });
  }

  removeDomain(domain: string) {
    if (this.settings.allowedDomains.length <= 1) {
      this.snack.open('At least one domain must be allowed', 'Dismiss', { duration: 3000 });
      return;
    }
    this.api.adminRemoveDomain(domain).subscribe({
      next: (res: any) => {
        this.settings = res;
        this.snack.open(`Domain @${domain} removed`, 'OK', { duration: 2000 });
      }
    });
  }

  promptUserLimit(user: any) {
    const current = user.customDailySwipeLimit || this.settings.defaultDailySwipeLimit;
    const input = prompt(
      `Set daily swipe limit for ${user.name}:\n(Enter a number e.g. 10, or leave empty/0 to reset to system default of ${this.settings.defaultDailySwipeLimit})`,
      user.customDailySwipeLimit ? user.customDailySwipeLimit.toString() : ''
    );

    if (input === null) return; // User cancelled

    const num = input.trim() ? parseInt(input.trim(), 10) : null;
    this.api.adminSetUserLimit(user.id, num).subscribe({
      next: (updated: any) => {
        user.customDailySwipeLimit = updated.customDailySwipeLimit;
        const note = updated.customDailySwipeLimit
          ? `${user.name}'s daily limit set to ${updated.customDailySwipeLimit} swipes!`
          : `${user.name}'s limit reset to default (${this.settings.defaultDailySwipeLimit})!`;
        this.snack.open(note, 'OK', { duration: 3000 });
      }
    });
  }

  approveUser(user: any) {
    this.api.adminApproveUser(user.id).subscribe({
      next: () => {
        user.approvalStatus = 'APPROVED';
        this.stats.pending = this.users.filter(u => u.approvalStatus === 'PENDING' || !u.approvalStatus).length;
        this.snack.open(`${user.name} approved! Matching is now unlocked for them 🎉`, 'OK', { duration: 3000 });
      },
      error: () => {
        this.snack.open('Failed to approve student', 'Dismiss', { duration: 2500 });
      }
    });
  }

  rejectUser(user: any) {
    this.api.adminRejectUser(user.id).subscribe({
      next: () => {
        user.approvalStatus = 'REJECTED';
        this.stats.pending = this.users.filter(u => u.approvalStatus === 'PENDING' || !u.approvalStatus).length;
        this.snack.open(`${user.name} has been rejected from matching`, 'OK', { duration: 3000 });
      },
      error: () => {
        this.snack.open('Failed to reject student', 'Dismiss', { duration: 2500 });
      }
    });
  }

  toggleUser(user: any) {
    const obs = user.active ? this.api.adminDeactivate(user.id) : this.api.adminActivate(user.id);
    obs.subscribe({
      next: () => {
        user.active = !user.active;
        this.stats.active = this.users.filter(u => u.active).length;
        this.snack.open(user.active ? 'Student account activated ✅' : 'Student account blocked 🚫', '', { duration: 2500 });
      }
    });
  }

  deleteUser(user: any) {
    if (!confirm(`Delete ${user.name}'s account? This action cannot be undone.`)) return;
    this.api.adminDelete(user.id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== user.id);
        this.stats.total--;
        if (user.active) this.stats.active--;
        this.stats.pending = this.users.filter(u => u.approvalStatus === 'PENDING' || !u.approvalStatus).length;
        this.stats.deletionRequests = this.users.filter(u => u.deletionRequested).length;
        this.snack.open('Student account deleted', '', { duration: 2500 });
      }
    });
  }

  approveDeletion(user: any) {
    if (!confirm(`Are you sure you want to approve deletion for ${user.name}? This will permanently wipe all their photos, matches, and chats.`)) return;
    this.api.adminDelete(user.id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== user.id);
        this.stats.total--;
        if (user.active) this.stats.active--;
        this.stats.deletionRequests = this.users.filter(u => u.deletionRequested).length;
        this.stats.pending = this.users.filter(u => u.approvalStatus === 'PENDING' || !u.approvalStatus).length;
        this.snack.open(`Account for ${user.name} deleted permanently ✅`, 'OK', { duration: 3000 });
      },
      error: () => this.snack.open('Failed to delete account', 'Dismiss', { duration: 3000 })
    });
  }

  rejectDeletion(user: any) {
    this.api.adminRejectDeletion(user.id).subscribe({
      next: () => {
        user.deletionRequested = false;
        user.deletionRequestedAt = null;
        this.stats.deletionRequests = this.users.filter(u => u.deletionRequested).length;
        this.snack.open(`Deletion request rejected for ${user.name}. Account kept active.`, 'OK', { duration: 3000 });
      },
      error: () => this.snack.open('Failed to reject deletion request', 'Dismiss', { duration: 3000 })
    });
  }

  getPhoto(user: any): string {
    const photos = user.photoUrls || user.photos;
    if (photos && photos.length > 0 && photos[0]) return photos[0];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=4338ca&color=fff&size=80`;
  }
}
