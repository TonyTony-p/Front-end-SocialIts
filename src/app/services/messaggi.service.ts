import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConversazioneDto, MessaggioDto } from '../components/dto/MessaggioDto';

@Injectable({ providedIn: 'root' })
export class MessaggiService {

    private base = 'http://localhost:8080/api/messaggi';

    constructor(private http: HttpClient) {}

    getConversazioni(): Observable<ConversazioneDto[]> {
        return this.http.get<ConversazioneDto[]>(`${this.base}/conversazioni`);
    }

    getConversazione(username: string): Observable<ConversazioneDto> {
        return this.http.get<ConversazioneDto>(`${this.base}/conversazioni/${username}`);
    }

    invia(username: string, testo: string, replyToId?: number | null): Observable<MessaggioDto> {
        return this.http.post<MessaggioDto>(`${this.base}/conversazioni/${username}`,
            { testo, replyToId: replyToId ?? null });
    }

    segnaComeLetti(username: string): Observable<void> {
        return this.http.put<void>(`${this.base}/conversazioni/${username}/letti`, {});
    }

    getNonLettiTotale(): Observable<{ nonLetti: number }> {
        return this.http.get<{ nonLetti: number }>(`${this.base}/nonletti`);
    }

    eliminaMessaggio(id: number): Observable<void> {
        return this.http.delete<void>(`${this.base}/${id}`);
    }

    toggleFissa(id: number, durationHours: number | null): Observable<MessaggioDto> {
        return this.http.put<MessaggioDto>(`${this.base}/${id}/fissa`,
            durationHours != null ? { durationHours } : {});
    }

    toggleImportante(id: number): Observable<MessaggioDto> {
        return this.http.put<MessaggioDto>(`${this.base}/${id}/importante`, {});
    }
}
