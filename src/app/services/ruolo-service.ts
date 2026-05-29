import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RuoloDto } from '../components/dto/RuoloDto';
import { RuoloFormDto } from '../components/dto/RuoloFormDto';
import { PageResponse } from '../components/dto/PageResponse';

@Injectable({ providedIn: 'root' })
export class RuoloService {
  private base = 'http://localhost:8080/api/ruoli';

  constructor(private http: HttpClient) {}

  crea(form: RuoloFormDto): Observable<RuoloDto> {
    return this.http.post<RuoloDto>(this.base, form);
  }

  aggiorna(form: RuoloFormDto): Observable<RuoloDto> {
    return this.http.put<RuoloDto>(this.base, form);
  }

  elimina(id: number): Observable<void> {
    return this.http.delete<void>(this.base, { body: { id } });
  }

  getById(id: number): Observable<RuoloDto> {
    return this.http.get<RuoloDto>(`${this.base}/${id}`);
  }

  lista(page = 0, size = 20): Observable<PageResponse<RuoloDto>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<RuoloDto>>(this.base, { params });
  }

  listaTutti(): Observable<RuoloDto[]> {
    return this.http.get<RuoloDto[]>(`${this.base}/tutti`);
  }
}
