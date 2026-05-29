import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RuoloService } from '../../../services/ruolo-service';
import { RuoloDto } from '../../dto/RuoloDto';

@Component({
  selector: 'app-gestione-ruoli',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestione-ruoli.html',
  styleUrls: ['./gestione-ruoli.css']
})
export class GestioneRuoliComponent implements OnInit {
  ruoli       = signal<RuoloDto[]>([]);
  loading     = signal(true);
  error       = signal('');

  searchQuery = signal('');

  filteredRuoli = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.ruoli();
    return this.ruoli().filter(r =>
      r.nome.toLowerCase().includes(q) ||
      r.alias.toLowerCase().includes(q)
    );
  });

  mostraForm  = signal(false);
  formLoading = signal(false);
  formError   = signal('');
  formSuccess = signal('');
  form        = signal({ nome: '', alias: '' });

  editando    = signal<RuoloDto | null>(null);
  editForm    = signal({ nome: '', alias: '' });
  editLoading = signal(false);
  editError   = signal('');

  constructor(private ruoloService: RuoloService, private location: Location) {}

  ngOnInit() { this.load(); }

  goBack() { this.location.back(); }

  load() {
    this.loading.set(true);
    this.ruoloService.listaTutti().subscribe({
      next:  (data) => { this.ruoli.set(data); this.loading.set(false); },
      error: ()     => { this.error.set('Errore nel caricamento dei ruoli'); this.loading.set(false); }
    });
  }

  crea() {
    const f = this.form();
    if (!f.nome.trim() || !f.alias.trim()) { this.formError.set('Nome e alias sono obbligatori.'); return; }
    this.formLoading.set(true);
    this.formError.set('');
    this.ruoloService.crea({ nome: f.nome.trim(), alias: f.alias.trim() }).subscribe({
      next: (r) => {
        this.ruoli.update(list => [...list, r]);
        this.form.set({ nome: '', alias: '' });
        this.mostraForm.set(false);
        this.formLoading.set(false);
        this.formSuccess.set(`Ruolo "${r.nome}" creato.`);
        setTimeout(() => this.formSuccess.set(''), 4000);
      },
      error: (err) => {
        this.formLoading.set(false);
        this.formError.set(err?.error?.message || 'Errore nella creazione del ruolo.');
      }
    });
  }

  annullaForm() {
    this.mostraForm.set(false);
    this.form.set({ nome: '', alias: '' });
    this.formError.set('');
  }

  apriModifica(r: RuoloDto) {
    this.editando.set(r);
    this.editForm.set({ nome: r.nome, alias: r.alias });
    this.editError.set('');
  }

  chiudiModifica() { this.editando.set(null); this.editError.set(''); }

  salvaModifica() {
    const r = this.editando();
    if (!r) return;
    const f = this.editForm();
    if (!f.nome.trim() || !f.alias.trim()) { this.editError.set('Nome e alias sono obbligatori.'); return; }
    this.editLoading.set(true);
    this.editError.set('');
    this.ruoloService.aggiorna({ id: r.id, nome: f.nome.trim(), alias: f.alias.trim() }).subscribe({
      next: (updated) => {
        this.ruoli.update(list => list.map(x => x.id === updated.id ? updated : x));
        this.editLoading.set(false);
        this.chiudiModifica();
        this.formSuccess.set('Ruolo aggiornato.');
        setTimeout(() => this.formSuccess.set(''), 4000);
      },
      error: (err) => {
        this.editLoading.set(false);
        this.editError.set(err?.error?.message || 'Errore durante l\'aggiornamento.');
      }
    });
  }

  elimina(r: RuoloDto) {
    if (!confirm(`Eliminare il ruolo "${r.nome}"?`)) return;
    this.ruoloService.elimina(r.id).subscribe({
      next: () => {
        this.ruoli.update(list => list.filter(x => x.id !== r.id));
        this.formSuccess.set(`Ruolo "${r.nome}" eliminato.`);
        setTimeout(() => this.formSuccess.set(''), 4000);
      },
      error: (err) => this.error.set(err?.error?.message || 'Errore nell\'eliminazione.')
    });
  }

  updateNome(v: string)    { this.form.update(f => ({ ...f, nome: v })); }
  updateAlias(v: string)   { this.form.update(f => ({ ...f, alias: v })); }
  updateEditNome(v: string) { this.editForm.update(f => ({ ...f, nome: v })); }
  updateEditAlias(v: string){ this.editForm.update(f => ({ ...f, alias: v })); }
}
