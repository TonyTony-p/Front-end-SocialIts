import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SondaggioDto } from '../components/dto/SondaggioDto';

@Injectable({ providedIn: 'root' })
export class SondaggioService {
  private apiUrl = 'http://localhost:8080/api/sondaggi';

  constructor(private http: HttpClient) {}

  vota(idOpzione: number): Observable<SondaggioDto> {
    return this.http.post<SondaggioDto>(`${this.apiUrl}/vota/${idOpzione}`, {});
  }
}
