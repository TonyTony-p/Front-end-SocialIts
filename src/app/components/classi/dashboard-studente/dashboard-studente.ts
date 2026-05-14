import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ClasseCorsoService } from '../../../services/classe-corso-service';
import { IscrizioneClasseDto } from '../../dto/ClasseCorsoDto';

@Component({
  selector: 'app-dashboard-studente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-studente.html',
  styleUrls: ['./dashboard-studente.css']
})
export class DashboardStudenteComponent implements OnInit {
  iscrizioni = signal<IscrizioneClasseDto[]>([]);
  loading = signal(true);
  error = signal('');

  classiApprovate = computed(() => this.iscrizioni().filter(i => i.stato === 'APPROVATA'));
  classiInAttesa = computed(() => this.iscrizioni().filter(i => i.stato === 'IN_ATTESA'));
  classiRifiutate = computed(() => this.iscrizioni().filter(i => i.stato === 'RIFIUTATA'));

  constructor(
    private classeService: ClasseCorsoService,
    private router: Router
  ) {}

  ngOnInit() {
    this.classeService.miIscrizioni().subscribe({
      next: (data) => { this.iscrizioni.set(data); this.loading.set(false); },
      error: () => { this.error.set('Errore nel caricamento delle iscrizioni'); this.loading.set(false); }
    });
  }

  vaiClasse(classeId: number) {
    this.router.navigate(['/classi', classeId]);
  }

  esplora() { this.router.navigate(['/esplora-classi']); }
  tornaHome() { this.router.navigate(['/home']); }

  abbandona(event: Event, classeId: number) {
    event.stopPropagation();
    if (!confirm('Sei sicuro di voler abbandonare questa classe?')) return;
    this.classeService.abbandona(classeId).subscribe({
      next: () => this.iscrizioni.update(list => list.filter(i => i.classeId !== classeId))
    });
  }
}
