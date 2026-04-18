import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProfiloDto } from '../components/dto/ProfiloDto';
import { ProfiloFormDto } from '../components/dto/ProfiloFormDto';

@Injectable({
  providedIn: 'root'
})
export class UtenteService {

  private apiUrl = 'http://localhost:8080/api/utenti';

  constructor(private http: HttpClient) {}

  getProfilo(username: string): Observable<ProfiloDto> {
    return this.http.get<ProfiloDto>(`${this.apiUrl}/profilo/${username}`);
  }

  updateMyProfilo(form: ProfiloFormDto): Observable<ProfiloDto> {
    return this.http.put<ProfiloDto>(`${this.apiUrl}/my-profile`, form);
  }
}
