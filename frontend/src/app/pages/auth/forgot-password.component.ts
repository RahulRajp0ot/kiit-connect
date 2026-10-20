import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="auth-bg">
      <div class="auth-container">
        <!-- Brand Header -->
        <div class="auth-header">
          <div class="heart-icon">🔑</div>
          <h1>KIIT Connects</h1>
          <p class="brand-sub">by KIIT Confession</p>
          <p class="brand-tagline">Campus Account Recovery</p>
        </div>

        <mat-card class="auth-card">

          <!-- ══════════════ STEP 1: ENTER EMAIL ══════════════ -->
          <div *ngIf="step === 'email'">
            <div class="step-title-wrap">
              <h2 class="card-heading">Forgot Password</h2>
              <p class="card-subheading">Enter your college email to receive a password reset code</p>
            </div>

            <form [formGroup]="emailForm" (ngSubmit)="sendOtp()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>College Email</mat-label>
                <input matInput formControlName="email" type="email" placeholder="student@kiit.ac.in">
                <mat-icon matSuffix>email</mat-icon>
                <mat-hint>Must be your registered college email</mat-hint>
                <mat-error *ngIf="emailForm.get('email')?.hasError('required')">Email is required</mat-error>
                <mat-error *ngIf="emailForm.get('email')?.hasError('email')">Please enter a valid email address</mat-error>
              </mat-form-field>

              <p class="error-msg" *ngIf="error">{{ error }}</p>

              <button mat-raised-button color="primary" type="submit" class="full-width submit-btn"
                      [disabled]="emailForm.invalid || loading">
                <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
                <span *ngIf="!loading">Send Reset Code →</span>
              </button>
            </form>

            <p class="switch-link">
              Remember your password? <a routerLink="/login">Back to Login</a>
            </p>
          </div>

          <!-- ══════════════ STEP 2: ENTER OTP & NEW PASSWORD ══════════════ -->
          <div *ngIf="step === 'reset'" class="reset-view">
            <div class="mail-icon-wrap">
              <mat-icon class="huge-icon">mark_email_read</mat-icon>
            </div>

            <h2 class="card-heading">Enter Reset Code</h2>
            <p class="otp-instruction">
              We've sent a 6-digit verification code to:
              <br><strong class="highlight-email">{{ targetEmail }}</strong>
            </p>



            <form [formGroup]="resetForm" (ngSubmit)="onResetPassword()">
              <!-- 6-digit OTP -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>6-Digit Code</mat-label>
                <input matInput formControlName="otp" maxlength="6"
                       placeholder="123456" autocomplete="one-time-code" required>
                <mat-icon matSuffix>lock_clock</mat-icon>
                <mat-error *ngIf="resetForm.get('otp')?.hasError('required')">6-digit code is required</mat-error>
              </mat-form-field>

              <!-- New Password -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>New Password</mat-label>
                <input matInput formControlName="newPassword" [type]="showNewPass ? 'text' : 'password'">
                <button mat-icon-button matSuffix type="button" (click)="showNewPass = !showNewPass">
                  <mat-icon>{{ showNewPass ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                <mat-hint>Minimum 8 characters</mat-hint>
                <mat-error *ngIf="resetForm.get('newPassword')?.hasError('required')">New password is required</mat-error>
                <mat-error *ngIf="resetForm.get('newPassword')?.hasError('minlength')">Must be at least 8 characters</mat-error>
              </mat-form-field>

              <!-- Confirm Password -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Confirm New Password</mat-label>
                <input matInput formControlName="confirmPassword" [type]="showConfirmPass ? 'text' : 'password'">
                <button mat-icon-button matSuffix type="button" (click)="showConfirmPass = !showConfirmPass">
                  <mat-icon>{{ showConfirmPass ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                <mat-error *ngIf="resetForm.get('confirmPassword')?.hasError('required')">Please confirm your password</mat-error>
              </mat-form-field>

              <p class="error-msg" *ngIf="error">{{ error }}</p>

              <button mat-raised-button color="primary" type="submit" class="full-width submit-btn"
                      [disabled]="resetForm.invalid || loading">
                <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
                <span *ngIf="!loading">Reset Password & Login 🔒</span>
              </button>
            </form>

            <div class="resend-row">
              <span *ngIf="resendTimer > 0" class="timer-text">
                Resend code in <strong>{{ resendTimer }}s</strong>
              </span>
              <button *ngIf="resendTimer <= 0" mat-button class="resend-btn" (click)="resendCode()" [disabled]="loading">
                <mat-icon>refresh</mat-icon>
                <span>Resend Code</span>
              </button>
            </div>

            <div class="back-link-wrap">
              <button mat-button class="edit-details-btn" (click)="step = 'email'; error = ''">
                ← Wrong email? Try another
              </button>
            </div>
          </div>

          <!-- ══════════════ STEP 3: SUCCESS ══════════════ -->
          <div *ngIf="step === 'success'" class="success-view">
            <div class="success-icon-wrap">
              <mat-icon class="huge-icon success-icon">check_circle</mat-icon>
            </div>
            <h2 class="card-heading">Password Changed!</h2>
            <p class="success-desc">
              Your password has been successfully updated. You can now log in with your new credentials!
            </p>
            <button mat-raised-button color="primary" routerLink="/login" class="full-width submit-btn">
              Proceed to Login 🚀
            </button>
          </div>

        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .auth-bg {
      min-height: 100vh;
      background: linear-gradient(135deg, #e91e8c 0%, #9c27b0 50%, #3f51b5 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
    }

    .auth-container {
      text-align: center;
      width: 100%;
      max-width: 440px;
    }

    .auth-header {
      color: white;
      margin-bottom: 24px;
    }

    .heart-icon {
      font-size: 3rem;
      line-height: 1;
    }

    .auth-header h1 {
      margin: 8px 0;
      font-size: 2.2rem;
      font-weight: 800;
      letter-spacing: -0.5px;
    }

    .brand-sub {
      margin: -2px 0 6px;
      font-weight: 700;
      color: #fdf4ff;
      font-size: 0.95rem;
    }

    .brand-tagline {
      opacity: 0.9;
      font-size: 0.95rem;
      margin: 0;
    }

    .auth-card {
      padding: 32px 28px;
      border-radius: 24px !important;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3) !important;
      background: #ffffff;
    }

    .step-title-wrap {
      margin-bottom: 20px;
    }

    .card-heading {
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 6px 0;
    }

    .card-subheading {
      color: #64748b;
      font-size: 0.9rem;
      margin: 0;
      line-height: 1.4;
    }

    .full-width {
      width: 100%;
      margin-bottom: 12px;
    }

    .submit-btn {
      height: 48px;
      font-size: 1rem;
      font-weight: 700;
      border-radius: 14px;
      margin-top: 10px;
      background: linear-gradient(135deg, #ff4b72, #c026d3) !important;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .error-msg {
      color: #ef4444;
      font-size: 0.85rem;
      font-weight: 600;
      margin: 4px 0 10px 0;
      background: #fef2f2;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid #fecaca;
      text-align: left;
    }

    .switch-link {
      margin-top: 20px;
      font-size: 0.9rem;
      color: #64748b;
    }

    .switch-link a {
      color: #9c27b0;
      font-weight: 700;
      text-decoration: none;
    }

    .switch-link a:hover {
      text-decoration: underline;
    }

    /* ── Step 2 OTP / Reset View ── */
    .mail-icon-wrap, .success-icon-wrap {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      background: #fdf2f8;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }

    .huge-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: #db2777;
    }

    .success-icon-wrap {
      background: #ecfdf5;
    }

    .success-icon {
      color: #10b981;
    }

    .otp-instruction {
      font-size: 0.92rem;
      color: #64748b;
      margin: 0 0 16px;
      line-height: 1.5;
    }

    .highlight-email {
      color: #0f172a;
      font-weight: 700;
    }

    .dev-otp-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 0.82rem;
      color: #475569;
      margin-bottom: 20px;
    }

    .dev-otp-pill strong {
      color: #db2777;
      letter-spacing: 2px;
      font-size: 0.95rem;
    }

    .resend-row {
      margin-top: 14px;
      font-size: 0.85rem;
      color: #64748b;
    }

    .timer-text strong {
      color: #ff4b72;
    }

    .resend-btn {
      color: #ff4b72 !important;
      font-weight: 700 !important;
    }

    .back-link-wrap {
      margin-top: 10px;
    }

    .edit-details-btn {
      color: #64748b !important;
      font-size: 0.85rem !important;
    }

    .success-desc {
      color: #64748b;
      font-size: 0.95rem;
      margin: 0 0 24px;
      line-height: 1.5;
    }

    @media (max-width: 480px) {
      .auth-card {
        padding: 24px 18px;
        border-radius: 20px !important;
      }
      .card-heading {
        font-size: 1.35rem;
      }
    }
  `]
})
export class ForgotPasswordComponent implements OnDestroy {
  step: 'email' | 'reset' | 'success' = 'email';

  emailForm: FormGroup;
  resetForm: FormGroup;

  targetEmail = '';
  devOtp = '';
  loading = false;
  error = '';

  showNewPass = false;
  showConfirmPass = false;

  resendTimer = 0;
  private timerInterval: any = null;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private router: Router
  ) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.resetForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  sendOtp(isResend: boolean = false): void {
    if (!isResend && this.emailForm.invalid) return;

    const email = isResend ? this.targetEmail : this.emailForm.value.email.trim();
    this.targetEmail = email;
    this.loading = true;
    this.error = '';

    this.api.sendForgotPasswordOtp(email).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.devOtp = res.devOtp || '';
        this.step = 'reset';
        this.startResendTimer();
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to send verification code. Please check your email.';
      }
    });
  }

  resendCode(): void {
    if (this.resendTimer > 0) return;
    this.sendOtp(true);
  }

  onResetPassword(): void {
    if (this.resetForm.invalid) return;

    const { otp, newPassword, confirmPassword } = this.resetForm.value;

    if (newPassword !== confirmPassword) {
      this.error = 'Passwords do not match. Please re-enter.';
      return;
    }

    this.loading = true;
    this.error = '';

    this.api.resetPassword({
      email: this.targetEmail,
      otp: otp.trim(),
      newPassword: newPassword.trim()
    }).subscribe({
      next: () => {
        this.loading = false;
        this.step = 'success';
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to reset password. Please check your code and try again.';
      }
    });
  }

  private startResendTimer(): void {
    this.clearTimer();
    this.resendTimer = 60;
    this.timerInterval = setInterval(() => {
      this.resendTimer--;
      if (this.resendTimer <= 0) {
        this.clearTimer();
      }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}
