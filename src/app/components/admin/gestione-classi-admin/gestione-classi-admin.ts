import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClasseCorsoService } from '../../../services/classe-corso-service';
import { ClasseCorsoDto } from '../../dto/ClasseCorsoDto';

@Component({
  selector: 'app-gestione-classi-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestione-classi-admin.html',
  styleUrls: ['./gestione-classi-admin.css']
})
export class GestioneClassiAdminComponent implements OnInit {
  classi    = signal<ClasseCorsoDto[]>([]);
  loading   = signal(true);
  error     = signal('');
  success   = signal('');

  searchQuery = signal('');

  filteredClassi = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.classi();
    return this.classi().filter(c =>
      c.nome.toLowerCase().includes(q) ||
      c.professoreNome.toLowerCase().includes(q) ||
      c.professoreUsername.toLowerCase().includes(q) ||
      (c.istitutoNome ?? '').toLowerCase().includes(q)
    );
  });

  totaleStudenti = computed(() =>
    this.classi().reduce((sum, c) => sum + (c.numeroStudenti ?? 0), 0)
  );

  constructor(
    private classeService: ClasseCorsoService,
    private location: Location
  ) {}

  ngOnInit() { this.load(); }

  goBack() { this.location.back(); }

  load() {
    this.loading.set(true);
    this.classeService.listaClassiAdmin().subscribe({
      next:  data => { this.classi.set(data); this.loading.set(false); },
      error: ()   => { this.error.set('Errore nel caricamento delle classi'); this.loading.set(false); }
    });
  }

  elimina(c: ClasseCorsoDto) {
    if (!confirm(`Eliminare la classe "${c.nome}"? L'operazione è irreversibile.`)) return;
    this.classeService.eliminaClasse(c.id).subscribe({
      next: () => {
        this.classi.update(list => list.filter(x => x.id !== c.id));
        this.success.set(`Classe "${c.nome}" eliminata.`);
        setTimeout(() => this.success.set(''), 4000);
      },
      error: err => this.error.set(err?.error?.message || 'Errore nell\'eliminazione.')
    });
  }

  initiali(c: ClasseCorsoDto): string {
    return c.nome.charAt(0).toUpperCase();
  }
}
