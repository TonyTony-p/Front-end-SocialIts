import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NotificaDto } from '../components/dto/NotificaDto';

@Injectable({ providedIn: 'root' })
export class NotificaService {
  private base = 'http://localhost:8080/api/notifiche';

  constructor(private http: HttpClient) {}

  getNotifiche(page = 0, size = 20): Observable<NotificaDto[]> {
    return this.http.get<NotificaDto[]>(`${this.base}?page=${page}&size=${size}`);
  }

  getContatore(): Observable<{ nonLette: number }> {
    return this.http.get<{ nonLette: number }>(`${this.base}/contatore`);
  }

  segnaComeLetta(id: number): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}/letta`, {});
  }

  segnaComeLetteTutte(): Observable<void> {
    return this.http.put<void>(`${this.base}/lette-tutte`, {});
  }

  elimina(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
