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

  constructor(
    private classeService: ClasseCorsoService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadClassi();
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

  iscriviti(classe: ClasseCorsoDto) {
    if (this.iscrizioniInCorso().has(classe.id)) return;
    this.iscrizioniInCorso.update(s => { const ns = new Set(s); ns.add(classe.id); return ns; });
    this.classeService.iscriviti(classe.id).subscribe({
      next: (iscr) => {
        this.iscrizioniInCorso.update(s => { const ns = new Set(s); ns.delete(classe.id); return ns; });
        this.iscrizioneRiuscita.update(m => { const nm = new Map(m); nm.set(classe.id, iscr); return nm; });
      },
      error: () => {
        this.iscrizioniInCorso.update(s => { const ns = new Set(s); ns.delete(classe.id); return ns; });
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
        this.codiceSuccess.set(`Iscritto con successo! Stato: ${iscr.stato}`);
        this.codiceInvito.set('');
      },
      error: () => {
        this.codiceLoading.set(false);
        this.codiceError.set('Codice non valido o classe non trovata.');
      }
    });
  }

  vaiDettaglio(id: number) {
    this.router.navigate(['/classi', id]);
  }

  prevPage() { if (this.page() > 0) { this.page.update(p => p - 1); this.loadClassi(); } }
  nextPage() { if (this.page() < this.totalPages() - 1) { this.page.update(p => p + 1); this.loadClassi(); } }

  getStatoBadge(classeId: number): string {
    const iscr = this.iscrizioneRiuscita().get(classeId);
    if (!iscr) return '';
    return iscr.stato === 'APPROVATA' ? 'Iscritto!' : 'In attesa di approvazione';
  }

  isIscritto(classeId: number): boolean {
    return this.iscrizioneRiuscita().has(classeId);
  }
}
