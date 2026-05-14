import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClasseCorsoService } from '../../../services/classe-corso-service';
import { ClasseCorsoFormDto, TipoClasse } from '../../dto/ClasseCorsoDto';

@Component({
  selector: 'app-form-classe',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-classe.html',
  styleUrls: ['./form-classe.css']
})
export class FormClasseComponent implements OnInit {
  isModifica = false;
  classeId: number | null = null;

  form: ClasseCorsoFormDto = { nome: '', descrizione: '', tipo: 'PUBBLICA' };
  codiceInvito = signal('');
  loading = signal(false);
  error = signal('');
  copiato = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private classeService: ClasseCorsoService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isModifica = true;
      this.classeId = +id;
      this.classeService.dettaglioClasse(this.classeId).subscribe({
        next: (c) => {
          this.form = { id: c.id, nome: c.nome, descrizione: c.descrizione, tipo: c.tipo };
          this.codiceInvito.set(c.codiceInvito);
        },
        error: () => this.error.set('Errore nel caricamento della classe')
      });
    }
  }

  submit() {
    if (!this.form.nome.trim()) { this.error.set('Il nome è obbligatorio'); return; }
    this.loading.set(true);
    this.error.set('');

    const op = this.isModifica
      ? this.classeService.aggiornaClasse(this.classeId!, this.form)
      : this.classeService.creaClasse(this.form);

    op.subscribe({
      next: (c) => {
        this.codiceInvito.set(c.codiceInvito);
        if (!this.isModifica) {
          this.isModifica = true;
          this.classeId = c.id;
          this.form.id = c.id;
        }
        this.loading.set(false);
        this.router.navigate(['/classi', c.id]);
      },
      error: (e) => { this.error.set(e.error || 'Errore durante il salvataggio'); this.loading.set(false); }
    });
  }

  copiaCodice() {
    navigator.clipboard.writeText(this.codiceInvito()).then(() => {
      this.copiato.set(true);
      setTimeout(() => this.copiato.set(false), 2000);
    });
  }

  annulla() { this.router.navigate(['/classi/mie']); }
}
