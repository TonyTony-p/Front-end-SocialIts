import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PermessoDto } from '../components/dto/PermessoDto';
import { PermessoFormDto } from '../components/dto/PermessoFormDto';
import { PageResponse } from '../components/dto/PageResponse';

@Injectable({ providedIn: 'root' })
export class PermessoService {
  private base = 'http://localhost:8080/api/permessi';

  constructor(private http: HttpClient) {}

  crea(form: PermessoFormDto): Observable<PermessoDto> {
    return this.http.post<PermessoDto>(this.base, form);
  }

  aggiorna(form: PermessoFormDto): Observable<PermessoDto> {
    return this.http.put<PermessoDto>(this.base, form);
  }

  elimina(id: number): Observable<void> {
    return this.http.delete<void>(this.base, { body: { id } });
  }

  getById(id: number): Observable<PermessoDto> {
    return this.http.get<PermessoDto>(`${this.base}/${id}`);
  }

  lista(page = 0, size = 20): Observable<PageResponse<PermessoDto>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<PermessoDto>>(this.base, { params });
  }

  listaTutti(): Observable<PermessoDto[]> {
    return this.http.get<PermessoDto[]>(`${this.base}/tutti`);
  }
}
