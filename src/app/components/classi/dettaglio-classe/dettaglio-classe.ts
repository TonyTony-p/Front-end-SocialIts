import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { ClasseCorsoService } from '../../../services/classe-corso-service';
import { AuthService } from '../../../services/auth';
import {
  ClasseCorsoDto, AnnuncioDto, MaterialeClasseDto,
  CompitoDto, ConsegnaCompitoDto, IscrizioneClasseDto, AllegatoAnnuncioInfo,
  CommentoAnnuncioDto
} from '../../dto/ClasseCorsoDto';

type Tab = 'bacheca' | 'lavori' | 'persone' | 'materiali';
type FilterLavori = 'tutti' | 'aperti' | 'scaduti';
type UrgenzaCompito = 'ok' | 'urgent' | 'over';

@Component({
  selector: 'app-dettaglio-classe',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dettaglio-classe.html',
  styleUrls: ['./dettaglio-classe.css']
})
export class DettaglioClasseComponent implements OnInit {
  classeId = signal(0);
  classe = signal<ClasseCorsoDto | null>(null);
  activeTab = signal<Tab>('bacheca');
  loading = signal(true);
  error = signal('');
  currentUsername = signal('');
  isProfessore = signal(false);

  annunci = signal<AnnuncioDto[]>([]);
  materiali = signal<MaterialeClasseDto[]>([]);
  compiti = signal<CompitoDto[]>([]);
  consegne = signal<ConsegnaCompitoDto[]>([]);
  iscrizioni = signal<IscrizioneClasseDto[]>([]);

  composerOpen = signal(false);
  composerTitolo = signal('');
  composerContenuto = signal('');
  composerPublishing = signal(false);
  composerUploading = signal(false);
  composerError = signal('');
  composerAllegati = signal<AllegatoAnnuncioInfo[]>([]);
  linkInputOpen = signal(false);
  linkInputUrl = signal('');

  filterLavori = signal<FilterLavori>('tutti');

  mostraFormMateriale = signal(false);
  formMateriale = signal({ nome: '', url: '', tipo: 'LINK' });
  mostraFormCompito = signal(false);
  formCompito = signal({ titolo: '', descrizione: '', scadenza: '', puntiMax: undefined as number | undefined });
  compitoSelezionato = signal<CompitoDto | null>(null);

  copiedCode = signal(false);
  likedPosts = signal<number[]>([]);
  commentiMap = signal<Record<number, CommentoAnnuncioDto[]>>({});
  commentiOpenIds = signal<number[]>([]);
  commentiInput = signal<Record<number, string>>({});
  commentiSending = signal<number[]>([]);

  studentiApprovati = computed(() => this.iscrizioni().filter(i => i.stato === 'APPROVATA'));
  studentiInAttesa = computed(() => this.iscrizioni().filter(i => i.stato === 'IN_ATTESA'));

  compitiFiltrati = computed(() => {
    const filter = this.filterLavori();
    const now = new Date();
    return this.compiti().filter(c => {
      if (filter === 'aperti') return !c.scadenza || new Date(c.scadenza) >= now;
      if (filter === 'scaduti') return !!c.scadenza && new Date(c.scadenza) < now;
      return true;
    });
  });

  prossimiCompiti = computed(() => {
    const now = new Date();
    return this.compiti()
      .filter(c => c.scadenza && new Date(c.scadenza) >= now)
      .sort((a, b) => new Date(a.scadenza!).getTime() - new Date(b.scadenza!).getTime())
      .slice(0, 3);
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private classeService: ClasseCorsoService,
    private authService: AuthService
  ) {}

  goBack() {
    this.location.back();
  }

  private likesStorageKey() { return `liked_annunci_${this.currentUsername()}`; }

  private loadLikesFromStorage() {
    try { return JSON.parse(localStorage.getItem(this.likesStorageKey()) || '[]') as number[]; }
    catch { return []; }
  }

  private saveLikesToStorage(ids: number[]) {
    localStorage.setItem(this.likesStorageKey(), JSON.stringify(ids));
  }

  ngOnInit() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.classeId.set(id);
    const user = this.authService.getCurrentUser();
    this.currentUsername.set(user?.username || '');
    this.likedPosts.set(this.loadLikesFromStorage());

    this.classeService.dettaglioClasse(id).subscribe({
      next: c => {
        this.classe.set(c);
        this.isProfessore.set(c.professoreUsername === this.currentUsername());
        this.loading.set(false);
        this.loadAllData();
      },
      error: () => {
        this.error.set('Errore nel caricamento della classe');
        this.loading.set(false);
      }
    });
  }

  private loadAllData() {
    const id = this.classeId();
    this.classeService.listaAnnunci(id).subscribe({ next: d => this.annunci.set(d), error: () => {} });
    this.classeService.listaCompiti(id).subscribe({ next: d => this.compiti.set(d), error: () => {} });
    this.classeService.listaMateriali(id).subscribe({ next: d => this.materiali.set(d), error: () => {} });
    if (this.isProfessore()) {
      this.classeService.listaIscrizioni(id).subscribe({ next: d => this.iscrizioni.set(d), error: () => {} });
    } else {
      this.classeService.listaStudenti(id).subscribe({ next: d => this.iscrizioni.set(d), error: () => {} });
    }
  }

  setTab(tab: Tab) {
    this.activeTab.set(tab);
  }

  pubblicaAnnuncio() {
    const titolo = this.composerTitolo().trim();
    if (!titolo || this.composerPublishing()) return;
    this.composerPublishing.set(true);
    this.composerError.set('');
    this.classeService.creaAnnuncio(this.classeId(), titolo, this.composerContenuto(), this.composerAllegati()).subscribe({
      next: a => {
        this.annunci.update(list => [a, ...list]);
        this.composerTitolo.set('');
        this.composerContenuto.set('');
        this.composerAllegati.set([]);
        this.linkInputOpen.set(false);
        this.linkInputUrl.set('');
        this.composerOpen.set(false);
        this.composerPublishing.set(false);
      },
      error: () => {
        this.composerError.set('Errore durante la pubblicazione. Riprova.');
        this.composerPublishing.set(false);
      }
    });
  }

  onFileSelected(event: Event, tipo: 'IMAGE' | 'DOCUMENT') {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = '';
    this.composerUploading.set(true);
    this.composerError.set('');
    this.classeService.uploadAllegatoAnnuncio(this.classeId(), file).subscribe({
      next: allegato => {
        this.composerAllegati.update(list => [...list, allegato]);
        this.composerUploading.set(false);
      },
      error: () => {
        this.composerError.set('Errore nel caricamento del file.');
        this.composerUploading.set(false);
      }
    });
  }

  aggiungiLink() {
    const url = this.linkInputUrl().trim();
    if (!url) return;
    const nome = url.replace(/^https?:\/\//, '').split('/')[0];
    this.composerAllegati.update(list => [...list, { nome, url, tipo: 'LINK' }]);
    this.linkInputUrl.set('');
    this.linkInputOpen.set(false);
  }

  rimuoviAllegato(index: number) {
    this.composerAllegati.update(list => list.filter((_, i) => i !== index));
  }

  getAllegatoIcon(tipo: string): string {
    if (tipo === 'IMAGE') return 'pi-image';
    if (tipo === 'LINK') return 'pi-link';
    return 'pi-file';
  }

  getAttachmentHref(url: string): string {
    if (url.startsWith('/')) return `http://localhost:8080${url}`;
    return url;
  }

  eliminaAnnuncio(id: number) {
    this.classeService.eliminaAnnuncio(this.classeId(), id).subscribe({
      next: () => this.annunci.update(list => list.filter(a => a.id !== id))
    });
  }

  salvaMateriale() {
    const f = this.formMateriale();
    if (!f.nome || !f.url) return;
    this.classeService.caricaMateriale(this.classeId(), f).subscribe({
      next: m => {
        this.materiali.update(list => [m, ...list]);
        this.formMateriale.set({ nome: '', url: '', tipo: 'LINK' });
        this.mostraFormMateriale.set(false);
      }
    });
  }

  eliminaMateriale(id: number) {
    this.classeService.eliminaMateriale(this.classeId(), id).subscribe({
      next: () => this.materiali.update(list => list.filter(m => m.id !== id))
    });
  }

  salvaCompito() {
    const f = this.formCompito();
    if (!f.titolo.trim()) return;
    this.classeService.creaCompito(this.classeId(), f).subscribe({
      next: c => {
        this.compiti.update(list => [c, ...list]);
        this.formCompito.set({ titolo: '', descrizione: '', scadenza: '', puntiMax: undefined });
        this.mostraFormCompito.set(false);
      }
    });
  }

  apriConsegne(compito: CompitoDto) {
    if (!this.isProfessore()) return;
    const same = this.compitoSelezionato()?.id === compito.id;
    this.compitoSelezionato.set(same ? null : compito);
    if (!same) {
      this.classeService.listaConsegne(this.classeId(), compito.id).subscribe({ next: c => this.consegne.set(c) });
    }
  }

  approvaIscrizione(iscrizioneId: number) {
    this.classeService.aggiornaIscrizione(this.classeId(), iscrizioneId, 'APPROVATA').subscribe({
      next: upd => this.iscrizioni.update(list => list.map(i => i.id === iscrizioneId ? upd : i))
    });
  }

  rifiutaIscrizione(iscrizioneId: number) {
    this.classeService.aggiornaIscrizione(this.classeId(), iscrizioneId, 'RIFIUTATA').subscribe({
      next: upd => this.iscrizioni.update(list => list.map(i => i.id === iscrizioneId ? upd : i))
    });
  }

  copyCode() {
    const code = this.classe()?.codiceInvito;
    if (!code) return;
    navigator.clipboard?.writeText(code);
    this.copiedCode.set(true);
    setTimeout(() => this.copiedCode.set(false), 1400);
  }

  toggleLike(postId: number) {
    this.likedPosts.update(ids => {
      const next = ids.includes(postId) ? ids.filter(id => id !== postId) : [...ids, postId];
      this.saveLikesToStorage(next);
      return next;
    });
  }

  toggleComments(annuncioId: number) {
    const isOpen = this.commentiOpenIds().includes(annuncioId);
    if (isOpen) {
      this.commentiOpenIds.update(ids => ids.filter(id => id !== annuncioId));
    } else {
      this.commentiOpenIds.update(ids => [...ids, annuncioId]);
      if (!this.commentiMap()[annuncioId]) {
        this.classeService.listaCommentiAnnuncio(this.classeId(), annuncioId).subscribe({
          next: list => this.commentiMap.update(m => ({ ...m, [annuncioId]: list })),
          error: () => this.commentiMap.update(m => ({ ...m, [annuncioId]: [] }))
        });
      }
    }
  }

  inviaCommento(annuncioId: number) {
    const testo = (this.commentiInput()[annuncioId] || '').trim();
    if (!testo || this.commentiSending().includes(annuncioId)) return;
    this.commentiSending.update(ids => [...ids, annuncioId]);
    this.classeService.aggiungiCommentoAnnuncio(this.classeId(), annuncioId, testo).subscribe({
      next: c => {
        this.commentiMap.update(m => ({ ...m, [annuncioId]: [...(m[annuncioId] || []), c] }));
        this.commentiInput.update(inp => ({ ...inp, [annuncioId]: '' }));
        this.commentiSending.update(ids => ids.filter(id => id !== annuncioId));
      },
      error: () => this.commentiSending.update(ids => ids.filter(id => id !== annuncioId))
    });
  }

  eliminaCommento(annuncioId: number, commentoId: number) {
    this.classeService.eliminaCommentoAnnuncio(this.classeId(), annuncioId, commentoId).subscribe({
      next: () => this.commentiMap.update(m => ({
        ...m, [annuncioId]: (m[annuncioId] || []).filter(c => c.id !== commentoId)
      }))
    });
  }

  isLiked(postId: number) { return this.likedPosts().includes(postId); }
  isCommentsOpen(annuncioId: number) { return this.commentiOpenIds().includes(annuncioId); }
  getCommenti(annuncioId: number) { return this.commentiMap()[annuncioId] ?? null; }
  getCommentoInput(annuncioId: number) { return this.commentiInput()[annuncioId] ?? ''; }
  isCommentoSending(annuncioId: number) { return this.commentiSending().includes(annuncioId); }
  setCommentoInput(annuncioId: number, value: string) {
    this.commentiInput.update(m => ({ ...m, [annuncioId]: value }));
  }

  getNumeroCommenti(annuncioId: number, baseCount: number): number {
    const loaded = this.commentiMap()[annuncioId];
    return loaded !== undefined ? loaded.length : baseCount;
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  }

  getAvatarColor(seed: string): string {
    const colors = ['warm', 'lime', 'violet', 'rose', 'sky'];
    let hash = 0;
    for (const c of (seed || '')) hash = (hash * 31 + c.charCodeAt(0)) % colors.length;
    return colors[Math.abs(hash)];
  }

  getScadenzaUrgency(scadenza?: string): UrgenzaCompito {
    if (!scadenza) return 'ok';
    const diff = new Date(scadenza).getTime() - Date.now();
    if (diff < 0) return 'over';
    if (diff < 3 * 24 * 60 * 60 * 1000) return 'urgent';
    return 'ok';
  }

  getScadenzaDay(scadenza?: string): string {
    return scadenza ? new Date(scadenza).getDate().toString() : '—';
  }

  getScadenzaMonth(scadenza?: string): string {
    return scadenza
      ? new Date(scadenza).toLocaleDateString('it-IT', { month: 'short' }).toUpperCase()
      : '';
  }

  getMaterialeIcon(tipo: string, url: string): string {
    if (tipo === 'FILE') {
      if (url?.toLowerCase().endsWith('.pdf')) return 'pi-file-pdf';
      if (url?.toLowerCase().match(/\.(doc|docx)$/)) return 'pi-file-word';
      if (url?.toLowerCase().match(/\.(mp4|avi|mov|mkv)$/)) return 'pi-video';
      return 'pi-file';
    }
    return 'pi-link';
  }

  getMaterialeIconClass(tipo: string, url: string): string {
    if (tipo === 'FILE') {
      if (url?.toLowerCase().endsWith('.pdf')) return 'pdf';
      if (url?.toLowerCase().match(/\.(doc|docx)$/)) return 'doc';
      if (url?.toLowerCase().match(/\.(mp4|avi|mov|mkv)$/)) return 'video';
      return '';
    }
    return 'link';
  }

  updateCompitoTitolo(val: string) { this.formCompito.update(f => ({ ...f, titolo: val })); }
  updateCompitoDescrizione(val: string) { this.formCompito.update(f => ({ ...f, descrizione: val })); }
  updateCompitoScadenza(val: string) { this.formCompito.update(f => ({ ...f, scadenza: val })); }
  updateCompioPuntiMax(val: any) { this.formCompito.update(f => ({ ...f, puntiMax: val ? Number(val) : undefined })); }
  updateMaterialeNome(val: string) { this.formMateriale.update(f => ({ ...f, nome: val })); }
  updateMaterialeUrl(val: string) { this.formMateriale.update(f => ({ ...f, url: val })); }
  updateMaterialeTipo(val: string) { this.formMateriale.update(f => ({ ...f, tipo: val })); }
}
