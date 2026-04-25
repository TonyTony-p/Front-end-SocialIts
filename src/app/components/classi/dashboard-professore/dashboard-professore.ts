import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ClasseCorsoService } from '../../../services/classe-corso-service';
import { ClasseCorsoDto, IscrizioneClasseDto } from '../../dto/ClasseCorsoDto';

@Component({
  selector: 'app-dashboard-professore',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-professore.html',
  styleUrls: ['./dashboard-professore.css']
})
export class DashboardProfessoreComponent implements OnInit {
  classi = signal<ClasseCorsoDto[]>([]);
  loading = signal(true);
  error = signal('');

  // Iscrizioni modal
  modalAperta = signal<ClasseCorsoDto | null>(null);
  iscrizioni = signal<IscrizioneClasseDto[]>([]);
  iscrizioniLoading = signal(false);
  iscrizioniError = signal('');
  azioneInCorso = signal<Set<number>>(new Set());

  constructor(private classeService: ClasseCorsoService, private router: Router) {}

  ngOnInit() {
    this.loadClassi();
  }

  loadClassi() {
    this.loading.set(true);
    this.classeService.mieClassi().subscribe({
      next: (data) => { this.classi.set(data); this.loading.set(false); },
      error: () => { this.error.set('Errore nel caricamento delle classi'); this.loading.set(false); }
    });
  }

  nuovaClasse() { this.router.navigate(['/classi/nuova']); }
  apriClasse(id: number) { this.router.navigate(['/classi', id]); }
  tornaHome() { this.router.navigate(['/home']); }

  modificaClasse(id: number, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/classi', id, 'modifica']);
  }

  eliminaClasse(id: number, event: Event) {
    event.stopPropagation();
    if (!confirm('Eliminare questa classe?')) return;
    this.classeService.eliminaClasse(id).subscribe({
      next: () => this.classi.update(list => list.filter(c => c.id !== id)),
      error: () => this.error.set('Errore durante l\'eliminazione')
    });
  }

  apriIscrizioni(classe: ClasseCorsoDto, event: Event) {
    event.stopPropagation();
    this.modalAperta.set(classe);
    this.iscrizioni.set([]);
    this.iscrizioniError.set('');
    this.iscrizioniLoading.set(true);
    this.classeService.listaIscrizioni(classe.id).subscribe({
      next: (data) => { this.iscrizioni.set(data); this.iscrizioniLoading.set(false); },
      error: () => { this.iscrizioniError.set('Errore nel caricamento delle iscrizioni.'); this.iscrizioniLoading.set(false); }
    });
  }

  chiudiIscrizioni() {
    this.modalAperta.set(null);
  }

  approva(classeId: number, iscrizioneId: number) {
    this.setAzioneInCorso(iscrizioneId, true);
    this.classeService.aggiornaIscrizione(classeId, iscrizioneId, 'APPROVATA').subscribe({
      next: (aggiornata) => {
        this.iscrizioni.update(list => list.map(i => i.id === iscrizioneId ? aggiornata : i));
        this.setAzioneInCorso(iscrizioneId, false);
        this.classi.update(list => list.map(c => {
          if (c.id === classeId) return { ...c, numeroStudenti: c.numeroStudenti + 1 };
          return c;
        }));
      },
      error: () => this.setAzioneInCorso(iscrizioneId, false)
    });
  }

  rifiuta(classeId: number, iscrizioneId: number) {
    this.setAzioneInCorso(iscrizioneId, true);
    this.classeService.aggiornaIscrizione(classeId, iscrizioneId, 'RIFIUTATA').subscribe({
      next: (aggiornata) => {
        this.iscrizioni.update(list => list.map(i => i.id === iscrizioneId ? aggiornata : i));
        this.setAzioneInCorso(iscrizioneId, false);
      },
      error: () => this.setAzioneInCorso(iscrizioneId, false)
    });
  }

  private setAzioneInCorso(id: number, val: boolean) {
    this.azioneInCorso.update(s => {
      const ns = new Set(s);
      val ? ns.add(id) : ns.delete(id);
      return ns;
    });
  }

  inAttesaCount(classeId: number): number {
    return 0; // placeholder — loaded lazily on modal open
  }

  getStatoBadgeCss(stato: string): string {
    switch (stato) {
      case 'APPROVATA': return 'badge-approvata';
      case 'IN_ATTESA': return 'badge-attesa';
      case 'RIFIUTATA': return 'badge-rifiutata';
      default: return '';
    }
  }

  getStatoLabel(stato: string): string {
    switch (stato) {
      case 'APPROVATA': return 'Approvata';
      case 'IN_ATTESA': return 'In attesa';
      case 'RIFIUTATA': return 'Rifiutata';
      default: return stato;
    }
  }
}
