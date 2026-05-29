import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CommentoDto } from '../components/dto/CommentoDto';
import { CommentoFormDto } from '../components/dto/CommentoFormDto';

@Injectable({
  providedIn: 'root'
})
export class CommentoService {
  private baseUrl = 'http://localhost:8080/api/commenti';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Crea un nuovo commento
  creaCommento(form: CommentoFormDto): Observable<CommentoDto> {
    return this.http.post<CommentoDto>(
      `${this.baseUrl}`,
      form,
      { headers: this.getHeaders() }
    );
  }

  // Aggiorna un commento esistente
  aggiornaCommento(idCommento: number, form: CommentoFormDto): Observable<CommentoDto> {
    return this.http.put<CommentoDto>(
      `${this.baseUrl}/${idCommento}`,
      form,
      { headers: this.getHeaders() }
    );
  }

  // Elimina un commento
  eliminaCommento(idCommento: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/${idCommento}`,
      { headers: this.getHeaders() }
    );
  }

  getMieiCommenti(): Observable<CommentoDto[]> {
    return this.http.get<CommentoDto[]>(
      `${this.baseUrl}/miei`,
      { headers: this.getHeaders() }
    );
  }
}
