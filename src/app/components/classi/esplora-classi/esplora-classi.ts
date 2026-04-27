import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClasseCorsoService } from '../../../services/classe-corso-service';
import { ClasseCorsoDto, IscrizioneClasseDto } from '../../dto/ClasseCorsoDto';

@Component({
  selector: 'app-esplora-classi',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './esplora-classi.html',
  styleUrls: ['./esplora-classi.css']
})
export class EsploraClassiComponent implements OnInit {
  classi = signal<ClasseCorsoDto[]>([]);
  loading = signal(true);
  error = signal('');

  page = signal(0);
  totalPages = signal(0);

  codiceInvito = signal('');
  codiceLoading = signal(false);
  codiceError = signal('');
  codiceSuccess = signal('');

  iscrizioniInCorso = signal<Set<number>>(new Set());
  iscrizioneRiuscita = signal<Map<number, IscrizioneClasseDto>>(new Map());
  iscrizioneErrore = signal<Map<number, string>>(new Map());

  constructor(
    private classeService: ClasseCorsoService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadClassi();
    this.loadMieIscrizioni();
  }

  loadClassi() {
    this.loading.set(true);
    this.classeService.listaClassiPubbliche(this.page(), 12).subscribe({
      next: (res) => {
        this.classi.set(res.content ?? res);
        this.totalPages.set(res.totalPages ?? 1);
        this.loading.set(false);
      },
      error: () => { this.error.set('Errore nel caricamento delle classi'); this.loading.set(false); }
    });
  }

  loadMieIscrizioni() {
    this.classeService.miIscrizioni().subscribe({
      next: (iscrizioni) => {
        const map = new Map<number, IscrizioneClasseDto>();
        iscrizioni.forEach(i => map.set(i.classeId, i));
        this.iscrizioneRiuscita.set(map);
      },
      error: () => {}
    });
  }

  iscriviti(classe: ClasseCorsoDto) {
    if (this.iscrizioniInCorso().has(classe.id)) return;
    this.iscrizioniInCorso.update(s => { const ns = new Set(s); ns.add(classe.id); return ns; });
    this.iscrizioneErrore.update(m => { const nm = new Map(m); nm.delete(classe.id); return nm; });
    this.classeService.iscriviti(classe.id).subscribe({
      next: (iscr) => {
        this.iscrizioniInCorso.update(s => { const ns = new Set(s); ns.delete(classe.id); return ns; });
        this.iscrizioneRiuscita.update(m => { const nm = new Map(m); nm.set(classe.id, iscr); return nm; });
      },
      error: (err) => {
        this.iscrizioniInCorso.update(s => { const ns = new Set(s); ns.delete(classe.id); return ns; });
        const msg = err?.error?.message || 'Errore durante l\'iscrizione.';
        this.iscrizioneErrore.update(m => { const nm = new Map(m); nm.set(classe.id, msg); return nm; });
      }
    });
  }

  iscrivitiConCodice() {
    const codice = this.codiceInvito().trim();
    if (!codice) return;
    this.codiceLoading.set(true);
    this.codiceError.set('');
    this.codiceSuccess.set('');
    this.classeService.iscrivitiConCodice(codice).subscribe({
      next: (iscr) => {
        this.codiceLoading.set(false);
        this.codiceSuccess.set(`Iscritto con successo a "${iscr.classeNome}"!`);
        this.codiceInvito.set('');
        this.iscrizioneRiuscita.update(m => { const nm = new Map(m); nm.set(iscr.classeId, iscr); return nm; });
        this.loadClassi();
      },
      error: (err) => {
        this.codiceLoading.set(false);
        this.codiceError.set(err?.error?.message || 'Codice non valido o classe non trovata.');
      }
    });
  }

  vaiDettaglio(id: number) {
    this.router.navigate(['/classi', id]);
  }

  tornaHome() {
    this.router.navigate(['/home']);
  }

  prevPage() { if (this.page() > 0) { this.page.update(p => p - 1); this.loadClassi(); } }
  nextPage() { if (this.page() < this.totalPages() - 1) { this.page.update(p => p + 1); this.loadClassi(); } }

  getIscrizione(classeId: number): IscrizioneClasseDto | undefined {
    return this.iscrizioneRiuscita().get(classeId);
  }

  isIscritto(classeId: number): boolean {
    return this.iscrizioneRiuscita().has(classeId);
  }

  getStatoLabel(classeId: number): string {
    const iscr = this.iscrizioneRiuscita().get(classeId);
    if (!iscr) return '';
    switch (iscr.stato) {
      case 'APPROVATA':  return 'Iscritto';
      case 'IN_ATTESA':  return 'In attesa di approvazione';
      case 'RIFIUTATA':  return 'Iscrizione rifiutata';
      default:           return iscr.stato;
    }
  }

  getStatoCss(classeId: number): string {
    const iscr = this.iscrizioneRiuscita().get(classeId);
    if (!iscr) return '';
    switch (iscr.stato) {
      case 'APPROVATA': return 'badge-approvata';
      case 'IN_ATTESA': return 'badge-attesa';
      case 'RIFIUTATA': return 'badge-rifiutata';
      default:          return '';
    }
  }
}
