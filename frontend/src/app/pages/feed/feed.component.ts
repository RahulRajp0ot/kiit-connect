import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink, MatCardModule, MatButtonModule,
    MatIconModule, MatInputModule, MatFormFieldModule, MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <div class="feed-page">
      <div class="feed-container">
        <!-- Feed Header -->
        <div class="feed-header">
          <div class="header-badge">
            <mat-icon class="sparkle-icon">auto_awesome</mat-icon>
            <span>KIIT Connects Feed</span>
          </div>
          <h1 class="page-title">Campus Feed & Quotes 📸</h1>
          <p class="subtitle">Share photos, shayaris, thoughts & campus memories with fellow KIITians</p>
        </div>

        <!-- 1. Create Post Card -->
        <mat-card class="create-post-card">
          <div class="create-post-header">
            <img [src]="currentUserAvatar" class="creator-avatar" (error)="onAvatarError($event)">
            <div class="creator-info">
              <span class="creator-name">{{ currentUserName }}</span>
              <span class="creator-badge">✨ Unlimited Posts Enabled</span>
            </div>
          </div>

          <!-- Quote / Thought Input -->
          <div class="input-wrap">
            <mat-form-field appearance="outline" class="quote-field">
              <mat-label>Write a quote, thought, or campus vibe...</mat-label>
              <textarea matInput [(ngModel)]="newQuote" rows="3"
                        placeholder="e.g. 'Engineering teaches you everything except what you actually came to learn ☕' or drop a shayari..."></textarea>
            </mat-form-field>
          </div>

          <!-- Photo Preview (if chosen) -->
          <div class="photo-preview-wrap" *ngIf="selectedPhotoPreview">
            <img [src]="selectedPhotoPreview" class="preview-img">
            <button mat-icon-button class="remove-photo-btn" (click)="removeSelectedPhoto()" title="Remove photo">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <!-- Post Controls Row -->
          <div class="create-actions-row">
            <div class="file-picker-group">
              <input type="file" #photoInput accept="image/*" (change)="onPhotoSelected($event)" style="display: none;">
              <button mat-stroked-button type="button" class="add-photo-btn" (click)="photoInput.click()">
                <mat-icon class="camera-icon">add_photo_alternate</mat-icon>
                <span>{{ selectedFile ? 'Change Photo' : 'Add Photo' }}</span>
              </button>
              <span class="file-name" *ngIf="selectedFile">{{ selectedFile.name }}</span>
            </div>

            <button mat-raised-button class="submit-post-btn"
                    [disabled]="posting || (!newQuote.trim() && !selectedFile)"
                    (click)="submitPost()">
              <mat-icon *ngIf="!posting">send</mat-icon>
              <mat-spinner diameter="20" *ngIf="posting" color="accent"></mat-spinner>
              <span>{{ posting ? 'Posting...' : 'Post to Feed 🚀' }}</span>
            </button>
          </div>
        </mat-card>

        <!-- 2. Loading State -->
        <div class="loading-state" *ngIf="loading">
          <mat-spinner diameter="44"></mat-spinner>
          <p>Loading campus moments...</p>
        </div>

        <!-- 3. Empty Feed State -->
        <div class="empty-feed" *ngIf="!loading && posts.length === 0">
          <div class="empty-icon-wrap">
            <mat-icon class="huge-camera">photo_camera_back</mat-icon>
          </div>
          <h2>No campus posts yet!</h2>
          <p>Be the first one to share a quote and photo on the campus feed above.</p>
        </div>

        <!-- 4. Posts Stream -->
        <div class="posts-stream" *ngIf="!loading && posts.length > 0">
          <mat-card class="post-card" *ngFor="let post of posts">
            <!-- Author Row -->
            <div class="post-author-row">
              <div class="author-left">
                <img [src]="getAuthorPhoto(post)" class="author-avatar" (error)="onAvatarError($event, post.authorName)">
                <div class="author-details">
                  <div class="author-name-row">
                    <span class="author-name">{{ post.authorName }}</span>
                    <span class="author-college-badge">{{ post.authorCollege || 'KIIT' }}</span>
                  </div>
                  <span class="post-time">{{ formatTime(post.createdAt) }}</span>
                </div>
              </div>

              <!-- Delete button if author or admin/mod -->
              <button mat-icon-button class="delete-post-btn" *ngIf="post.canDelete"
                      (click)="deletePost(post)" title="Delete post">
                <mat-icon>delete_outline</mat-icon>
              </button>
            </div>

            <!-- Post Quote / Text -->
            <div class="post-quote-box" *ngIf="post.quote">
              <mat-icon class="quote-icon">format_quote</mat-icon>
              <p class="post-quote-text">{{ post.quote }}</p>
            </div>

            <!-- Post Photo -->
            <div class="post-photo-wrap" *ngIf="post.photoUrl">
              <img [src]="post.photoUrl" class="post-img" loading="lazy" (error)="onPostImgError($event)">
            </div>

            <!-- Interaction Bar -->
            <div class="post-footer">
              <button mat-button class="like-btn" [class.liked]="post.likedByMe" (click)="toggleLike(post)">
                <mat-icon class="heart-icon">{{ post.likedByMe ? 'favorite' : 'favorite_border' }}</mat-icon>
                <span>{{ post.likesCount || 0 }} {{ (post.likesCount === 1) ? 'Like' : 'Likes' }}</span>
              </button>
            </div>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .feed-page {
      background: linear-gradient(180deg, #fdf4f7 0%, #f8fafc 100%);
      min-height: calc(100vh - 68px);
      padding: 32px 16px 80px;
    }

    .feed-container {
      max-width: 640px;
      margin: 0 auto;
    }

    /* Header */
    .feed-header {
      text-align: center;
      margin-bottom: 28px;
    }

    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 75, 114, 0.1);
      color: #ff4b72;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .sparkle-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .page-title {
      font-size: 2.2rem;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0 0 6px 0;
      background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      color: #64748b;
      font-size: 0.95rem;
      margin: 0;
    }

    /* Create Post Card */
    .create-post-card {
      background: white;
      border-radius: 24px !important;
      padding: 20px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
      border: 1px solid #f1f5f9;
      margin-bottom: 32px;
    }

    .create-post-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 14px;
    }

    .creator-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #ff4b72;
    }

    .creator-info {
      display: flex;
      flex-direction: column;
    }

    .creator-name {
      font-weight: 800;
      color: #0f172a;
      font-size: 0.95rem;
    }

    .creator-badge {
      font-size: 0.72rem;
      font-weight: 700;
      color: #10b981;
    }

    .quote-field {
      width: 100%;
      margin-bottom: -1em;
    }

    .photo-preview-wrap {
      position: relative;
      margin-top: 10px;
      margin-bottom: 14px;
      border-radius: 16px;
      overflow: hidden;
      max-height: 280px;
      background: #0f172a;
    }

    .preview-img {
      width: 100%;
      max-height: 280px;
      object-fit: cover;
      display: block;
    }

    .remove-photo-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(15, 23, 42, 0.75) !important;
      color: white !important;
      border-radius: 50%;
    }

    .create-actions-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 14px;
      padding-top: 12px;
      border-top: 1px solid #f1f5f9;
      gap: 12px;
      flex-wrap: wrap;
    }

    .file-picker-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .add-photo-btn {
      border-radius: 9999px !important;
      color: #64748b !important;
      border-color: #cbd5e1 !important;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-weight: 600 !important;
      font-size: 0.85rem !important;
    }

    .camera-icon {
      color: #ff4b72;
    }

    .file-name {
      font-size: 0.78rem;
      color: #64748b;
      max-width: 140px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .submit-post-btn {
      background: linear-gradient(135deg, #ff4b72, #c026d3) !important;
      color: white !important;
      border-radius: 9999px !important;
      padding: 0 24px !important;
      height: 42px !important;
      font-weight: 700 !important;
      box-shadow: 0 4px 14px rgba(255, 75, 114, 0.35);
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .submit-post-btn:disabled {
      opacity: 0.5;
      box-shadow: none;
    }

    /* Loading & Empty */
    .loading-state, .empty-feed {
      text-align: center;
      padding: 60px 20px;
      color: #64748b;
    }

    .empty-icon-wrap {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #fce7f3;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }

    .huge-camera {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: #ff4b72;
    }

    .empty-feed h2 {
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 6px;
    }

    /* Posts Stream */
    .posts-stream {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .post-card {
      background: white;
      border-radius: 24px !important;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
      border: 1px solid #f1f5f9;
      padding: 0 !important;
    }

    .post-author-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px 12px;
    }

    .author-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .author-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #ff4b72;
    }

    .author-details {
      display: flex;
      flex-direction: column;
    }

    .author-name-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .author-name {
      font-weight: 800;
      color: #0f172a;
      font-size: 0.98rem;
    }

    .author-college-badge {
      font-size: 0.7rem;
      font-weight: 700;
      background: #f1f5f9;
      color: #475569;
      padding: 2px 8px;
      border-radius: 9999px;
    }

    .post-time {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .delete-post-btn {
      color: #94a3b8;
      transition: color 0.2s;
    }

    .delete-post-btn:hover {
      color: #ef4444;
    }

    /* Post Quote Box */
    .post-quote-box {
      padding: 8px 20px 16px;
      position: relative;
    }

    .quote-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: #fbcfe8;
      margin-bottom: 2px;
    }

    .post-quote-text {
      font-size: 1.05rem;
      font-weight: 600;
      color: #1e293b;
      line-height: 1.5;
      margin: 0;
      white-space: pre-line;
      font-style: italic;
    }

    /* Post Photo */
    .post-photo-wrap {
      width: 100%;
      background: #0f172a;
      max-height: 520px;
      overflow: hidden;
    }

    .post-img {
      width: 100%;
      max-height: 520px;
      object-fit: contain;
      display: block;
      margin: 0 auto;
      background: #0f172a;
    }

    /* Footer */
    .post-footer {
      padding: 10px 16px;
      border-top: 1px solid #f8fafc;
      display: flex;
      align-items: center;
    }

    .like-btn {
      color: #64748b !important;
      font-weight: 700 !important;
      border-radius: 9999px !important;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }

    .heart-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      line-height: 20px;
      transition: transform 0.2s;
    }

    .like-btn.liked {
      color: #ff4b72 !important;
    }

    .like-btn.liked .heart-icon {
      color: #ff4b72;
      transform: scale(1.15);
    }
  `]
})
export class FeedComponent implements OnInit {
  posts: any[] = [];
  loading = true;
  posting = false;

  newQuote = '';
  selectedFile: File | null = null;
  selectedPhotoPreview: string | null = null;

  constructor(
    private api: ApiService,
    public auth: AuthService,
    private snack: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadPosts();
  }

  get currentUserName(): string {
    return this.auth.currentUserValue?.name || 'Student';
  }

  get currentUserAvatar(): string {
    const user = this.auth.currentUserValue as any;
    if (user?.photos && user.photos.length > 0 && user.photos[0]) {
      return user.photos[0];
    }
    if (user?.photoUrl) {
      return user.photoUrl;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Me')}&background=ff4b72&color=fff&size=200`;
  }

  loadPosts() {
    this.loading = true;
    this.api.getPosts().subscribe({
      next: (list: any[]) => {
        this.posts = list || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onPhotoSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        this.snack.open('Photo is too large! Please select an image under 10MB.', 'Dismiss', { duration: 3000 });
        return;
      }
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.selectedPhotoPreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeSelectedPhoto() {
    this.selectedFile = null;
    this.selectedPhotoPreview = null;
  }

  submitPost() {
    if (!this.newQuote.trim() && !this.selectedFile) {
      this.snack.open('Please add a quote or select a photo to post!', 'Dismiss', { duration: 2500 });
      return;
    }

    this.posting = true;
    this.api.createPost(this.newQuote.trim(), this.selectedFile || undefined).subscribe({
      next: (newPost: any) => {
        this.posts.unshift(newPost);
        this.newQuote = '';
        this.removeSelectedPhoto();
        this.posting = false;
        this.snack.open('Post published to Campus Feed! 🎉', 'OK', { duration: 3000 });
      },
      error: (err: any) => {
        this.posting = false;
        const msg = err.error?.error || err.error?.message || 'Failed to publish post';
        this.snack.open(msg, 'Dismiss', { duration: 3000 });
      }
    });
  }

  toggleLike(post: any) {
    this.api.togglePostLike(post.id).subscribe({
      next: (res: any) => {
        post.likedByMe = res.likedByMe;
        post.likesCount = res.likesCount;
      },
      error: () => {
        this.snack.open('Failed to update like', 'Dismiss', { duration: 2000 });
      }
    });
  }

  deletePost(post: any) {
    if (!confirm('Are you sure you want to delete this campus post?')) return;

    this.api.deletePost(post.id).subscribe({
      next: () => {
        this.posts = this.posts.filter(p => p.id !== post.id);
        this.snack.open('Post deleted', 'OK', { duration: 2500 });
      },
      error: (err: any) => {
        this.snack.open(err.error?.error || 'Failed to delete post', 'Dismiss', { duration: 3000 });
      }
    });
  }

  getAuthorPhoto(post: any): string {
    if (post.authorPhotoUrl) return post.authorPhotoUrl;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(post.authorName || 'Student')}&background=ff4b72&color=fff&size=200`;
  }

  onAvatarError(event: any, name?: string) {
    event.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'KIIT')}&background=ff4b72&color=fff&size=200`;
  }

  onPostImgError(event: any) {
    event.target.style.display = 'none';
  }

  formatTime(isoString: string): string {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString();
    } catch {
      return '';
    }
  }
}
