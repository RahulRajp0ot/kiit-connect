import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
import { MatStepperModule } from '@angular/material/stepper';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink,
            MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule,
            MatIconModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule,
            MatProgressSpinnerModule, MatStepperModule],
  template: `
    <div class="auth-bg">
      <div class="auth-container">
        <div class="auth-header">
          <div class="heart-icon">💕</div>
          <h1>KIIT Connect</h1>
          <p>Create your KIIT dating profile</p>
        </div>
        <mat-card class="auth-card">
          <mat-card-title>Join KIIT Connect</mat-card-title>
          <mat-card-content>
            <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Full Name</mat-label>
                <input matInput formControlName="name" placeholder="Your Name">
                <mat-icon matSuffix>badge</mat-icon>
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>KIIT Email</mat-label>
                <input matInput formControlName="email" type="email" placeholder="you@kiit.ac.in">
                <mat-icon matSuffix>email</mat-icon>
                <mat-error *ngIf="registerForm.get('email')?.hasError('pattern')">
                  Only &#64;kiit.ac.in email addresses allowed
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
                <input matInput [matDatepicker]="picker" formControlName="dateOfBirth">
                <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
              </mat-form-field>
              <p class="error-msg" *ngIf="error">{{ error }}</p>
              <button mat-raised-button color="primary" type="submit" class="full-width submit-btn"
                      [disabled]="registerForm.invalid || loading">
                <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
                <span *ngIf="!loading">Create Account</span>
              </button>
            </form>
            <p class="switch-link">Already have an account? <a routerLink="/login">Login</a></p>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .auth-bg {
      min-height: 100vh;
      background: linear-gradient(135deg, #e91e8c 0%, #9c27b0 50%, #3f51b5 100%);
      display: flex; align-items: center; justify-content: center;
    }
    .auth-container { text-align: center; width: 100%; max-width: 480px; padding: 20px; }
    .auth-header { color: white; margin-bottom: 24px; }
    .heart-icon { font-size: 3rem; }
    .auth-header h1 { margin: 8px 0; font-size: 2rem; font-weight: 800; }
    .auth-header p { opacity: 0.9; }
    .auth-card { padding: 24px; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .full-width { width: 100%; margin-bottom: 8px; }
    .submit-btn { height: 48px; font-size: 1rem; font-weight: 600; border-radius: 8px; margin-top: 8px; }
    .error-msg { color: #e91e63; font-size: 0.85rem; }
    .switch-link { margin-top: 16px; } .switch-link a { color: #9c27b0; font-weight: 600; }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  error = '';
  showPass = false;
  maxDate = new Date();

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.maxDate.setFullYear(this.maxDate.getFullYear() - 17);
    this.registerForm = fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@kiit\.ac\.in$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      gender: ['', Validators.required],
      dateOfBirth: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;
    this.loading = true; this.error = '';
    const val = this.registerForm.value;
    const payload = { ...val, dateOfBirth: val.dateOfBirth.toISOString().split('T')[0] };
    this.authService.register(payload).subscribe({
      next: () => { this.loading = false; this.router.navigate(['/profile']); },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Registration failed. Please try again.';
      }
    });
  }
}
