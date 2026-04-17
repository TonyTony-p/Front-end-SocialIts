// password-reset.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PasswordResetRequest {
  email: string;
}

export interface VerificaCodiceRequest {
  codice: string;
}

export interface NuovaPasswordRequest {
  codice: string;
  nuovaPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class PasswordResetService {
  private apiUrl = 'http://localhost:8080/api/auth'; 

  constructor(private http: HttpClient) {}

  richiestaResetPassword(request: PasswordResetRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/password-dimenticata`, request);
  }

  verificaCodice(request: VerificaCodiceRequest): Observable<boolean> {
    return this.http.post<boolean>(`${this.apiUrl}/verifica-codice`, request);
  }

  impostaNuovaPassword(request: NuovaPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/nuova-password`, request);
  }
}