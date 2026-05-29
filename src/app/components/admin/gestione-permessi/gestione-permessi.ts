import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PermessoService } from '../../../services/permesso-service';
import { GruppoService } from '../../../services/gruppo-service';
import { PermessoDto } from '../../dto/PermessoDto';
import { GruppoDto } from '../../dto/GruppoDto';

@Component({
  selector: 'app-gestione-permessi',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestione-permessi.html',
  styleUrls: ['./gestione-permessi.css']
})
export class GestionePermessiComponent implements OnInit {
  permessi    = signal<PermessoDto[]>([]);
  gruppi      = signal<GruppoDto[]>([]);
  loading     = signal(true);
  error       = signal('');

  searchQuery = signal('');

  filteredPermessi = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.permessi();
    return this.permessi().filter(p =>
      p.nome.toLowerCase().includes(q) ||
      p.alias.toLowerCase().includes(q) ||
      (p.gruppo?.nome ?? '').toLowerCase().includes(q) ||
      (p.gruppo?.alias ?? '').toLowerCase().includes(q)
    );
  });

  mostraForm  = signal(false);
  formLoading = signal(false);
  formError   = signal('');
  formSuccess = signal('');
  form        = signal({ nome: '', alias: '', gruppoId: null as number | null });

  editando    = signal<PermessoDto | null>(null);
  editForm    = signal({ nome: '', alias: '', gruppoId: null as number | null });
  editLoading = signal(false);
  editError   = signal('');

  constructor(
    private permessoService: PermessoService,
    private gruppoService: GruppoService,
    private location: Location
  ) {}

  ngOnInit() {
    this.gruppoService.listaTutti().subscribe({ next: (g) => this.gruppi.set(g) });
    this.load();
  }

  goBack() { this.location.back(); }

  load() {
    this.loading.set(true);
    this.permessoService.listaTutti().subscribe({
      next:  (data) => { this.permessi.set(data); this.loading.set(false); },
      error: ()     => { this.error.set('Errore nel caricamento dei permessi'); this.loading.set(false); }
    });
  }

  private buildGruppo(id: number | null): GruppoDto | undefined {
    if (id == null) return undefined;
    return this.gruppi().find(g => g.id === id);
  }

  crea() {
    const f = this.form();
    if (!f.nome.trim() || !f.alias.trim()) { this.formError.set('Nome e alias sono obbligatori.'); return; }
    this.formLoading.set(true);
    this.formError.set('');
    this.permessoService.crea({ nome: f.nome.trim(), alias: f.alias.trim(), gruppo: this.buildGruppo(f.gruppoId) }).subscribe({
      next: (p) => {
        this.permessi.update(list => [...list, p]);
        this.form.set({ nome: '', alias: '', gruppoId: null });
        this.mostraForm.set(false);
        this.formLoading.set(false);
        this.formSuccess.set(`Permesso "${p.nome}" creato.`);
        setTimeout(() => this.formSuccess.set(''), 4000);
      },
      error: (err) => {
        this.formLoading.set(false);
        this.formError.set(err?.error?.message || 'Errore nella creazione del permesso.');
      }
    });
  }

  annullaForm() {
    this.mostraForm.set(false);
    this.form.set({ nome: '', alias: '', gruppoId: null });
    this.formError.set('');
  }

  apriModifica(p: PermessoDto) {
    this.editando.set(p);
    this.editForm.set({ nome: p.nome, alias: p.alias, gruppoId: p.gruppo?.id ?? null });
    this.editError.set('');
  }

  chiudiModifica() { this.editando.set(null); this.editError.set(''); }

  salvaModifica() {
    const p = this.editando();
    if (!p) return;
    const f = this.editForm();
    if (!f.nome.trim() || !f.alias.trim()) { this.editError.set('Nome e alias sono obbligatori.'); return; }
    this.editLoading.set(true);
    this.editError.set('');
    this.permessoService.aggiorna({ id: p.id, nome: f.nome.trim(), alias: f.alias.trim(), gruppo: this.buildGruppo(f.gruppoId) }).subscribe({
      next: (updated) => {
        this.permessi.update(list => list.map(x => x.id === updated.id ? updated : x));
        this.editLoading.set(false);
        this.chiudiModifica();
        this.formSuccess.set('Permesso aggiornato.');
        setTimeout(() => this.formSuccess.set(''), 4000);
      },
      error: (err) => {
        this.editLoading.set(false);
        this.editError.set(err?.error?.message || 'Errore durante l\'aggiornamento.');
      }
    });
  }

  elimina(p: PermessoDto) {
    if (!confirm(`Eliminare il permesso "${p.nome}"?`)) return;
    this.permessoService.elimina(p.id).subscribe({
      next: () => {
        this.permessi.update(list => list.filter(x => x.id !== p.id));
        this.formSuccess.set(`Permesso "${p.nome}" eliminato.`);
        setTimeout(() => this.formSuccess.set(''), 4000);
      },
      error: (err) => this.error.set(err?.error?.message || 'Errore nell\'eliminazione.')
    });
  }

  updateNome(v: string)      { this.form.update(f => ({ ...f, nome: v })); }
  updateAlias(v: string)     { this.form.update(f => ({ ...f, alias: v })); }
  updateGruppo(v: string)    { this.form.update(f => ({ ...f, gruppoId: v ? +v : null })); }
  updateEditNome(v: string)  { this.editForm.update(f => ({ ...f, nome: v })); }
  updateEditAlias(v: string) { this.editForm.update(f => ({ ...f, alias: v })); }
  updateEditGruppo(v: string){ this.editForm.update(f => ({ ...f, gruppoId: v ? +v : null })); }
}
