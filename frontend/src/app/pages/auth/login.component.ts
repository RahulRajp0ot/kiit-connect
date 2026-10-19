import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink,
            MatCardModule, MatFormFieldModule, MatInputModule,
            MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="auth-bg">
      <div class="auth-container">
        <div class="auth-header">
          <div class="heart-icon">💕</div>
          <h1>KIIT Connect</h1>
          <p>Find your match at KIIT University</p>
        </div>
        <mat-card class="auth-card">
          <mat-card-title>Welcome Back</mat-card-title>
          <mat-card-content>
            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>KIIT Email</mat-label>
                <input matInput formControlName="email" type="email" placeholder="you@kiit.ac.in">
                <mat-icon matSuffix>email</mat-icon>
                <mat-error *ngIf="loginForm.get('email')?.hasError('required')">Email is required</mat-error>
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Password</mat-label>
                <input matInput formControlName="password" [type]="showPass ? 'text' : 'password'">
                <button mat-icon-button matSuffix type="button" (click)="showPass = !showPass">
                  <mat-icon>{{ showPass ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </mat-form-field>
              <p class="error-msg" *ngIf="error">{{ error }}</p>
              <button mat-raised-button color="primary" type="submit" class="full-width submit-btn"
                      [disabled]="loginForm.invalid || loading">
                <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
                <span *ngIf="!loading">Login</span>
              </button>
            </form>
            <p class="switch-link">New to KIIT Connect? <a routerLink="/register">Register</a></p>
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
    .auth-container { text-align: center; width: 100%; max-width: 420px; padding: 20px; }
    .auth-header { color: white; margin-bottom: 24px; }
    .heart-icon { font-size: 3rem; }
    .auth-header h1 { margin: 8px 0; font-size: 2rem; font-weight: 800; }
    .auth-header p { opacity: 0.9; }
    .auth-card { padding: 24px; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .full-width { width: 100%; margin-bottom: 12px; }
    .submit-btn { height: 48px; font-size: 1rem; font-weight: 600; border-radius: 8px; }
    .error-msg { color: #e91e63; margin: -8px 0 8px; font-size: 0.85rem; }
    .switch-link { margin-top: 16px; } .switch-link a { color: #9c27b0; font-weight: 600; }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  error = '';
  showPass = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
    if (authService.isLoggedIn()) router.navigate(['/discover']);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;
    this.loading = true; this.error = '';
    const { email, password } = this.loginForm.value;
    this.authService.login(email, password).subscribe({
      next: (res) => {
        this.loading = false;
        this.router.navigate([res.profileComplete ? '/discover' : '/profile']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Login failed. Please try again.';
      }
    });
  }
}
