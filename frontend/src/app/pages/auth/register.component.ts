import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="auth-bg">
      <div class="auth-container">
        <!-- Brand Header -->
        <div class="auth-header">
          <div class="heart-icon">✨</div>
          <h1>KIIT Connects</h1>
          <p style="margin: -2px 0 6px; font-weight: 700; color: #c026d3; font-size: 0.95rem;">by KIIT Confession</p>
          <p style="margin: 0; color: #64748b;">Find genuine connections on campus</p>
        </div>

        <mat-card class="auth-card">
          <!-- ================= STEP 1: REGISTRATION DETAILS ================= -->
          <div *ngIf="step === 'details'">
            <div class="step-title-wrap">
              <h2 class="card-heading">Create Account</h2>
              <p class="card-subheading">Step 1 of 2: Enter your student details</p>
            </div>

            <form [formGroup]="registerForm" (ngSubmit)="requestOtp()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Full Name</mat-label>
                <input matInput formControlName="name" placeholder="Rahul Sharma">
                <mat-icon matSuffix>badge</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>College Email</mat-label>
                <input matInput formControlName="email" type="email" placeholder="student@kiit.ac.in">
                <mat-icon matSuffix>school</mat-icon>
                <mat-hint>Must end with &#64;kiit.ac.in</mat-hint>
                <mat-error *ngIf="registerForm.get('email')?.hasError('email')">
                  Please enter a valid email address
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Password</mat-label>
                <input matInput formControlName="password" [type]="showPass ? 'text' : 'password'">
                <button mat-icon-button matSuffix type="button" (click)="showPass = !showPass">
                  <mat-icon>{{ showPass ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                <mat-hint>Minimum 8 characters</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Gender</mat-label>
                <mat-select formControlName="gender">
                  <mat-option value="MALE">Male</mat-option>
                  <mat-option value="FEMALE">Female</mat-option>
                </mat-select>
                <mat-icon matSuffix>wc</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Date of Birth</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="dateOfBirth" [max]="maxDate">
                <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
              </mat-form-field>

              <p class="error-msg" *ngIf="error">{{ error }}</p>

              <button mat-raised-button color="primary" type="submit" class="full-width submit-btn"
                      [disabled]="registerForm.invalid || loading">
                <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
                <span *ngIf="!loading">Send Verification Code →</span>
              </button>
            </form>

            <p class="switch-link">Already registered? <a routerLink="/login">Login here</a></p>
          </div>

          <!-- ================= STEP 2: EMAIL OTP VERIFICATION ================= -->
          <div *ngIf="step === 'otp'" class="otp-view">
            <div class="mail-icon-wrap">
              <mat-icon class="huge-icon">mark_email_read</mat-icon>
            </div>

            <h2 class="card-heading">Verify College Email</h2>
            <p class="otp-instruction">
              We've sent a 6-digit verification code to:
              <br><strong class="highlight-email">{{ registerForm.get('email')?.value }}</strong>
            </p>

            <!-- Dev Test Helper Pill (when in free local testing mode) -->
            <div class="dev-otp-pill" *ngIf="devOtp">
              <mat-icon class="terminal-icon">code</mat-icon>
              <span>Dev Demo Code: <strong>{{ devOtp }}</strong></span>
            </div>

            <form (ngSubmit)="completeRegistration()">
              <div class="otp-field-container">
                <mat-form-field appearance="outline" class="otp-form-field">
                  <mat-label>Enter 6-Digit Code</mat-label>
                  <input matInput [(ngModel)]="enteredOtp" name="enteredOtp"
                         maxlength="6"
                         placeholder="123456"
                         class="otp-input-control"
                         autocomplete="one-time-code"
                         required>
                </mat-form-field>
              </div>

              <p class="error-msg" *ngIf="error">{{ error }}</p>
              <p class="success-msg" *ngIf="successMsg">{{ successMsg }}</p>

              <button mat-raised-button color="primary" type="submit" class="full-width submit-btn verify-btn"
                      [disabled]="!enteredOtp || enteredOtp.trim().length !== 6 || loading">
                <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
                <span *ngIf="!loading">Verify & Create Account ✅</span>
              </button>
            </form>

            <div class="resend-row">
              <span *ngIf="resendTimer > 0" class="timer-text">
                Resend code in <strong>{{ resendTimer }}s</strong>
              </span>
              <button *ngIf="resendTimer <= 0" mat-button class="resend-btn" (click)="requestOtp(true)" [disabled]="loading">
                <mat-icon>refresh</mat-icon>
                <span>Resend Code</span>
              </button>
            </div>

            <div class="back-link-wrap">
              <button mat-button class="edit-details-btn" (click)="step = 'details'; error = ''">
                ← Wrong email? Edit details
              </button>
            </div>
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
      max-width: 480px;
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

    .auth-header p {
      opacity: 0.92;
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
      margin: 0 0 4px 0;
    }

    .card-subheading {
      color: #64748b;
      font-size: 0.9rem;
      margin: 0;
    }

    .full-width {
      width: 100%;
      margin-bottom: 10px;
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
      color: #e11d48;
      font-size: 0.88rem;
      font-weight: 600;
      margin: 8px 0;
      padding: 8px 12px;
      background: #ffe4e6;
      border-radius: 8px;
    }

    .success-msg {
      color: #059669;
      font-size: 0.88rem;
      font-weight: 600;
      margin: 8px 0;
      padding: 8px 12px;
      background: #ecfdf5;
      border-radius: 8px;
    }

    .switch-link {
      margin-top: 20px;
      font-size: 0.9rem;
      color: #64748b;
    }

    .switch-link a {
      color: #c026d3;
      font-weight: 700;
      text-decoration: none;
    }

    /* Step 2 - OTP Specific Styles */
    .otp-view {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .mail-icon-wrap {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: #fdf2f8;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }

    .huge-icon {
      font-size: 38px;
      width: 38px;
      height: 38px;
      color: #db2777;
    }

    .otp-instruction {
      color: #475569;
      font-size: 0.95rem;
      margin: 8px 0 16px 0;
      line-height: 1.5;
    }

    .highlight-email {
      color: #0f172a;
      font-size: 1rem;
    }

    .dev-otp-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px dashed #93c5fd;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 16px;
    }

    .terminal-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .otp-field-container {
      width: 100%;
      max-width: 280px;
      margin: 0 auto;
    }

    .otp-form-field {
      width: 100%;
      text-align: center;
    }

    .otp-form-field ::ng-deep input {
      text-align: center;
      font-size: 1.8rem;
      font-weight: 800;
      letter-spacing: 8px;
      color: #0f172a;
    }

    .verify-btn {
      margin-top: 16px;
    }

    .resend-row {
      margin-top: 16px;
      font-size: 0.9rem;
    }

    .timer-text {
      color: #64748b;
    }

    .resend-btn {
      color: #c026d3 !important;
      font-weight: 700 !important;
    }

    .back-link-wrap {
      margin-top: 16px;
    }

    .edit-details-btn {
      color: #64748b !important;
      font-size: 0.85rem !important;
    }
  `]
})
export class RegisterComponent implements OnDestroy {
  registerForm: FormGroup;
  step: 'details' | 'otp' = 'details';
  loading = false;
  error = '';
  successMsg = '';
  showPass = false;
  maxDate = new Date();

  enteredOtp = '';
  devOtp = '';
  resendTimer = 0;
  private timerInterval: any = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.maxDate.setFullYear(this.maxDate.getFullYear() - 17);
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      gender: ['', Validators.required],
      dateOfBirth: ['', Validators.required]
    });
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  requestOtp(isResend = false): void {
    if (this.registerForm.invalid) return;

    this.loading = true;
    this.error = '';
    this.successMsg = '';
    const email = this.registerForm.get('email')?.value?.trim();

    this.authService.sendOtp(email).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.step = 'otp';
        this.devOtp = res.devOtp || '';
        this.startTimer(60);
        if (isResend) {
          this.successMsg = 'A fresh verification code has been sent!';
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err.error?.message || err.error || 'Failed to send verification code. Please check your email.';
      }
    });
  }

  completeRegistration(): void {
    if (!this.enteredOtp || this.enteredOtp.trim().length !== 6) {
      this.error = 'Please enter the 6-digit verification code';
      return;
    }

    this.loading = true;
    this.error = '';
    this.successMsg = '';

    const val = this.registerForm.value;
    const dob = val.dateOfBirth instanceof Date
      ? val.dateOfBirth.toISOString().split('T')[0]
      : new Date(val.dateOfBirth).toISOString().split('T')[0];

    const payload = {
      name: val.name,
      email: val.email,
      password: val.password,
      gender: val.gender,
      dateOfBirth: dob,
      otp: this.enteredOtp.trim()
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.loading = false;
        // User registered and logged in with PENDING status; redirect to discover/profile
        this.router.navigate(['/discover']);
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err.error?.message || err.error || 'Verification failed. Please enter the correct OTP.';
      }
    });
  }

  private startTimer(seconds: number): void {
    this.resendTimer = seconds;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.resendTimer--;
      if (this.resendTimer <= 0) {
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }
}
