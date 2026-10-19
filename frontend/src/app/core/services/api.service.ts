import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ── Auth ──────────────────────────────────────────────
  sendOtp(email: string): Observable<any> {
    return this.http.post(`${this.base}/auth/send-otp`, { email });
  }
  register(data: any): Observable<any> {
    return this.http.post(`${this.base}/auth/register`, data);
  }
  login(data: any): Observable<any> {
    return this.http.post(`${this.base}/auth/login`, data);
  }

  // ── Profile ───────────────────────────────────────────
  getMyProfile(): Observable<any> {
    return this.http.get(`${this.base}/profile/me`);
  }
  updateProfile(data: any): Observable<any> {
    return this.http.put(`${this.base}/profile/me`, data);
  }
  /** @deprecated use updateProfile */
  updateMyProfile(data: any): Observable<any> {
    return this.updateProfile(data);
  }
  uploadPhoto(file: File): Observable<any> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post(`${this.base}/profile/me/photo`, form);
  }
  deletePhoto(url: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/profile/me/photo?url=${encodeURIComponent(url)}`);
  }
  deleteMyAccount(): Observable<void> {
    return this.http.delete<void>(`${this.base}/profile/me`);
  }
  requestAccountDeletion(): Observable<any> {
    return this.http.post(`${this.base}/profile/me/request-deletion`, {});
  }
  cancelAccountDeletion(): Observable<any> {
    return this.http.post(`${this.base}/profile/me/cancel-deletion`, {});
  }
  getUserProfile(id: number): Observable<any> {
    return this.http.get(`${this.base}/profile/${id}`);
  }

  // ── Discovery ─────────────────────────────────────────
  getSwipeLimit(): Observable<any> {
    return this.http.get(`${this.base}/swipe/limit`);
  }
  getDiscoverUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/discover`);
  }
  /** @deprecated use getDiscoverUsers */
  discover(): Observable<any[]> {
    return this.getDiscoverUsers();
  }
  likeUser(userId: number): Observable<any> {
    return this.http.post(`${this.base}/swipe/${userId}/like`, {});
  }
  dislikeUser(userId: number): Observable<any> {
    return this.http.post(`${this.base}/swipe/${userId}/dislike`, {});
  }
  /** @deprecated use likeUser */
  like(userId: number): Observable<any> { return this.likeUser(userId); }
  /** @deprecated use dislikeUser */
  dislike(userId: number): Observable<any> { return this.dislikeUser(userId); }

  // ── Matches ───────────────────────────────────────────
  getMatches(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/matches`);
  }

  // ── Chat ──────────────────────────────────────────────
  getChatHistory(matchId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/chat/${matchId}`);
  }

  // ── Admin ─────────────────────────────────────────────
  adminGetUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/admin/users`);
  }
  adminActivate(id: number): Observable<void> {
    return this.http.put<void>(`${this.base}/admin/users/${id}/activate`, {});
  }
  adminDeactivate(id: number): Observable<void> {
    return this.http.put<void>(`${this.base}/admin/users/${id}/deactivate`, {});
  }
  adminDelete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/users/${id}`);
  }
  adminApproveUser(id: number): Observable<any> {
    return this.http.put(`${this.base}/admin/users/${id}/approve`, {});
  }
  adminRejectUser(id: number): Observable<any> {
    return this.http.put(`${this.base}/admin/users/${id}/reject`, {});
  }
  adminRejectDeletion(id: number): Observable<any> {
    return this.http.put(`${this.base}/admin/users/${id}/reject-deletion`, {});
  }
  adminSetUserLimit(userId: number, limit: number | null): Observable<any> {
    return this.http.put(`${this.base}/admin/users/${userId}/limit`, { limit });
  }

  // Admin Settings
  adminGetSettings(): Observable<any> {
    return this.http.get(`${this.base}/admin/settings`);
  }
  adminUpdateMatching(enabled: boolean, message: string): Observable<any> {
    return this.http.put(`${this.base}/admin/settings/matching`, { enabled, message });
  }
  adminUpdateDefaultLimit(limit: number): Observable<any> {
    return this.http.put(`${this.base}/admin/settings/limit`, { limit });
  }
  adminAddDomain(domain: string): Observable<any> {
    return this.http.post(`${this.base}/admin/settings/domains`, { domain });
  }
  adminRemoveDomain(domain: string): Observable<any> {
    return this.http.delete(`${this.base}/admin/settings/domains/${encodeURIComponent(domain)}`);
  }
}
