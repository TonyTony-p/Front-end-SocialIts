import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ClasseCorsoService } from '../../../services/classe-corso-service';
import { ClasseCorsoDto } from '../../dto/ClasseCorsoDto';

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

  constructor(private classeService: ClasseCorsoService, private router: Router) {}

  ngOnInit() {
    this.classeService.mieClassi().subscribe({
      next: (data) => { this.classi.set(data); this.loading.set(false); },
      error: () => { this.error.set('Errore nel caricamento delle classi'); this.loading.set(false); }
    });
  }

  nuovaClasse() { this.router.navigate(['/classi/nuova']); }
  apriClasse(id: number) { this.router.navigate(['/classi', id]); }
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
}
