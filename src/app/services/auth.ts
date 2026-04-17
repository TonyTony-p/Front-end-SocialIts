import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { isPlatformBrowser } from '@angular/common';
import { jwtDecode } from 'jwt-decode';
import { RegistrazioneRequest } from '../components/dto/RegistrazioneRequest';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:8080/api/auth';
  private platformId = inject(PLATFORM_ID);

  constructor(private http: HttpClient, private router: Router) {}

  register(request: RegistrazioneRequest): Observable<void> {
  return this.http.post<void>(`${this.apiUrl}/registrazione`, request);
}


  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (isPlatformBrowser(this.platformId)) {
          // Salva il token e i dati utente solo in browser
          localStorage.setItem('token', response.token);
          localStorage.setItem('utente', JSON.stringify(response));
        }
      })
    );
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('utente');
    }
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    const token = localStorage.getItem('token');
    return token != null && !this.isTokenExpired(token);
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem('token');
  }

  getCurrentUser(): any {
    if (!isPlatformBrowser(this.platformId)) return null;
    const user = localStorage.getItem('utente');
    return user ? JSON.parse(user) : null;
  }

    getCurrentUsername(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    const user = this.getCurrentUser();
    return user?.username || null;
  }

  private getDecodedToken(token: string): any {
    try {
      return jwtDecode(token);
    } catch (e) {
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    const decoded = this.getDecodedToken(token);
    if (!decoded || !decoded.exp) return true;
    return (decoded.exp * 1000) < Date.now();
  }
}
