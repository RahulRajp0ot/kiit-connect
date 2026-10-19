import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatChipsModule, MatIconModule,
    MatSnackBarModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="profile-container">
      <div class="profile-header">
        <h1>My Profile</h1>
        <p class="subtitle">Make your profile stand out 💫</p>
      </div>

      <div class="profile-grid">
        <!-- Profile Photos Card -->
        <mat-card class="photos-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>photo_camera</mat-icon> Photos
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="photos-grid">
              <div class="photo-slot" *ngFor="let photo of photos; let i = index">
                <img [src]="photo" [alt]="'Photo ' + (i+1)" class="profile-photo">
                <button mat-icon-button class="delete-btn" (click)="deletePhoto(i)">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
              <div class="photo-slot add-slot" *ngIf="photos.length < 6" (click)="photoInput.click()">
                <mat-icon>add_photo_alternate</mat-icon>
                <span>Add Photo</span>
              </div>
            </div>
            <p class="photo-hint">Up to 6 photos · First photo is your main picture</p>
            <input #photoInput type="file" accept="image/*" (change)="uploadPhoto($event)" style="display:none">
            <div class="upload-progress" *ngIf="uploading">
              <mat-spinner diameter="24"></mat-spinner>
              <span>Uploading...</span>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Edit Profile Card -->
        <mat-card class="edit-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>edit</mat-icon> About Me
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Bio</mat-label>
                <textarea matInput formControlName="bio" rows="4"
                  placeholder="Tell others about yourself..."></textarea>
                <mat-hint align="end">{{profileForm.get('bio')?.value?.length || 0}}/300</mat-hint>
              </mat-form-field>

              <div class="interests-section">
                <label class="interests-label">Interests</label>
                <div class="chip-input-row">
                  <mat-form-field appearance="outline" class="interest-input">
                    <mat-label>Add interest</mat-label>
                    <input matInput #interestInput
                      placeholder="e.g. Music, Movies..."
                      (keydown.enter)="addInterest(interestInput); $event.preventDefault()">
                  </mat-form-field>
                  <button mat-icon-button type="button" class="add-interest-btn"
                    (click)="addInterest(interestInput)">
                    <mat-icon>add</mat-icon>
                  </button>
                </div>
                <div class="chips-container">
                  <span class="interest-chip" *ngFor="let interest of interests; let i = index">
                    {{ interest }}
                    <button type="button" (click)="removeInterest(i)">×</button>
                  </span>
                  <span class="no-interests" *ngIf="interests.length === 0">No interests added yet</span>
                </div>
              </div>

              <button mat-raised-button color="primary" type="submit"
                [disabled]="saving" class="save-btn">
                <mat-spinner diameter="20" *ngIf="saving"></mat-spinner>
                <span *ngIf="!saving">Save Profile</span>
              </button>
            </form>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Danger Zone / When Deletion Request is Pending -->
      <div class="danger-zone-card pending-card" *ngIf="deletionRequested">
        <div class="danger-content">
          <div class="danger-icon-wrap pending-icon-wrap">
            <mat-icon>hourglass_top</mat-icon>
          </div>
          <div class="danger-text">
            <span class="pending-pill-badge">Request Pending Admin Approval</span>
            <h3 class="danger-title pending-title">Sent to Admin for Deletion</h3>
            <p class="danger-desc">
              Your account deletion request has been submitted to the campus administrator for verification. All your profile data, photos, matches, and chats will be permanently removed once approved.
            </p>
          </div>
        </div>
        <button mat-stroked-button class="cancel-del-btn" (click)="cancelDeletionRequest()" [disabled]="deleting">
          <mat-spinner diameter="18" *ngIf="deleting"></mat-spinner>
          <mat-icon *ngIf="!deleting">undo</mat-icon>
          <span>Cancel Deletion Request</span>
        </button>
      </div>

      <!-- Danger Zone / Normal State -->
      <div class="danger-zone-card" *ngIf="!deletionRequested">
        <div class="danger-content">
          <div class="danger-icon-wrap">
            <mat-icon>warning_amber</mat-icon>
          </div>
          <div class="danger-text">
            <h3 class="danger-title">Delete Account</h3>
            <p class="danger-desc">
              Submit an account deletion request. Once reviewed and approved by the administrator, your profile, photos, matches, and messages will be permanently erased.
            </p>
          </div>
        </div>
        <button mat-stroked-button class="delete-acc-btn" (click)="requestDeletion()" [disabled]="deleting">
          <mat-spinner diameter="18" *ngIf="deleting"></mat-spinner>
          <mat-icon *ngIf="!deleting">delete_forever</mat-icon>
          <span>{{ deleting ? 'Submitting...' : 'Request Account Deletion' }}</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .profile-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 24px 16px;
    }
    .profile-header {
      text-align: center;
      margin-bottom: 32px;
    }
    .profile-header h1 {
      font-size: 2rem;
      font-weight: 700;
      background: linear-gradient(135deg, #ff6b9d, #c44dff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 0;
    }
    .subtitle { color: #666; margin: 8px 0 0; }
    .profile-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    @media (max-width: 700px) { .profile-grid { grid-template-columns: 1fr; } }
    mat-card { border-radius: 16px !important; box-shadow: 0 4px 20px rgba(0,0,0,0.08) !important; }
    mat-card-title { display: flex; align-items: center; gap: 8px; font-size: 1.1rem; }
    .photos-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin: 12px 0;
    }
    .photo-slot {
      aspect-ratio: 1;
      border-radius: 12px;
      overflow: hidden;
      position: relative;
      background: #f5f5f5;
    }
    .profile-photo { width: 100%; height: 100%; object-fit: cover; }
    .delete-btn {
      position: absolute !important;
      top: 2px;
      right: 2px;
      background: rgba(0,0,0,0.6) !important;
      color: white !important;
      width: 24px !important;
      height: 24px !important;
    }
    .add-slot {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border: 2px dashed #ff6b9d;
      color: #ff6b9d;
      gap: 4px;
      font-size: 0.75rem;
      transition: background 0.2s;
    }
    .add-slot:hover { background: rgba(255,107,157,0.08); }
    .photo-hint { font-size: 0.75rem; color: #999; margin: 4px 0 0; }
    .upload-progress { display: flex; align-items: center; gap: 8px; color: #666; font-size: 0.85rem; margin-top: 8px; }
    .full-width { width: 100%; }
    .interests-section { margin: 16px 0; }
    .interests-label { font-size: 0.85rem; color: #666; display: block; margin-bottom: 8px; }
    .chip-input-row { display: flex; align-items: center; gap: 8px; }
    .interest-input { flex: 1; }
    .add-interest-btn { color: #ff6b9d !important; margin-top: -16px; }
    .chips-container { display: flex; flex-wrap: wrap; gap: 8px; min-height: 36px; }
    .interest-chip {
      background: linear-gradient(135deg, rgba(255,107,157,0.15), rgba(196,77,255,0.15));
      border: 1px solid rgba(255,107,157,0.4);
      border-radius: 20px;
      padding: 4px 12px;
      font-size: 0.85rem;
      color: #c44dff;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .interest-chip button {
      background: none;
      border: none;
      cursor: pointer;
      color: #ff6b9d;
      font-size: 1rem;
      line-height: 1;
      padding: 0;
    }
    .no-interests { color: #bbb; font-size: 0.85rem; align-self: center; }
    .save-btn { width: 100%; margin-top: 16px; height: 48px; font-size: 1rem; background: linear-gradient(135deg, #ff6b9d, #c44dff) !important; }

    .danger-zone-card {
      margin-top: 32px;
      background: #fff;
      border: 1px solid #fee2e2;
      border-radius: 18px;
      padding: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      box-shadow: 0 4px 16px rgba(239, 68, 68, 0.05);
    }
    .danger-zone-card.pending-card {
      background: #fffdf5;
      border-color: #fde68a;
    }
    .pending-icon-wrap {
      background: #fef3c7 !important;
      color: #d97706 !important;
    }
    .pending-title {
      color: #b45309 !important;
    }
    .pending-pill-badge {
      display: inline-block;
      background: #fef3c7;
      color: #b45309;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      padding: 2px 8px;
      border-radius: 9999px;
      margin-bottom: 4px;
    }
    .cancel-del-btn {
      color: #475569 !important;
      border-color: #cbd5e1 !important;
      font-weight: 600 !important;
      height: 44px !important;
      border-radius: 12px !important;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .cancel-del-btn:hover:not(:disabled) {
      background: #f1f5f9 !important;
    }
    @media (max-width: 600px) {
      .danger-zone-card {
        flex-direction: column;
        align-items: flex-start;
      }
      .delete-acc-btn {
        width: 100%;
      }
    }
    .danger-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .danger-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: #fef2f2;
      color: #ef4444;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .danger-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: #991b1b;
      margin: 0 0 4px 0;
    }
    .danger-desc {
      font-size: 0.85rem;
      color: #64748b;
      margin: 0;
      line-height: 1.4;
    }
    .delete-acc-btn {
      color: #dc2626 !important;
      border-color: #fca5a5 !important;
      font-weight: 600 !important;
      height: 44px !important;
      border-radius: 12px !important;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .delete-acc-btn:hover:not(:disabled) {
      background: #fef2f2 !important;
      border-color: #ef4444 !important;
    }
  `]
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  photos: string[] = [];
  interests: string[] = [];
  saving = false;
  uploading = false;
  deleting = false;
  deletionRequested = false;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private auth: AuthService,
    private snack: MatSnackBar
  ) {
    this.profileForm = this.fb.group({
      bio: ['', [Validators.maxLength(300)]]
    });
  }

  ngOnInit() {
    this.api.getMyProfile().subscribe({
      next: (user: any) => {
        this.profileForm.patchValue({ bio: user.bio || '' });
        this.interests = user.interests || [];
        this.photos = user.photoUrls || user.photos || [];
        this.deletionRequested = !!user.deletionRequested;
      }
    });
  }

  addInterest(input: HTMLInputElement) {
    const val = input.value.trim();
    if (val && !this.interests.includes(val) && this.interests.length < 10) {
      this.interests.push(val);
      input.value = '';
    }
  }

  removeInterest(i: number) {
    this.interests.splice(i, 1);
  }

  uploadPhoto(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploading = true;
    this.api.uploadPhoto(file).subscribe({
      next: (res: any) => {
        const url = typeof res === 'string' ? res : (res?.photoUrl || res?.url);
        if (url) {
          this.photos.push(url);
        }
        this.uploading = false;
        input.value = '';
        this.snack.open('Photo uploaded! 📸', '', { duration: 2500 });
      },
      error: (err: any) => {
        this.uploading = false;
        input.value = '';
        const msg = err.error?.message || err.error || 'Failed to upload photo. Please try a different image.';
        this.snack.open(msg, 'Dismiss', { duration: 3000 });
      }
    });
  }

  deletePhoto(index: number) {
    const url = this.photos[index];
    this.api.deletePhoto(url).subscribe({
      next: () => {
        this.photos.splice(index, 1);
        this.snack.open('Photo removed', '', { duration: 2000 });
      }
    });
  }

  saveProfile() {
    this.saving = true;
    this.api.updateProfile({
      bio: this.profileForm.value.bio,
      interests: this.interests
    }).subscribe({
      next: () => {
        this.saving = false;
        this.snack.open('Profile saved! ✅', '', { duration: 2000 });
      },
      error: () => {
        this.saving = false;
        this.snack.open('Save failed', '', { duration: 2000 });
      }
    });
  }

  requestDeletion() {
    const confirmed = confirm(
      "⚠️ Are you sure you want to request account deletion?\n\n" +
      "This request will be sent to the campus administrator for review and approval.\n" +
      "Once approved by the admin, all your photos, matches, and conversation messages will be permanently deleted."
    );

    if (!confirmed) return;

    this.deleting = true;
    this.api.requestAccountDeletion().subscribe({
      next: () => {
        this.deleting = false;
        this.deletionRequested = true;
        this.snack.open('Deletion request submitted to admin for approval ⏳', 'OK', { duration: 4000 });
      },
      error: () => {
        this.deleting = false;
        this.snack.open('Failed to submit deletion request', 'Dismiss', { duration: 3000 });
      }
    });
  }

  cancelDeletionRequest() {
    this.deleting = true;
    this.api.cancelAccountDeletion().subscribe({
      next: () => {
        this.deleting = false;
        this.deletionRequested = false;
        this.snack.open('Deletion request cancelled ✅', 'OK', { duration: 3000 });
      },
      error: () => {
        this.deleting = false;
        this.snack.open('Failed to cancel deletion request', 'Dismiss', { duration: 3000 });
      }
    });
  }
}
