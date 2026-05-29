import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RuoloDto } from '../components/dto/RuoloDto';
import { PermessoDto } from '../components/dto/PermessoDto';

export interface RuoloPermessoRequest {
  ruoloId: number;
  permesso: PermessoDto;
}

@Injectable({ providedIn: 'root' })
export class RuoloPermessoService {
  private base = 'http://localhost:8080/api/ruoli-permessi';

  constructor(private http: HttpClient) {}

  /** Restituisce tutti i permessi associati ad un ruolo. */
  getPermessiByRuolo(ruoloId: number): Observable<PermessoDto[]> {
    return this.http.get<PermessoDto[]>(`${this.base}/ruolo/${ruoloId}`);
  }

  /** Associa un permesso ad un ruolo. Restituisce il ruolo aggiornato. */
  associa(req: RuoloPermessoRequest): Observable<RuoloDto> {
    return this.http.post<RuoloDto>(this.base, req);
  }

  /** Dissocia un permesso da un ruolo. Restituisce il ruolo aggiornato. */
  dissocia(req: RuoloPermessoRequest): Observable<RuoloDto> {
    return this.http.delete<RuoloDto>(this.base, { body: req });
  }
}
