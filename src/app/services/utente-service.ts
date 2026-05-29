import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProfiloDto } from '../components/dto/ProfiloDto';
import { ProfiloFormDto } from '../components/dto/ProfiloFormDto';
import { CambiaPasswordDto } from '../components/dto/CambiaPasswordDto';
import { UtenteDto } from '../components/dto/UtenteDto';
import { UtenteFormDto } from '../components/dto/UtenteFormDto';

@Injectable({
  providedIn: 'root'
})
export class UtenteService {

  private apiUrl = 'http://localhost:8080/api/utenti';

  constructor(private http: HttpClient) {}

  getMyProfile(): Observable<UtenteDto> {
    return this.http.get<UtenteDto>(`${this.apiUrl}/my-profile`);
  }

  getProfilo(username: string): Observable<ProfiloDto> {
    return this.http.get<ProfiloDto>(`${this.apiUrl}/profilo/${username}`);
  }

  updateMyProfilo(form: ProfiloFormDto): Observable<ProfiloDto> {
    return this.http.put<ProfiloDto>(`${this.apiUrl}/my-profile`, form);
  }

  searchProfiles(query: string): Observable<ProfiloDto[]> {
    return this.http.get<ProfiloDto[]>(`${this.apiUrl}/search`, { params: { q: query } });
  }

  uploadFotoProfilo(file: File): Observable<ProfiloDto> {
    const formData = new FormData();
    formData.append('foto', file);
    return this.http.post<ProfiloDto>(`${this.apiUrl}/my-profile/foto`, formData);
  }

  cambiaPassword(dto: CambiaPasswordDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/me/password`, dto);
  }

  // ── Admin CRUD ────────────────────────────────────────────────────
  listaTutti(): Observable<UtenteDto[]> {
    return this.http.get<UtenteDto[]>(`${this.apiUrl}/tutti`);
  }

  crea(form: UtenteFormDto): Observable<UtenteDto> {
    return this.http.post<UtenteDto>(this.apiUrl, form);
  }

  aggiorna(form: UtenteFormDto): Observable<UtenteDto> {
    return this.http.put<UtenteDto>(this.apiUrl, form);
  }

  elimina(id: number): Observable<void> {
    return this.http.delete<void>(this.apiUrl, { body: { id } });
  }
}
