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
  `]
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  photos: string[] = [];
  interests: string[] = [];
  saving = false;
  uploading = false;

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
        this.photos = user.photos || [];
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
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploading = true;
    this.api.uploadPhoto(file).subscribe({
      next: (res: any) => {
        this.photos.push(res.photoUrl);
        this.uploading = false;
        this.snack.open('Photo uploaded! 📸', '', { duration: 2000 });
      },
      error: () => {
        this.uploading = false;
        this.snack.open('Upload failed', '', { duration: 2000 });
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
}
