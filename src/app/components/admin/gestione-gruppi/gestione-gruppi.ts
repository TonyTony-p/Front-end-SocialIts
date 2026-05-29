import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GruppoService } from '../../../services/gruppo-service';
import { GruppoDto } from '../../dto/GruppoDto';

@Component({
  selector: 'app-gestione-gruppi',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestione-gruppi.html',
  styleUrls: ['./gestione-gruppi.css']
})
export class GestioneGruppiComponent implements OnInit {
  gruppi      = signal<GruppoDto[]>([]);
  loading     = signal(true);
  error       = signal('');

  searchQuery = signal('');

  filteredGruppi = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.gruppi();
    return this.gruppi().filter(g =>
      g.nome.toLowerCase().includes(q) ||
      g.alias.toLowerCase().includes(q)
    );
  });

  mostraForm  = signal(false);
  formLoading = signal(false);
  formError   = signal('');
  formSuccess = signal('');
  form        = signal({ nome: '', alias: '' });

  editando    = signal<GruppoDto | null>(null);
  editForm    = signal({ nome: '', alias: '' });
  editLoading = signal(false);
  editError   = signal('');

  constructor(private gruppoService: GruppoService, private location: Location) {}

  ngOnInit() { this.load(); }

  goBack() { this.location.back(); }

  load() {
    this.loading.set(true);
    this.gruppoService.listaTutti().subscribe({
      next:  (data) => { this.gruppi.set(data); this.loading.set(false); },
      error: ()     => { this.error.set('Errore nel caricamento dei gruppi'); this.loading.set(false); }
    });
  }

  crea() {
    const f = this.form();
    if (!f.nome.trim() || !f.alias.trim()) { this.formError.set('Nome e alias sono obbligatori.'); return; }
    this.formLoading.set(true);
    this.formError.set('');
    this.gruppoService.crea({ nome: f.nome.trim(), alias: f.alias.trim() }).subscribe({
      next: (g) => {
        this.gruppi.update(list => [...list, g]);
        this.form.set({ nome: '', alias: '' });
        this.mostraForm.set(false);
        this.formLoading.set(false);
        this.formSuccess.set(`Gruppo "${g.nome}" creato.`);
        setTimeout(() => this.formSuccess.set(''), 4000);
      },
      error: (err) => {
        this.formLoading.set(false);
        this.formError.set(err?.error?.message || 'Errore nella creazione del gruppo.');
      }
    });
  }

  annullaForm() {
    this.mostraForm.set(false);
    this.form.set({ nome: '', alias: '' });
    this.formError.set('');
  }

  apriModifica(g: GruppoDto) {
    this.editando.set(g);
    this.editForm.set({ nome: g.nome, alias: g.alias });
    this.editError.set('');
  }

  chiudiModifica() { this.editando.set(null); this.editError.set(''); }

  salvaModifica() {
    const g = this.editando();
    if (!g) return;
    const f = this.editForm();
    if (!f.nome.trim() || !f.alias.trim()) { this.editError.set('Nome e alias sono obbligatori.'); return; }
    this.editLoading.set(true);
    this.editError.set('');
    this.gruppoService.aggiorna({ id: g.id, nome: f.nome.trim(), alias: f.alias.trim() }).subscribe({
      next: (updated) => {
        this.gruppi.update(list => list.map(x => x.id === updated.id ? updated : x));
        this.editLoading.set(false);
        this.chiudiModifica();
        this.formSuccess.set('Gruppo aggiornato.');
        setTimeout(() => this.formSuccess.set(''), 4000);
      },
      error: (err) => {
        this.editLoading.set(false);
        this.editError.set(err?.error?.message || 'Errore durante l\'aggiornamento.');
      }
    });
  }

  elimina(g: GruppoDto) {
    if (!confirm(`Eliminare il gruppo "${g.nome}"?`)) return;
    this.gruppoService.elimina(g.id).subscribe({
      next: () => {
        this.gruppi.update(list => list.filter(x => x.id !== g.id));
        this.formSuccess.set(`Gruppo "${g.nome}" eliminato.`);
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
