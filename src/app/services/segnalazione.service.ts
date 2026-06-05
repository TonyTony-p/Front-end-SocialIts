import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SegnalazioneDto, SegnalazioneFormDto } from '../components/dto/SegnalazioneDto';

@Injectable({ providedIn: 'root' })
export class SegnalazioneService {
  private readonly url = 'http://localhost:8080/api/segnalazioni';

  constructor(private http: HttpClient) {}

  segnala(form: SegnalazioneFormDto): Observable<SegnalazioneDto> {
    return this.http.post<SegnalazioneDto>(this.url, form);
  }
}
