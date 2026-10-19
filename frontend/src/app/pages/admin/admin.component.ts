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
import { AuthService } from '../../core/services/auth.service';

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

        <!-- Admin Navigation Tabs -->
        <div class="admin-tabs-nav">
          <button class="admin-tab-btn" [class.active]="activeTab === 'students'" (click)="activeTab = 'students'">
            <mat-icon>people</mat-icon>
            <span>Students & Campus Settings</span>
          </button>
          <button class="admin-tab-btn" [class.active]="activeTab === 'speedChat'" (click)="switchToSpeedChat()">
            <mat-icon>bolt</mat-icon>
            <span>Speed Connect 24h Audit</span>
            <span class="audit-counter-badge" *ngIf="speedChatSessions.length > 0">{{ speedChatSessions.length }}</span>
          </button>
        </div>

        <!-- TAB 1: STUDENTS & CAMPUS CONTROLS -->
        <ng-container *ngIf="activeTab === 'students'">

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
          <div class="stat-card" [class.matching-on]="settings.speedChatEnabled" [class.matching-off]="!settings.speedChatEnabled">
            <span class="stat-num">{{ settings.speedChatEnabled ? 'ON' : 'PAUSED' }}</span>
            <span class="stat-name">Speed Connect Status</span>
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

          <!-- 1B. Speed Connect 1-on-1 Switch Card -->
          <mat-card class="control-card">
            <div class="card-top">
              <div class="card-icon-wrap" [class.paused]="!settings.speedChatEnabled">
                <mat-icon>{{ settings.speedChatEnabled ? 'bolt' : 'pause_circle' }}</mat-icon>
              </div>
              <div>
                <h3 class="card-heading">Speed Connect 1-on-1 Switch</h3>
                <p class="card-subheading">Turn random 1-on-1 chats ON or PAUSE with a custom announcement</p>
              </div>
            </div>

            <div class="matching-toggle-row">
              <mat-slide-toggle [(ngModel)]="settings.speedChatEnabled" color="primary">
                <strong>{{ settings.speedChatEnabled ? 'Speed Connect is ACTIVE (Live)' : 'Speed Connect is PAUSED' }}</strong>
              </mat-slide-toggle>
            </div>

            <!-- Custom Message Box shown to users when speed chat is disabled -->
            <div class="message-field-wrap">
              <label class="input-label">Announcement Message (Shown to users when Speed Connect is paused):</label>
              <mat-form-field appearance="outline" class="full-width">
                <textarea matInput [(ngModel)]="settings.speedChatDisabledMessage" rows="3"
                          placeholder="e.g. Speed Connect is temporarily paused for maintenance. Stay tuned! ⚡"></textarea>
              </mat-form-field>
            </div>

            <button mat-raised-button color="primary" class="save-settings-btn" (click)="saveSpeedChatToggleSettings()">
              <mat-icon>save</mat-icon>
              <span>Save Speed Connect Switch</span>
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

            <!-- Global Speed Connect Limit (Default 100) -->
            <mat-card class="control-card compact">
              <div class="card-top">
                <div class="card-icon-wrap speed-bolt">
                  <mat-icon>flash_on</mat-icon>
                </div>
                <div>
                  <h3 class="card-heading">Default Speed Connect Limit</h3>
                  <p class="card-subheading">Daily random speed chats allowed per student (Default: 100)</p>
                </div>
              </div>

              <div class="limit-input-row">
                <mat-form-field appearance="outline" class="limit-field">
                  <input matInput type="number" min="1" max="1000" [(ngModel)]="settings.defaultDailySpeedChatLimit">
                  <span matSuffix class="suffix-text">chats/day</span>
                </mat-form-field>
                <button mat-raised-button color="primary" (click)="saveDefaultSpeedLimit()">Save</button>
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

              <!-- Password Column (Plain Text for Admin) -->
              <ng-container matColumnDef="password">
                <th mat-header-cell *matHeaderCellDef>Password</th>
                <td mat-cell *matCellDef="let u">
                  <span class="cell-password font-mono text-xs bg-slate-100 text-slate-800 px-2 py-1 rounded select-all" title="Plain text password">{{ u.password || '—' }}</span>
                </td>
              </ng-container>

              <!-- Role Column -->
              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef>Role</th>
                <td mat-cell *matCellDef="let u">
                  <div class="role-cell">
                    <span class="role-pill"
                          [class.role-admin]="u.role === 'ADMIN'"
                          [class.role-mod]="u.role === 'MODERATOR'"
                          [class.role-user]="u.role === 'USER' || !u.role">
                      <mat-icon class="pill-mini-icon">
                        {{ u.role === 'ADMIN' ? 'admin_panel_settings' : (u.role === 'MODERATOR' ? 'shield' : 'person') }}
                      </mat-icon>
                      {{ u.role === 'ADMIN' ? 'Admin' : (u.role === 'MODERATOR' ? 'Moderator' : 'Student') }}
                    </span>
                    <button mat-icon-button *ngIf="auth.isSuperAdmin() && u.role !== 'ADMIN'"
                            class="role-toggle-btn"
                            [title]="u.role === 'MODERATOR' ? 'Demote to regular Student' : 'Promote to Moderator'"
                            (click)="toggleModeratorRole(u)">
                      <mat-icon>{{ u.role === 'MODERATOR' ? 'remove_moderator' : 'add_moderator' }}</mat-icon>
                    </button>
                  </div>
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

              <!-- Daily Speed Connect Limit Column (Customizable per user!) -->
              <ng-container matColumnDef="speedLimit">
                <th mat-header-cell *matHeaderCellDef>Speed Connect (Today)</th>
                <td mat-cell *matCellDef="let u">
                  <div class="limit-cell">
                    <div class="limit-text-block">
                      <span class="speed-used-badge">{{ u.speedChatsUsedToday || 0 }} used</span>
                      <span class="limit-badge" [class.custom]="u.customDailySpeedChatLimit">
                        {{ u.customDailySpeedChatLimit ? u.customDailySpeedChatLimit + ' (Custom)' : (settings.defaultDailySpeedChatLimit || 100) + ' (Default)' }}
                      </span>
                    </div>
                    <button mat-icon-button class="edit-limit-btn" (click)="promptUserSpeedLimit(u)" title="Set specific Speed Connect limit for this student">
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
                      <button mat-icon-button class="del-approve-btn" (click)="approveDeletion(u)" title="Approve & Permanently Delete Account"
                              *ngIf="canDeleteUser(u)">
                        <mat-icon>delete_forever</mat-icon>
                      </button>
                      <button mat-icon-button disabled class="del-approve-btn disabled-btn" title="Moderators cannot delete Administrators"
                              *ngIf="!canDeleteUser(u)">
                        <mat-icon>lock</mat-icon>
                      </button>
                      <button mat-icon-button class="del-reject-btn" (click)="rejectDeletion(u)" title="Reject Deletion Request (Keep Active)">
                        <mat-icon>cancel</mat-icon>
                      </button>
                    </div>

                    <!-- Normal Actions (when no deletion requested) -->
                    <ng-container *ngIf="!u.deletionRequested">
                      <button mat-icon-button title="Edit Student Profile (About & Photos)"
                              (click)="openEditProfile(u)" class="edit-prof-btn">
                        <mat-icon>edit_note</mat-icon>
                      </button>
                      <button mat-icon-button [title]="u.active ? 'Block Student' : 'Unblock Student'"
                              (click)="toggleUser(u)" class="status-btn">
                        <mat-icon [style.color]="u.active ? '#f59e0b' : '#10b981'">
                          {{ u.active ? 'block' : 'check_circle' }}
                        </mat-icon>
                      </button>
                      <button mat-icon-button title="Delete Account" (click)="deleteUser(u)" class="del-btn"
                              *ngIf="canDeleteUser(u)">
                        <mat-icon>delete_outline</mat-icon>
                      </button>
                      <button mat-icon-button disabled title="Moderators cannot delete Administrators" class="del-btn disabled-btn"
                              *ngIf="!canDeleteUser(u)">
                        <mat-icon>lock</mat-icon>
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

        </ng-container> <!-- End Tab 1 -->

        <!-- ── TAB 2: SPEED CONNECT 24-HOUR AUDIT ────────────────────── -->
        <div class="speed-chat-audit-section" *ngIf="activeTab === 'speedChat'">
          <mat-card class="table-card">
            <div class="table-card-header">
              <div>
                <h2 class="table-title">⚡ Speed Connect Logs (Last 24 Hours)</h2>
                <p class="table-subtitle">Real student identity audit for random anonymous chats. Transcripts are retained for 24h for student safety & harassment monitoring.</p>
              </div>
              <button mat-stroked-button (click)="loadSpeedChatSessions()" [disabled]="loadingSpeedChat" class="refresh-btn">
                <mat-icon>refresh</mat-icon>
                <span>Refresh Logs</span>
              </button>
            </div>

            <div class="loading-wrap" *ngIf="loadingSpeedChat">
              <mat-spinner diameter="36"></mat-spinner>
            </div>

            <div class="empty-audit" *ngIf="!loadingSpeedChat && speedChatSessions.length === 0">
              <mat-icon class="empty-audit-icon">chat_bubble_outline</mat-icon>
              <h3>No Speed Connect Chats in the last 24 hours</h3>
              <p>When students connect using random matching, their audit records and transcripts will appear here.</p>
            </div>

            <div class="table-responsive" *ngIf="!loadingSpeedChat && speedChatSessions.length > 0">
              <table class="custom-table audit-table">
                <thead>
                  <tr>
                    <th>Time & Status</th>
                    <th>Student 1 (Real & Anonymous)</th>
                    <th>Student 2 (Real & Anonymous)</th>
                    <th>Messages</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let s of speedChatSessions">
                    <td>
                      <div class="audit-time-cell">
                        <span class="audit-time">{{ formatTime(s.startedAt) }}</span>
                        <span class="audit-status-tag"
                              [class.active]="s.status === 'ACTIVE'"
                              [class.ended]="s.status === 'ENDED'"
                              [class.terminated]="s.status === 'TERMINATED_BY_ADMIN'">
                          {{ s.status === 'TERMINATED_BY_ADMIN' ? 'BROKEN BY ADMIN' : s.status }}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div class="student-audit-cell">
                        <div class="real-student-name">{{ s.realUser1Name }}</div>
                        <div class="real-student-email">{{ s.realUser1Email }}</div>
                        <div class="temp-handle-badge">
                          🎭 {{ s.user1TempName }} (Age: {{ s.user1Age }})
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="student-audit-cell">
                        <div class="real-student-name">{{ s.realUser2Name }}</div>
                        <div class="real-student-email">{{ s.realUser2Email }}</div>
                        <div class="temp-handle-badge">
                          🎭 {{ s.user2TempName }} (Age: {{ s.user2Age }})
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="msg-count-pill">{{ s.messageCount }} msgs</span>
                    </td>
                    <td>
                      <div class="audit-actions-row">
                        <button mat-flat-button class="view-transcript-btn" (click)="openTranscriptModal(s)">
                          <mat-icon>visibility</mat-icon>
                          <span>Chat</span>
                        </button>
                        <button mat-flat-button class="break-chat-btn" *ngIf="s.status === 'ACTIVE'" (click)="breakChatSession(s)" title="Break ongoing conversation">
                          <mat-icon>link_off</mat-icon>
                          <span>Break</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </mat-card>
        </div>

        <!-- ── MODAL 1: EDIT STUDENT PROFILE (About & Photos) ──────────── -->
        <div class="admin-modal-backdrop" *ngIf="editingUser" (click)="editingUser = null">
          <div class="admin-modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-title-wrap">
                <mat-icon class="modal-icon">manage_accounts</mat-icon>
                <div>
                  <h3 class="modal-title">Edit Profile · {{ editingUser.name }}</h3>
                  <span class="modal-subtitle">{{ editingUser.email }} · {{ editingUser.gender }}</span>
                </div>
              </div>
              <button mat-icon-button (click)="editingUser = null">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="modal-body">
              <div class="modal-form-row">
                <mat-form-field appearance="outline" class="modal-field">
                  <mat-label>Student Name</mat-label>
                  <input matInput [(ngModel)]="editingUser.name">
                </mat-form-field>

                <mat-form-field appearance="outline" class="modal-field">
                  <mat-label>College / Branch</mat-label>
                  <input matInput [(ngModel)]="editingUser.college">
                </mat-form-field>
              </div>

              <!-- About / Bio section -->
              <mat-form-field appearance="outline" class="full-width modal-textarea">
                <mat-label>About / Bio Section</mat-label>
                <textarea matInput [(ngModel)]="editingUser.bio" rows="4" placeholder="Edit student bio or about text..."></textarea>
                <mat-hint>Visible to students on campus matching cards</mat-hint>
              </mat-form-field>

              <!-- Profile Photos Management -->
              <div class="modal-photos-section">
                <div class="photos-section-header">
                  <span class="photos-section-title">Profile Photos ({{ editingUser.photoUrls?.length || 0 }}/6)</span>
                  <button mat-stroked-button class="upload-photo-btn" (click)="adminPhotoInput.click()" [disabled]="uploadingPhoto || (editingUser.photoUrls?.length >= 6)">
                    <mat-spinner diameter="18" *ngIf="uploadingPhoto"></mat-spinner>
                    <mat-icon *ngIf="!uploadingPhoto">add_photo_alternate</mat-icon>
                    <span>Upload New Photo</span>
                  </button>
                  <input #adminPhotoInput type="file" accept="image/*" (change)="onAdminUploadPhoto($event)" style="display:none">
                </div>

                <div class="modal-photos-grid">
                  <div class="modal-photo-item" *ngFor="let p of editingUser.photoUrls">
                    <img [src]="p" alt="Student photo">
                    <button class="remove-photo-badge" (click)="deleteUserPhoto(p)" title="Remove this photo">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                  <div class="no-photos-msg" *ngIf="!editingUser.photoUrls || editingUser.photoUrls.length === 0">
                    No photos uploaded for this student yet. Click "Upload New Photo" above.
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button mat-button (click)="editingUser = null">Cancel</button>
              <button mat-raised-button color="primary" (click)="saveUserProfile()" [disabled]="savingProfile" class="save-profile-btn">
                <mat-spinner diameter="20" *ngIf="savingProfile"></mat-spinner>
                <span *ngIf="!savingProfile">Save Profile Changes</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ── MODAL 2: CHAT TRANSCRIPT MODAL ────────────────────────── -->
        <div class="admin-modal-backdrop" *ngIf="transcriptSession" (click)="transcriptSession = null">
          <div class="admin-modal-card transcript-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h3 class="modal-title">Speed Connect Chat Transcript</h3>
                <span class="modal-subtitle">
                  {{ transcriptSession.realUser1Name }} ({{ transcriptSession.realUser1Email }}) ⟷ {{ transcriptSession.realUser2Name }} ({{ transcriptSession.realUser2Email }})
                </span>
              </div>
              <button mat-icon-button (click)="transcriptSession = null">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="modal-body transcript-body">
              <div class="loading-wrap" *ngIf="loadingTranscript">
                <mat-spinner diameter="32"></mat-spinner>
              </div>

              <div class="empty-transcript" *ngIf="!loadingTranscript && transcriptMessages.length === 0">
                <p>No messages were exchanged in this session before disconnection.</p>
              </div>

              <div class="transcript-bubbles-list" *ngIf="!loadingTranscript && transcriptMessages.length > 0">
                <div class="transcript-msg" *ngFor="let m of transcriptMessages">
                  <div class="t-msg-header">
                    <span class="t-sender-handle">🎭 {{ m.senderTempName }}</span>
                    <span class="t-msg-time">{{ formatTime(m.sentAt) }}</span>
                  </div>
                  <div class="t-msg-img-wrap" *ngIf="m.imageUrl">
                    <a [href]="m.imageUrl" target="_blank" title="Click to view full photo">
                      <img [src]="m.imageUrl" class="t-msg-img">
                    </a>
                  </div>
                  <div class="t-msg-content" *ngIf="m.content">{{ m.content }}</div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button mat-button (click)="transcriptSession = null">Close</button>
            </div>
          </div>
        </div>

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

    .role-cell {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .role-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.3px;
    }

    .role-pill.role-admin {
      background: #fef3c7;
      color: #b45309;
      border: 1px solid #fde68a;
    }

    .role-pill.role-mod {
      background: #ede9fe;
      color: #6d28d9;
      border: 1px solid #ddd6fe;
    }

    .role-pill.role-user {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
    }

    .role-toggle-btn {
      width: 28px !important;
      height: 28px !important;
      line-height: 28px !important;
      color: #7c3aed !important;
    }

    .role-toggle-btn mat-icon {
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
    }

    .disabled-btn {
      opacity: 0.45 !important;
      cursor: not-allowed !important;
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

    .limit-text-block {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .speed-used-badge {
      font-size: 0.74rem;
      font-weight: 700;
      color: #1e1b4b;
      background: #e0e7ff;
      border: 1px solid #c7d2fe;
      padding: 1px 6px;
      border-radius: 6px;
      align-self: flex-start;
    }

    .card-icon-wrap.speed-bolt {
      background: #fdf2f8;
      color: #ec4899;
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

    .edit-prof-btn {
      color: #6366f1 !important;
    }

    /* ── Admin Tabs ─────────────────────────────────────────────────── */
    .admin-tabs-nav {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }

    .admin-tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: white;
      border: 1px solid #cbd5e1;
      border-radius: 9999px;
      font-size: 0.92rem;
      font-weight: 700;
      color: #475569;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .admin-tab-btn.active {
      background: #0f172a;
      color: white;
      border-color: #0f172a;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.2);
    }

    .audit-counter-badge {
      background: #ec4899;
      color: white;
      font-size: 0.72rem;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 9999px;
    }

    /* ── Speed Chat Audit Section ───────────────────────────────────── */
    .audit-table th, .audit-table td {
      padding: 14px 16px;
    }

    .audit-time-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .audit-time {
      font-size: 0.85rem;
      font-weight: 600;
      color: #0f172a;
    }

    .audit-status-tag {
      display: inline-block;
      align-self: flex-start;
      font-size: 0.68rem;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .audit-status-tag.active {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }

    .audit-status-tag.ended {
      background: #f1f5f9;
      color: #64748b;
      border: 1px solid #e2e8f0;
    }

    .audit-status-tag.terminated {
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fecaca;
    }

    .student-audit-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .real-student-name {
      font-size: 0.92rem;
      font-weight: 800;
      color: #0f172a;
    }

    .real-student-email {
      font-size: 0.78rem;
      color: #64748b;
    }

    .temp-handle-badge {
      display: inline-block;
      align-self: flex-start;
      font-size: 0.75rem;
      font-weight: 700;
      color: #7c3aed;
      background: #f5f3ff;
      border: 1px solid #ddd6fe;
      padding: 2px 8px;
      border-radius: 9999px;
      margin-top: 2px;
    }

    .msg-count-pill {
      font-size: 0.82rem;
      font-weight: 700;
      color: #475569;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 4px 10px;
      border-radius: 8px;
    }

    .audit-actions-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .view-transcript-btn {
      background: #f1f5f9 !important;
      color: #0f172a !important;
      border-radius: 10px !important;
      font-weight: 700 !important;
      font-size: 0.82rem !important;
    }

    .break-chat-btn {
      background: #fef2f2 !important;
      color: #dc2626 !important;
      border: 1px solid #fecaca !important;
      border-radius: 10px !important;
      font-weight: 700 !important;
      font-size: 0.82rem !important;
    }

    .break-chat-btn:hover {
      background: #fee2e2 !important;
    }

    .empty-audit {
      padding: 48px 24px;
      text-align: center;
      color: #64748b;
    }

    .empty-audit-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #cbd5e1;
      margin-bottom: 12px;
    }

    /* ── Admin Modals ───────────────────────────────────────────────── */
    .admin-modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .admin-modal-card {
      background: white;
      border-radius: 24px;
      width: 100%;
      max-width: 640px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
      overflow: hidden;
      animation: modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes modalFadeIn {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }

    .modal-header {
      padding: 20px 24px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .modal-title-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .modal-icon {
      color: #6366f1;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .modal-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }

    .modal-subtitle {
      font-size: 0.82rem;
      color: #64748b;
    }

    .modal-body {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
    }

    .modal-form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 12px;
    }

    .modal-field {
      flex: 1;
      margin-bottom: -1em;
    }

    .modal-textarea {
      margin-bottom: 16px;
    }

    /* Modal Photos Section */
    .modal-photos-section {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 16px;
      margin-top: 12px;
    }

    .photos-section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
    }

    .photos-section-title {
      font-size: 0.95rem;
      font-weight: 800;
      color: #0f172a;
    }

    .upload-photo-btn {
      border-radius: 10px !important;
      font-weight: 700 !important;
      color: #4338ca !important;
      border-color: #cbd5e1 !important;
    }

    .modal-photos-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }

    .modal-photo-item {
      position: relative;
      aspect-ratio: 1;
      border-radius: 12px;
      overflow: hidden;
      border: 2px solid #e2e8f0;
      box-shadow: 0 2px 6px rgba(0,0,0,0.06);
    }

    .modal-photo-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .remove-photo-badge {
      position: absolute;
      top: 6px;
      right: 6px;
      background: rgba(220, 38, 38, 0.9);
      color: white;
      border: none;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }

    .remove-photo-badge mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      line-height: 16px;
    }

    .no-photos-msg {
      grid-column: 1 / -1;
      text-align: center;
      padding: 20px;
      color: #94a3b8;
      font-size: 0.88rem;
    }

    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      background: #f8fafc;
    }

    .save-profile-btn {
      border-radius: 12px !important;
      font-weight: 700 !important;
    }

    /* Transcript Modal */
    .transcript-modal {
      max-width: 680px;
    }

    .transcript-body {
      background: #f8fafc;
      min-height: 320px;
      max-height: 60vh;
    }

    .transcript-bubbles-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .transcript-msg {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 10px 14px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }

    .t-msg-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
    }

    .t-sender-handle {
      font-size: 0.8rem;
      font-weight: 800;
      color: #7c3aed;
    }

    .t-msg-time {
      font-size: 0.72rem;
      color: #94a3b8;
    }

    .t-msg-content {
      font-size: 0.92rem;
      color: #1e293b;
      line-height: 1.4;
      word-break: break-word;
    }

    .t-msg-img-wrap {
      margin: 8px 0;
      max-width: 260px;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      background: #0f172a;
    }

    .t-msg-img {
      width: 100%;
      max-height: 220px;
      object-fit: cover;
      display: block;
      transition: transform 0.2s;
    }

    .t-msg-img:hover {
      transform: scale(1.02);
    }

    .empty-transcript {
      text-align: center;
      padding: 48px 16px;
      color: #94a3b8;
    }

    @media (max-width: 900px) {
      .settings-grid {
        grid-template-columns: 1fr;
      }
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 600px) {
      .admin-page {
        padding: 16px 10px 40px;
      }
      .admin-header h1 {
        font-size: 1.6rem;
      }
      .admin-subtitle {
        font-size: 0.88rem;
      }
      .stats-grid {
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .stat-card {
        padding: 14px 12px;
        gap: 10px;
      }
      .stat-icon {
        width: 38px;
        height: 38px;
      }
      .stat-icon mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
      .stat-num {
        font-size: 1.4rem;
      }
      .nav-tabs-bar {
        gap: 6px;
      }
      .tab-btn {
        padding: 8px 14px !important;
        font-size: 0.85rem !important;
      }
      .table-card {
        padding: 14px 10px;
        border-radius: 18px !important;
      }
      .table-responsive {
        width: 100%;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }
      .custom-table {
        min-width: 720px;
      }
      .modal-box {
        width: 95% !important;
        max-width: 95% !important;
        max-height: 90vh !important;
        border-radius: 20px !important;
      }
      .modal-header {
        padding: 14px 16px;
      }
      .modal-body {
        padding: 14px 16px;
      }
    }
  `]
})
export class AdminComponent implements OnInit {
  users: any[] = [];
  loading = true;
  columns = ['name', 'email', 'password', 'role', 'gender', 'approval', 'status', 'swipeLimit', 'speedLimit', 'actions'];
  stats = { total: 0, active: 0, pending: 0, deletionRequests: 0 };

  settings: any = {
    matchingEnabled: false,
    matchingDisabledMessage: '',
    defaultDailySwipeLimit: 5,
    defaultDailySpeedChatLimit: 100,
    speedChatEnabled: true,
    speedChatDisabledMessage: '',
    allowedDomains: []
  };

  newDomain = '';

  activeTab: 'students' | 'speedChat' = 'students';
  speedChatSessions: any[] = [];
  loadingSpeedChat = false;

  // Edit Profile Modal
  editingUser: any = null;
  savingProfile = false;
  uploadingPhoto = false;

  // Transcript Modal
  transcriptSession: any = null;
  transcriptMessages: any[] = [];
  loadingTranscript = false;

  constructor(private api: ApiService, public auth: AuthService, private snack: MatSnackBar) {}

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

  saveSpeedChatToggleSettings() {
    this.api.adminUpdateSpeedChatToggle(this.settings.speedChatEnabled, this.settings.speedChatDisabledMessage).subscribe({
      next: (res: any) => {
        this.settings = res;
        const msg = this.settings.speedChatEnabled
          ? 'Speed Connect is now LIVE for all students! ⚡'
          : 'Speed Connect has been PAUSED. Announcement updated! 📢';
        this.snack.open(msg, 'OK', { duration: 3500 });
      },
      error: () => {
        this.snack.open('Failed to update Speed Connect switch', 'Dismiss', { duration: 3000 });
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

  saveDefaultSpeedLimit() {
    const limit = this.settings.defaultDailySpeedChatLimit || 100;
    this.api.adminUpdateDefaultSpeedLimit(limit).subscribe({
      next: (res: any) => {
        this.settings = res;
        this.snack.open(`Default Speed Connect limit updated to ${this.settings.defaultDailySpeedChatLimit || 100} chats/day! ⚡`, 'OK', { duration: 3000 });
      },
      error: () => this.snack.open('Failed to update speed limit', 'Dismiss', { duration: 3000 })
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

  promptUserSpeedLimit(user: any) {
    const current = user.customDailySpeedChatLimit || this.settings.defaultDailySpeedChatLimit || 100;
    const input = prompt(
      `Set daily Speed Connect limit for ${user.name}:\n(Enter a number e.g. 50, or leave empty/0 to reset to system default of ${this.settings.defaultDailySpeedChatLimit || 100})`,
      user.customDailySpeedChatLimit ? user.customDailySpeedChatLimit.toString() : ''
    );

    if (input === null) return; // User cancelled

    const num = input.trim() ? parseInt(input.trim(), 10) : null;
    this.api.adminSetUserSpeedLimit(user.id, num).subscribe({
      next: (updated: any) => {
        user.customDailySpeedChatLimit = updated.customDailySpeedChatLimit;
        user.speedChatLimit = updated.speedChatLimit;
        const note = updated.customDailySpeedChatLimit
          ? `${user.name}'s Speed Connect limit set to ${updated.customDailySpeedChatLimit} chats/day!`
          : `${user.name}'s Speed Connect limit reset to default (${this.settings.defaultDailySpeedChatLimit || 100})!`;
        this.snack.open(note, 'OK', { duration: 3000 });
      },
      error: () => this.snack.open('Failed to update student speed limit', 'Dismiss', { duration: 3000 })
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

  canDeleteUser(u: any): boolean {
    if (this.auth.isSuperAdmin()) return true;
    if (this.auth.isModerator() && u.role === 'ADMIN') return false;
    return true;
  }

  toggleModeratorRole(user: any) {
    if (!this.auth.isSuperAdmin()) {
      this.snack.open('Only Administrators can assign moderator roles', 'Dismiss', { duration: 3000 });
      return;
    }
    const newRole = user.role === 'MODERATOR' ? 'USER' : 'MODERATOR';
    const actionName = newRole === 'MODERATOR' ? 'promote to Moderator' : 'demote to regular Student';
    if (!confirm(`Are you sure you want to ${actionName} for ${user.name}?`)) return;

    this.api.adminSetUserRole(user.id, newRole).subscribe({
      next: (res: any) => {
        user.role = res.role || newRole;
        this.snack.open(`${user.name} is now ${user.role}!`, 'OK', { duration: 3000 });
      },
      error: (err: any) => {
        this.snack.open(err.error?.error || 'Failed to update user role', 'Dismiss', { duration: 3000 });
      }
    });
  }

  rejectUser(user: any) {
    const reason = prompt(
      `Enter reason for rejecting ${user.name}'s profile:\n(This note will be shown to the student so they can update their profile and appeal)`,
      'Please upload a clear campus photo and complete your bio details.'
    );
    if (reason === null) return; // User cancelled

    this.api.adminRejectUser(user.id, reason.trim()).subscribe({
      next: () => {
        user.approvalStatus = 'REJECTED';
        user.rejectionReason = reason.trim();
        this.stats.pending = this.users.filter(u => u.approvalStatus === 'PENDING' || !u.approvalStatus).length;
        this.snack.open(`${user.name}'s profile rejected with feedback note.`, 'OK', { duration: 3500 });
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
    if (!this.canDeleteUser(user)) {
      this.snack.open('Moderators cannot delete Administrator accounts', 'Dismiss', { duration: 3000 });
      return;
    }
    if (!confirm(`Delete ${user.name}'s account? This action cannot be undone.`)) return;
    this.api.adminDelete(user.id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== user.id);
        this.stats.total--;
        if (user.active) this.stats.active--;
        this.stats.pending = this.users.filter(u => u.approvalStatus === 'PENDING' || !u.approvalStatus).length;
        this.stats.deletionRequests = this.users.filter(u => u.deletionRequested).length;
        this.snack.open('Student account deleted', '', { duration: 2500 });
      },
      error: (err: any) => {
        this.snack.open(err.error?.error || 'Failed to delete user', 'Dismiss', { duration: 3000 });
      }
    });
  }

  approveDeletion(user: any) {
    if (!this.canDeleteUser(user)) {
      this.snack.open('Moderators cannot delete Administrator accounts', 'Dismiss', { duration: 3000 });
      return;
    }
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

  switchToSpeedChat() {
    this.activeTab = 'speedChat';
    this.loadSpeedChatSessions();
  }

  loadSpeedChatSessions() {
    this.loadingSpeedChat = true;
    this.api.adminGetSpeedChatSessions().subscribe({
      next: (sessions: any[]) => {
        this.speedChatSessions = sessions || [];
        this.loadingSpeedChat = false;
      },
      error: () => {
        this.loadingSpeedChat = false;
      }
    });
  }

  breakChatSession(session: any) {
    if (!confirm(`Are you sure you want to break and disconnect this ongoing chat between ${session.realUser1Name} and ${session.realUser2Name}?`)) {
      return;
    }
    this.api.adminBreakSpeedChatSession(session.sessionUuid).subscribe({
      next: () => {
        session.status = 'TERMINATED_BY_ADMIN';
        this.snack.open('Chat session successfully terminated by Admin.', 'OK', { duration: 3000 });
      },
      error: () => {
        this.snack.open('Failed to break chat session.', 'Dismiss', { duration: 3000 });
      }
    });
  }

  openEditProfile(user: any) {
    this.editingUser = {
      ...user,
      photoUrls: user.photoUrls ? [...user.photoUrls] : (user.photos ? [...user.photos] : [])
    };
  }

  saveUserProfile() {
    if (!this.editingUser) return;
    this.savingProfile = true;
    this.api.adminUpdateUserProfile(this.editingUser.id, {
      name: this.editingUser.name,
      college: this.editingUser.college,
      bio: this.editingUser.bio,
      photoUrls: this.editingUser.photoUrls
    }).subscribe({
      next: (updated: any) => {
        this.savingProfile = false;
        const idx = this.users.findIndex(u => u.id === updated.id);
        if (idx !== -1) {
          this.users[idx] = updated;
          this.users = [...this.users];
        }
        this.editingUser = null;
        this.snack.open(`Profile for ${updated.name} updated successfully! ✅`, 'OK', { duration: 3000 });
      },
      error: () => {
        this.savingProfile = false;
        this.snack.open('Failed to update student profile', 'Dismiss', { duration: 3000 });
      }
    });
  }

  onAdminUploadPhoto(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.editingUser) return;

    this.uploadingPhoto = true;
    this.api.adminUploadUserPhoto(this.editingUser.id, file).subscribe({
      next: (res: any) => {
        const url = res?.photoUrl || res?.url || res;
        if (url) {
          if (!this.editingUser.photoUrls) this.editingUser.photoUrls = [];
          this.editingUser.photoUrls.push(url);
        }
        this.uploadingPhoto = false;
        input.value = '';
        this.snack.open('Photo uploaded for student! 📸', '', { duration: 2500 });
      },
      error: () => {
        this.uploadingPhoto = false;
        input.value = '';
        this.snack.open('Failed to upload photo for student', 'Dismiss', { duration: 2500 });
      }
    });
  }

  deleteUserPhoto(photoUrl: string) {
    if (!this.editingUser) return;
    this.api.adminDeleteUserPhoto(this.editingUser.id, photoUrl).subscribe({
      next: () => {
        this.editingUser.photoUrls = this.editingUser.photoUrls.filter((p: string) => p !== photoUrl);
        this.snack.open('Photo removed', '', { duration: 2000 });
      },
      error: () => {
        this.snack.open('Failed to remove photo', 'Dismiss', { duration: 2000 });
      }
    });
  }

  openTranscriptModal(session: any) {
    this.transcriptSession = session;
    this.transcriptMessages = [];
    this.loadingTranscript = true;
    this.api.adminGetSpeedChatMessages(session.sessionUuid).subscribe({
      next: (msgs: any[]) => {
        this.transcriptMessages = msgs || [];
        this.loadingTranscript = false;
      },
      error: () => {
        this.loadingTranscript = false;
        this.snack.open('Failed to load chat transcript', 'Dismiss', { duration: 2500 });
      }
    });
  }

  formatTime(isoStr: string): string {
    if (!isoStr) return '';
    return new Date(isoStr).toLocaleString('en-IN', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  getPhoto(user: any): string {
    const photos = user.photoUrls || user.photos;
    if (photos && photos.length > 0 && photos[0]) return photos[0];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=4338ca&color=fff&size=80`;
  }
}
