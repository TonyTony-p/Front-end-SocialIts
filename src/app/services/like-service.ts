import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { AuthService } from './auth';
import { LikeFormDto } from '../components/dto/LikeFormDto';

@Injectable({ providedIn: 'root' })
export class LikeService {
  private baseUrl = 'http://localhost:8080/api/likes';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token || ''}`
    });
  }

  creaLike(postId: number): Observable<any> {
    const payload: LikeFormDto = { idPost: postId };
    return this.http.post(this.baseUrl, payload, { headers: this.getAuthHeaders() });
  }

  rimuoviLike(postId: number): Observable<any> {
    const payload: LikeFormDto = { idPost: postId };
    return this.http.delete(this.baseUrl, { 
      headers: this.getAuthHeaders(), 
      body: payload 
    });
  }

  getMieiLike(): Observable<any> {
    return this.http.get(`${this.baseUrl}/miei`, { headers: this.getAuthHeaders() });
  }
}
