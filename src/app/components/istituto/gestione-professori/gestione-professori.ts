import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClasseCorsoService } from '../../../services/classe-corso-service';

interface ProfessoreDto {
  id: number;
  username: string;
  nome: string;
  cognome: string;
  email: string;
}

@Component({
  selector: 'app-gestione-professori',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestione-professori.html',
  styleUrls: ['./gestione-professori.css']
})
export class GestioneProfessoriComponent implements OnInit {
  professori = signal<ProfessoreDto[]>([]);
  loading = signal(true);
  error = signal('');

  mostraForm = signal(false);
  formLoading = signal(false);
  formError = signal('');
  formSuccess = signal('');

  form = signal({ nome: '', cognome: '', email: '', password: '' });

  // Edit modal state
  editando = signal<ProfessoreDto | null>(null);
  editForm = signal({ nome: '', cognome: '', email: '', username: '', password: '' });
  editLoading = signal(false);
  editError = signal('');
  mostraPassword = signal(false);

  constructor(private classeService: ClasseCorsoService) {}

  ngOnInit() {
    this.loadProfessori();
  }

  loadProfessori() {
    this.loading.set(true);
    this.classeService.listaProfessori().subscribe({
      next: (data) => { this.professori.set(data); this.loading.set(false); },
      error: () => { this.error.set('Errore nel caricamento dei professori'); this.loading.set(false); }
    });
  }

  creaProfessore() {
    const f = this.form();
    if (!f.nome.trim() || !f.cognome.trim() || !f.email.trim() || !f.password.trim()) {
      this.formError.set('Tutti i campi sono obbligatori.');
      return;
    }
    this.formLoading.set(true);
    this.formError.set('');
    this.formSuccess.set('');
    this.classeService.creaProfessore(f).subscribe({
      next: (prof) => {
        this.professori.update(list => [...list, prof]);
        this.form.set({ nome: '', cognome: '', email: '', password: '' });
        this.mostraForm.set(false);
        this.formLoading.set(false);
        this.formSuccess.set(`Professore ${prof.username} creato con successo.`);
        setTimeout(() => this.formSuccess.set(''), 4000);
      },
      error: (err) => {
        this.formLoading.set(false);
        this.formError.set(err?.error?.message || 'Errore nella creazione del professore.');
      }
    });
  }

  annullaForm() {
    this.mostraForm.set(false);
    this.form.set({ nome: '', cognome: '', email: '', password: '' });
    this.formError.set('');
  }

  apriModifica(prof: ProfessoreDto) {
    this.editando.set(prof);
    this.editForm.set({ nome: prof.nome, cognome: prof.cognome, email: prof.email, username: prof.username, password: '' });
    this.editError.set('');
    this.mostraPassword.set(false);
  }

  chiudiModifica() {
    this.editando.set(null);
    this.editError.set('');
  }

  salvaModifica() {
    const prof = this.editando();
    if (!prof) return;
    const f = this.editForm();
    if (!f.nome.trim() || !f.cognome.trim() || !f.email.trim() || !f.username.trim()) {
      this.editError.set('Nome, cognome, email e username sono obbligatori.');
      return;
    }
    if (f.password && f.password.length < 8) {
      this.editError.set('La nuova password deve avere almeno 8 caratteri.');
      return;
    }
    this.editLoading.set(true);
    this.editError.set('');
    const payload: any = { nome: f.nome, cognome: f.cognome, email: f.email, username: f.username };
    if (f.password.trim()) payload.password = f.password;
    this.classeService.aggiornaProfessore(prof.id, payload).subscribe({
      next: (updated) => {
        this.professori.update(list => list.map(p => p.id === prof.id ? { ...p, ...updated } : p));
        this.editLoading.set(false);
        this.chiudiModifica();
        this.formSuccess.set('Profilo aggiornato con successo.');
        setTimeout(() => this.formSuccess.set(''), 4000);
      },
      error: (err) => {
        this.editLoading.set(false);
        this.editError.set(err?.error?.message || 'Errore durante l\'aggiornamento.');
      }
    });
  }

  updateNome(val: string) { this.form.update(f => ({...f, nome: val})); }
  updateCognome(val: string) { this.form.update(f => ({...f, cognome: val})); }
  updateEmail(val: string) { this.form.update(f => ({...f, email: val})); }
  updatePassword(val: string) { this.form.update(f => ({...f, password: val})); }

  updateEditNome(val: string) { this.editForm.update(f => ({...f, nome: val})); }
  updateEditCognome(val: string) { this.editForm.update(f => ({...f, cognome: val})); }
  updateEditEmail(val: string) { this.editForm.update(f => ({...f, email: val})); }
  updateEditUsername(val: string) { this.editForm.update(f => ({...f, username: val})); }
  updateEditPassword(val: string) { this.editForm.update(f => ({...f, password: val})); }
}
