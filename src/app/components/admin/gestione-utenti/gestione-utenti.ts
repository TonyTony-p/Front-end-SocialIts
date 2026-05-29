import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UtenteService } from '../../../services/utente-service';
import { RuoloService } from '../../../services/ruolo-service';
import { UtenteDto } from '../../dto/UtenteDto';
import { RuoloDto } from '../../dto/RuoloDto';

@Component({
  selector: 'app-gestione-utenti',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestione-utenti.html',
  styleUrls: ['./gestione-utenti.css']
})
export class GestioneUtentiComponent implements OnInit {
  utenti  = signal<UtenteDto[]>([]);
  ruoli   = signal<RuoloDto[]>([]);
  loading = signal(true);
  error   = signal('');

  searchQuery = signal('');

  filteredUtenti = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.utenti();
    return this.utenti().filter(u =>
      u.nome.toLowerCase().includes(q) ||
      u.cognome.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.ruolo?.nome ?? '').toLowerCase().includes(q)
    );
  });

  mostraForm  = signal(false);
  formLoading = signal(false);
  formError   = signal('');
  formSuccess = signal('');
  form = signal({
    nome: '', cognome: '', username: '', email: '',
    password: '', dataNascita: '', telefono: '', indirizzo: '',
    ruoloId: null as number | null
  });

  editando    = signal<UtenteDto | null>(null);
  editForm    = signal({
    nome: '', cognome: '', username: '', email: '',
    password: '', dataNascita: '', telefono: '', indirizzo: '',
    ruoloId: null as number | null
  });
  editLoading = signal(false);
  editError   = signal('');

  constructor(
    private utenteService: UtenteService,
    private ruoloService: RuoloService,
    private location: Location
  ) {}

  ngOnInit() {
    this.ruoloService.listaTutti().subscribe({ next: r => this.ruoli.set(r) });
    this.load();
  }

  goBack() { this.location.back(); }

  load() {
    this.loading.set(true);
    this.utenteService.listaTutti().subscribe({
      next:  data => { this.utenti.set(data); this.loading.set(false); },
      error: ()   => { this.error.set('Errore nel caricamento degli utenti'); this.loading.set(false); }
    });
  }

  private buildRuolo(id: number | null): RuoloDto {
    return this.ruoli().find(r => r.id === id) ?? { id: id!, nome: '', alias: '' };
  }

  crea() {
    const f = this.form();
    if (!f.nome.trim() || !f.cognome.trim() || !f.username.trim() || !f.email.trim() || !f.password.trim()) {
      this.formError.set('Nome, cognome, username, email e password sono obbligatori.');
      return;
    }
    if (f.ruoloId == null) { this.formError.set('Seleziona un ruolo.'); return; }
    this.formLoading.set(true);
    this.formError.set('');
    this.utenteService.crea({
      nome: f.nome.trim(), cognome: f.cognome.trim(),
      username: f.username.trim(), email: f.email.trim(),
      password: f.password, ruolo: this.buildRuolo(f.ruoloId),
      dataNascita: f.dataNascita || undefined,
      telefono:    f.telefono.trim() || undefined,
      indirizzo:   f.indirizzo.trim() || undefined
    }).subscribe({
      next: u => {
        this.utenti.update(list => [...list, u]);
        this.form.set({ nome: '', cognome: '', username: '', email: '', password: '', dataNascita: '', telefono: '', indirizzo: '', ruoloId: null });
        this.mostraForm.set(false);
        this.formLoading.set(false);
        this.formSuccess.set(`Utente "${u.username}" creato.`);
        setTimeout(() => this.formSuccess.set(''), 4000);
      },
      error: err => {
        this.formLoading.set(false);
        this.formError.set(err?.error?.message || 'Errore nella creazione dell\'utente.');
      }
    });
  }

  annullaForm() {
    this.mostraForm.set(false);
    this.form.set({ nome: '', cognome: '', username: '', email: '', password: '', dataNascita: '', telefono: '', indirizzo: '', ruoloId: null });
    this.formError.set('');
  }

  apriModifica(u: UtenteDto) {
    this.editando.set(u);
    this.editForm.set({
      nome: u.nome, cognome: u.cognome, username: u.username, email: u.email,
      password: '', dataNascita: u.dataNascita ?? '',
      telefono: u.telefono ?? '', indirizzo: u.indirizzo ?? '',
      ruoloId: u.ruolo?.id ?? null
    });
    this.editError.set('');
  }

  chiudiModifica() { this.editando.set(null); this.editError.set(''); }

  salvaModifica() {
    const u = this.editando();
    if (!u) return;
    const f = this.editForm();
    if (!f.nome.trim() || !f.cognome.trim() || !f.username.trim() || !f.email.trim() || !f.password.trim()) {
      this.editError.set('Nome, cognome, username, email e password sono obbligatori.');
      return;
    }
    if (f.ruoloId == null) { this.editError.set('Seleziona un ruolo.'); return; }
    this.editLoading.set(true);
    this.editError.set('');
    this.utenteService.aggiorna({
      id: u.id, nome: f.nome.trim(), cognome: f.cognome.trim(),
      username: f.username.trim(), email: f.email.trim(),
      password: f.password, ruolo: this.buildRuolo(f.ruoloId),
      dataNascita: f.dataNascita || undefined,
      telefono:    f.telefono.trim() || undefined,
      indirizzo:   f.indirizzo.trim() || undefined
    }).subscribe({
      next: updated => {
        this.utenti.update(list => list.map(x => x.id === updated.id ? updated : x));
        this.editLoading.set(false);
        this.chiudiModifica();
        this.formSuccess.set('Utente aggiornato.');
        setTimeout(() => this.formSuccess.set(''), 4000);
      },
      error: err => {
        this.editLoading.set(false);
        this.editError.set(err?.error?.message || 'Errore durante l\'aggiornamento.');
      }
    });
  }

  elimina(u: UtenteDto) {
    if (!confirm(`Eliminare l'utente "${u.username}"?`)) return;
    this.utenteService.elimina(u.id).subscribe({
      next: () => {
        this.utenti.update(list => list.filter(x => x.id !== u.id));
        this.formSuccess.set(`Utente "${u.username}" eliminato.`);
        setTimeout(() => this.formSuccess.set(''), 4000);
      },
      error: err => this.error.set(err?.error?.message || 'Errore nell\'eliminazione.')
    });
  }

  initiali(u: UtenteDto): string {
    return (u.nome.charAt(0) + u.cognome.charAt(0)).toUpperCase();
  }

  updateNome(v: string)        { this.form.update(f => ({ ...f, nome: v })); }
  updateCognome(v: string)     { this.form.update(f => ({ ...f, cognome: v })); }
  updateUsername(v: string)    { this.form.update(f => ({ ...f, username: v })); }
  updateEmail(v: string)       { this.form.update(f => ({ ...f, email: v })); }
  updatePassword(v: string)    { this.form.update(f => ({ ...f, password: v })); }
  updateDataNascita(v: string) { this.form.update(f => ({ ...f, dataNascita: v })); }
  updateTelefono(v: string)    { this.form.update(f => ({ ...f, telefono: v })); }
  updateIndirizzo(v: string)   { this.form.update(f => ({ ...f, indirizzo: v })); }
  updateRuolo(v: string)       { this.form.update(f => ({ ...f, ruoloId: v ? +v : null })); }

  updateEditNome(v: string)        { this.editForm.update(f => ({ ...f, nome: v })); }
  updateEditCognome(v: string)     { this.editForm.update(f => ({ ...f, cognome: v })); }
  updateEditUsername(v: string)    { this.editForm.update(f => ({ ...f, username: v })); }
  updateEditEmail(v: string)       { this.editForm.update(f => ({ ...f, email: v })); }
  updateEditPassword(v: string)    { this.editForm.update(f => ({ ...f, password: v })); }
  updateEditDataNascita(v: string) { this.editForm.update(f => ({ ...f, dataNascita: v })); }
  updateEditTelefono(v: string)    { this.editForm.update(f => ({ ...f, telefono: v })); }
  updateEditIndirizzo(v: string)   { this.editForm.update(f => ({ ...f, indirizzo: v })); }
  updateEditRuolo(v: string)       { this.editForm.update(f => ({ ...f, ruoloId: v ? +v : null })); }
}
