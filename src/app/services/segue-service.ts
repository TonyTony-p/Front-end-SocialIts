import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SegueService {
  private apiUrl = 'http://localhost:8080/api/segui';

  constructor(private http: HttpClient) {}

  segui(username: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${username}`, {});
  }

  smettiDiSeguire(username: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${username}`);
  }
}
