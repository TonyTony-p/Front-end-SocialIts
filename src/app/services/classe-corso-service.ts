import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ClasseCorsoDto, ClasseCorsoFormDto,
  IscrizioneClasseDto, AnnuncioDto, AllegatoAnnuncioInfo,
  MaterialeClasseDto, CompitoDto, ConsegnaCompitoDto, StatoIscrizione,
  CommentoAnnuncioDto, TipoMateriale
} from '../components/dto/ClasseCorsoDto';
import { PageResponse } from '../components/dto/PageResponse';
import { IstitutoDto, IstitutoFormDto } from '../components/dto/IstitutoDto';
import { UtenteDto } from '../components/dto/UtenteDto';

@Injectable({ providedIn: 'root' })
export class ClasseCorsoService {
  private base = 'http://localhost:8080/api/classi';
  private istitutoBase = 'http://localhost:8080/api/istituto';

  constructor(private http: HttpClient) {}

  // ── Classi ──────────────────────────────────────────────────

  creaClasse(form: ClasseCorsoFormDto): Observable<ClasseCorsoDto> {
    return this.http.post<ClasseCorsoDto>(this.base, form);
  }

  listaClassiPubbliche(page = 0, size = 20): Observable<PageResponse<ClasseCorsoDto>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<ClasseCorsoDto>>(this.base, { params });
  }

  getTopClassi(limit = 5): Observable<ClasseCorsoDto[]> {
    return this.http.get<ClasseCorsoDto[]>(`${this.base}/top?limit=${limit}`);
  }

  dettaglioClasse(id: number): Observable<ClasseCorsoDto> {
    return this.http.get<ClasseCorsoDto>(`${this.base}/${id}`);
  }

  aggiornaClasse(id: number, form: ClasseCorsoFormDto): Observable<ClasseCorsoDto> {
    return this.http.put<ClasseCorsoDto>(`${this.base}/${id}`, form);
  }

  eliminaClasse(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  mieClassi(): Observable<ClasseCorsoDto[]> {
    return this.http.get<ClasseCorsoDto[]>(`${this.base}/mie`);
  }

  listaClassiAdmin(): Observable<ClasseCorsoDto[]> {
    return this.http.get<ClasseCorsoDto[]>(`${this.base}/admin/tutte`);
  }

  // ── Iscrizioni ──────────────────────────────────────────────

  iscriviti(classeId: number): Observable<IscrizioneClasseDto> {
    return this.http.post<IscrizioneClasseDto>(`${this.base}/${classeId}/iscriviti`, {});
  }

  iscrivitiConCodice(codice: string): Observable<IscrizioneClasseDto> {
    return this.http.post<IscrizioneClasseDto>(`${this.base}/iscriviti-con-codice/${codice}`, {});
  }

  listaIscrizioni(classeId: number): Observable<IscrizioneClasseDto[]> {
    return this.http.get<IscrizioneClasseDto[]>(`${this.base}/${classeId}/iscrizioni`);
  }

  aggiornaIscrizione(classeId: number, iscrizioneId: number, stato: StatoIscrizione): Observable<IscrizioneClasseDto> {
    return this.http.put<IscrizioneClasseDto>(`${this.base}/${classeId}/iscrizioni/${iscrizioneId}`, { stato });
  }

  abbandona(classeId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${classeId}/abbandona`);
  }

  miIscrizioni(): Observable<IscrizioneClasseDto[]> {
    return this.http.get<IscrizioneClasseDto[]>(`${this.base}/mie-iscrizioni`);
  }

  listaStudenti(classeId: number): Observable<IscrizioneClasseDto[]> {
    return this.http.get<IscrizioneClasseDto[]>(`${this.base}/${classeId}/studenti`);
  }

  // ── Annunci ─────────────────────────────────────────────────

  creaAnnuncio(classeId: number, titolo: string, contenuto: string, allegati: AllegatoAnnuncioInfo[] = []): Observable<AnnuncioDto> {
    return this.http.post<AnnuncioDto>(`${this.base}/${classeId}/annunci`, { titolo, contenuto, allegati });
  }

  uploadAllegatoAnnuncio(classeId: number, file: File): Observable<AllegatoAnnuncioInfo> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<AllegatoAnnuncioInfo>(`${this.base}/${classeId}/annunci/upload`, fd);
  }

  listaAnnunci(classeId: number): Observable<AnnuncioDto[]> {
    return this.http.get<AnnuncioDto[]>(`${this.base}/${classeId}/annunci`);
  }

  eliminaAnnuncio(classeId: number, annuncioId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${classeId}/annunci/${annuncioId}`);
  }

  listaCommentiAnnuncio(classeId: number, annuncioId: number): Observable<CommentoAnnuncioDto[]> {
    return this.http.get<CommentoAnnuncioDto[]>(`${this.base}/${classeId}/annunci/${annuncioId}/commenti`);
  }

  aggiungiCommentoAnnuncio(classeId: number, annuncioId: number, testo: string): Observable<CommentoAnnuncioDto> {
    return this.http.post<CommentoAnnuncioDto>(`${this.base}/${classeId}/annunci/${annuncioId}/commenti`, { testo });
  }

  eliminaCommentoAnnuncio(classeId: number, annuncioId: number, commentoId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${classeId}/annunci/${annuncioId}/commenti/${commentoId}`);
  }

  // ── Materiali ────────────────────────────────────────────────

  caricaMateriale(classeId: number, form: { nome: string; url: string; tipo: TipoMateriale }): Observable<MaterialeClasseDto> {
    return this.http.post<MaterialeClasseDto>(`${this.base}/${classeId}/materiali`, form);
  }

  listaMateriali(classeId: number): Observable<MaterialeClasseDto[]> {
    return this.http.get<MaterialeClasseDto[]>(`${this.base}/${classeId}/materiali`);
  }

  eliminaMateriale(classeId: number, materialeId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${classeId}/materiali/${materialeId}`);
  }

  // ── Compiti ──────────────────────────────────────────────────

  creaCompito(classeId: number, form: { titolo: string; descrizione?: string; scadenza?: string; puntiMax?: number }): Observable<CompitoDto> {
    return this.http.post<CompitoDto>(`${this.base}/${classeId}/compiti`, form);
  }

  listaCompiti(classeId: number): Observable<CompitoDto[]> {
    return this.http.get<CompitoDto[]>(`${this.base}/${classeId}/compiti`);
  }

  aggiornaCompito(classeId: number, compitoId: number, form: { titolo: string; descrizione?: string; scadenza?: string; puntiMax?: number }): Observable<CompitoDto> {
    return this.http.put<CompitoDto>(`${this.base}/${classeId}/compiti/${compitoId}`, form);
  }

  eliminaCompito(classeId: number, compitoId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${classeId}/compiti/${compitoId}`);
  }

  // ── Consegne ─────────────────────────────────────────────────

  consegna(classeId: number, compitoId: number, form: { contenuto?: string; url?: string }): Observable<ConsegnaCompitoDto> {
    return this.http.post<ConsegnaCompitoDto>(`${this.base}/${classeId}/compiti/${compitoId}/consegna`, form);
  }

  listaConsegne(classeId: number, compitoId: number): Observable<ConsegnaCompitoDto[]> {
    return this.http.get<ConsegnaCompitoDto[]>(`${this.base}/${classeId}/compiti/${compitoId}/consegne`);
  }

  valutaConsegna(classeId: number, consegnaId: number, voto: number, feedback: string): Observable<ConsegnaCompitoDto> {
    return this.http.put<ConsegnaCompitoDto>(`${this.base}/${classeId}/consegne/${consegnaId}/valuta`, { voto, feedback });
  }

  // ── Istituti ─────────────────────────────────────────────────

  private istituti = 'http://localhost:8080/api/istituti';

  listaIstituti(): Observable<IstitutoDto[]> {
    return this.http.get<IstitutoDto[]>(this.istituti);
  }

  dettaglioIstituto(id: number): Observable<IstitutoDto> {
    return this.http.get<IstitutoDto>(`${this.istituti}/${id}`);
  }

  creaIstituto(form: IstitutoFormDto): Observable<IstitutoDto> {
    return this.http.post<IstitutoDto>(this.istituti, form);
  }

  aggiornaIstituto(id: number, form: IstitutoFormDto): Observable<IstitutoDto> {
    return this.http.put<IstitutoDto>(`${this.istituti}/${id}`, form);
  }

  eliminaIstituto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.istituti}/${id}`);
  }

  // ── Istituto (professori) ────────────────────────────────────

  creaProfessore(form: { nome: string; cognome: string; email: string; password: string }): Observable<UtenteDto> {
    return this.http.post<UtenteDto>(`${this.istitutoBase}/professori`, form);
  }

  listaProfessori(): Observable<UtenteDto[]> {
    return this.http.get<UtenteDto[]>(`${this.istitutoBase}/professori`);
  }

  aggiornaProfessore(id: number, form: { nome: string; cognome: string; email: string; username: string; password?: string }): Observable<UtenteDto> {
    return this.http.put<UtenteDto>(`${this.istitutoBase}/professori/${id}`, form);
  }
}
