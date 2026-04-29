import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PostDto } from '../components/dto/PostDto';

@Injectable({ providedIn: 'root' })
export class SalvataggioService {
  private base = 'http://localhost:8080/api/salvati';

  constructor(private http: HttpClient) {}

  salva(postId: number): Observable<void> {
    return this.http.post<void>(`${this.base}/${postId}`, {});
  }

  rimuovi(postId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${postId}`);
  }

  mieiSalvataggi(): Observable<number[]> {
    return this.http.get<number[]>(`${this.base}/miei`);
  }

  mieiSalvataggiPosts(): Observable<PostDto[]> {
    return this.http.get<PostDto[]>(`${this.base}/miei/posts`);
  }
}
