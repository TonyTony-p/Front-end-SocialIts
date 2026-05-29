import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GruppoDto } from '../components/dto/GruppoDto';
import { GruppoFormDto } from '../components/dto/GruppoFormDto';
import { PermessoDto } from '../components/dto/PermessoDto';
import { PageResponse } from '../components/dto/PageResponse';

export interface GruppoPermessiRequest {
  gruppoId: number;
  permessi: PermessoDto[];
}

@Injectable({ providedIn: 'root' })
export class GruppoService {
  private base = 'http://localhost:8080/api/gruppi';

  constructor(private http: HttpClient) {}

  crea(form: GruppoFormDto): Observable<GruppoDto> {
    return this.http.post<GruppoDto>(this.base, form);
  }

  aggiorna(form: GruppoFormDto): Observable<GruppoDto> {
    return this.http.put<GruppoDto>(this.base, form);
  }

  elimina(id: number): Observable<void> {
    return this.http.delete<void>(this.base, { body: { id } });
  }

  getById(id: number, withPermessi = false): Observable<GruppoDto> {
    const params = new HttpParams().set('withPermessi', withPermessi);
    return this.http.get<GruppoDto>(`${this.base}/${id}`, { params });
  }

  lista(page = 0, size = 20, withPermessi = false): Observable<PageResponse<GruppoDto>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('withPermessi', withPermessi);
    return this.http.get<PageResponse<GruppoDto>>(this.base, { params });
  }

  listaTutti(withPermessi = false): Observable<GruppoDto[]> {
    const params = new HttpParams().set('withPermessi', withPermessi);
    return this.http.get<GruppoDto[]>(`${this.base}/tutti`, { params });
  }

  associaPermessi(req: GruppoPermessiRequest): Observable<GruppoDto> {
    return this.http.post<GruppoDto>(`${this.base}/associa-permessi`, req);
  }

  dissociaPermessi(req: GruppoPermessiRequest): Observable<GruppoDto> {
    return this.http.post<GruppoDto>(`${this.base}/dissocia-permessi`, req);
  }
}
