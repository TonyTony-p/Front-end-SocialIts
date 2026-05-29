import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClasseCorsoService } from '../../../services/classe-corso-service';
import { IstitutoDto } from '../../dto/IstitutoDto';

@Component({
  selector: 'app-gestione-istituti',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestione-istituti.html',
  styleUrls: ['./gestione-istituti.css']
})
export class GestioneIstitutiComponent implements OnInit {
  istituti    = signal<IstitutoDto[]>([]);
  loading     = signal(true);
  error       = signal('');

  searchQuery = signal('');

  filteredIstituti = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.istituti();
    return this.istituti().filter(ist =>
      ist.nome.toLowerCase().includes(q) ||
      (ist.citta        ?? '').toLowerCase().includes(q) ||
      (ist.descrizione  ?? '').toLowerCase().includes(q)
    );
  });

  totalClassi = computed(() =>
    this.istituti().reduce((sum, ist) => sum + (ist.numeroClassi ?? 0), 0)
  );

  mostraForm   = signal(false);
  formLoading  = signal(false);
  formError    = signal('');
  formSuccess  = signal('');
  form         = signal({ nome: '', descrizione: '', citta: '' });

  editando     = signal<IstitutoDto | null>(null);
  editForm     = signal({ nome: '', descrizione: '', citta: '' });
  editLoading  = signal(false);
  editError    = signal('');

  constructor(
    private classeService: ClasseCorsoService,
    private location: Location
  ) {}

  ngOnInit() { this.load(); }

  goBack() { this.location.back(); }

  load() {
    this.loading.set(true);
    this.classeService.listaIstituti().subscribe({
      next:  (data) => { this.istituti.set(data); this.loading.set(false); },
      error: ()     => { this.error.set('Errore nel caricamento degli istituti'); this.loading.set(false); }
    });
  }

  crea() {
    const f = this.form();
    if (!f.nome.trim()) { this.formError.set('Il nome è obbligatorio.'); return; }
    this.formLoading.set(true);
    this.formError.set('');
    this.classeService.creaIstituto({
      nome:        f.nome.trim(),
      descrizione: f.descrizione.trim() || undefined,
      citta:       f.citta.trim()       || undefined
    }).subscribe({
      next: (ist) => {
        this.istituti.update(list => [...list, ist]);
        this.form.set({ nome: '', descrizione: '', citta: '' });
        this.mostraForm.set(false);
        this.formLoading.set(false);
        this.formSuccess.set(`Istituto "${ist.nome}" creato.`);
        setTimeout(() => this.formSuccess.set(''), 4000);
      },
      error: (err) => {
        this.formLoading.set(false);
        this.formError.set(err?.error?.message || 'Errore nella creazione dell\'istituto.');
      }
    });
  }

  annullaForm() {
    this.mostraForm.set(false);
    this.form.set({ nome: '', descrizione: '', citta: '' });
    this.formError.set('');
  }

  apriModifica(ist: IstitutoDto) {
    this.editando.set(ist);
    this.editForm.set({ nome: ist.nome, descrizione: ist.descrizione ?? '', citta: ist.citta ?? '' });
    this.editError.set('');
  }

  chiudiModifica() { this.editando.set(null); this.editError.set(''); }

  salvaModifica() {
    const ist = this.editando();
    if (!ist) return;
    const f = this.editForm();
    if (!f.nome.trim()) { this.editError.set('Il nome è obbligatorio.'); return; }
    this.editLoading.set(true);
    this.editError.set('');
    this.classeService.aggiornaIstituto(ist.id, {
      nome:        f.nome.trim(),
      descrizione: f.descrizione.trim() || undefined,
      citta:       f.citta.trim()       || undefined
    }).subscribe({
      next: (updated) => {
        this.istituti.update(list => list.map(x => x.id === updated.id ? updated : x));
        this.editLoading.set(false);
        this.chiudiModifica();
        this.formSuccess.set('Istituto aggiornato.');
        setTimeout(() => this.formSuccess.set(''), 4000);
      },
      error: (err) => {
        this.editLoading.set(false);
        this.editError.set(err?.error?.message || 'Errore durante l\'aggiornamento.');
      }
    });
  }

  elimina(ist: IstitutoDto) {
    if (!confirm(`Eliminare l'istituto "${ist.nome}"?`)) return;
    this.classeService.eliminaIstituto(ist.id).subscribe({
      next:  () => {
        this.istituti.update(list => list.filter(x => x.id !== ist.id));
        this.formSuccess.set(`Istituto "${ist.nome}" eliminato.`);
        setTimeout(() => this.formSuccess.set(''), 4000);
      },
      error: (err) => this.error.set(err?.error?.message || 'Errore nell\'eliminazione.')
    });
  }

  updateNome(v: string)          { this.form.update(f => ({ ...f, nome: v })); }
  updateDescrizione(v: string)   { this.form.update(f => ({ ...f, descrizione: v })); }
  updateCitta(v: string)         { this.form.update(f => ({ ...f, citta: v })); }
  updateEditNome(v: string)      { this.editForm.update(f => ({ ...f, nome: v })); }
  updateEditDescrizione(v: string){ this.editForm.update(f => ({ ...f, descrizione: v })); }
  updateEditCitta(v: string)     { this.editForm.update(f => ({ ...f, citta: v })); }
}
