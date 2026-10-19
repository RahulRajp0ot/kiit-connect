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
  sendForgotPasswordOtp(email: string): Observable<any> {
    return this.http.post(`${this.base}/auth/forgot-password/send-otp`, { email });
  }
  resetPassword(data: { email: string; otp: string; newPassword: string }): Observable<any> {
    return this.http.post(`${this.base}/auth/forgot-password/reset`, data);
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
  sendChatMessage(matchId: number, content: string): Observable<any> {
    return this.http.post<any>(`${this.base}/chat/${matchId}/message`, { content });
  }

  appealReview(): Observable<any> {
    return this.http.post<any>(`${this.base}/profile/me/appeal`, {});
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
  adminRejectUser(id: number, reason?: string): Observable<any> {
    return this.http.put(`${this.base}/admin/users/${id}/reject`, { reason });
  }
  adminSetUserRole(id: number, role: string): Observable<any> {
    return this.http.put(`${this.base}/admin/users/${id}/role`, { role });
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
  adminUpdateSpeedChatToggle(enabled: boolean, message: string): Observable<any> {
    return this.http.put(`${this.base}/admin/settings/speed-chat-toggle`, { enabled, message });
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

  // Admin User Profile Management
  adminGetUser(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/admin/users/${id}`);
  }
  adminUpdateUserProfile(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.base}/admin/users/${id}/profile`, data);
  }
  adminUploadUserPhoto(id: number, file: File): Observable<{ photoUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ photoUrl: string }>(`${this.base}/admin/users/${id}/photos`, formData);
  }
  adminDeleteUserPhoto(id: number, photoUrl: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/users/${id}/photos`, { params: { url: photoUrl } });
  }

  // ── Speed Chat (Random Anonymous Matching) ─────────────
  getSpeedChatStatus(): Observable<any> {
    return this.http.get<any>(`${this.base}/speed-chat/status`);
  }
  speedChatFindMatch(tempName: string, age: number): Observable<any> {
    return this.http.post<any>(`${this.base}/speed-chat/find`, { tempName, age });
  }
  speedChatCancel(): Observable<void> {
    return this.http.post<void>(`${this.base}/speed-chat/cancel`, {});
  }
  speedChatSendMessage(sessionUuid: string, content: string, imageUrl?: string): Observable<any> {
    return this.http.post<any>(`${this.base}/speed-chat/${sessionUuid}/message`, { content, imageUrl });
  }
  speedChatSendPhoto(sessionUuid: string, file: File, content?: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (content) formData.append('content', content);
    return this.http.post<any>(`${this.base}/speed-chat/${sessionUuid}/photo`, formData);
  }
  speedChatLeave(sessionUuid: string): Observable<void> {
    return this.http.post<void>(`${this.base}/speed-chat/${sessionUuid}/leave`, {});
  }
  speedChatGetMessages(sessionUuid: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/speed-chat/${sessionUuid}/messages`);
  }

  // Admin Speed Chat Audit & Controls
  adminGetSpeedChatSessions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/admin/speed-chat/sessions`);
  }
  adminGetSpeedChatMessages(sessionUuid: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/admin/speed-chat/sessions/${sessionUuid}/messages`);
  }
  adminBreakSpeedChatSession(sessionUuid: string): Observable<void> {
    return this.http.post<void>(`${this.base}/admin/speed-chat/sessions/${sessionUuid}/break`, {});
  }
  adminSetUserSpeedLimit(userId: number, limit: number | null): Observable<any> {
    return this.http.put(`${this.base}/admin/users/${userId}/speed-chat-limit`, { limit });
  }
  adminUpdateDefaultSpeedLimit(limit: number): Observable<any> {
    return this.http.put(`${this.base}/admin/settings/speed-chat-limit`, { limit });
  }

  // ── Campus Feed / Posts (Photo with Quotes) ────────────
  getPosts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/posts`);
  }
  createPost(quote?: string, file?: File): Observable<any> {
    const formData = new FormData();
    formData.append('quote', quote || '');
    if (file) {
      formData.append('file', file);
    }
    return this.http.post<any>(`${this.base}/posts`, formData);
  }
  togglePostLike(id: number): Observable<any> {
    return this.http.post<any>(`${this.base}/posts/${id}/like`, {});
  }
  deletePost(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/posts/${id}`);
  }

  // ── Admin Match Approvals (Mutual Likes) ─────────────
  adminGetPendingMatches(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/admin/matches/pending`);
  }
  adminApproveMatch(matchId: number): Observable<any> {
    return this.http.put<any>(`${this.base}/admin/matches/${matchId}/approve`, {});
  }
  adminRejectMatch(matchId: number): Observable<void> {
    return this.http.put<void>(`${this.base}/admin/matches/${matchId}/reject`, {});
  }
}
