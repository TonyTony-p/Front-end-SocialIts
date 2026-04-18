import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { UtenteService } from '../../services/utente-service';
import { ThemeService } from '../../services/theme.service';
import { ProfiloDto } from '../dto/ProfiloDto';
import { ProfiloFormDto } from '../dto/ProfiloFormDto';

@Component({
  selector: 'app-profilo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profilo.html',
  styleUrls: ['./profilo.css']
})
export class ProfiloComponent implements OnInit {

  profilo = signal<ProfiloDto | null>(null);
  loading = signal<boolean>(true);
  error = signal<string>('');

  modalitaModifica = signal<boolean>(false);
  salvando = signal<boolean>(false);
  erroreModifica = signal<string>('');

  form: ProfiloFormDto = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private utenteService: UtenteService,
    public authService: AuthService,
    public themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const username = params.get('username');
      if (username) this.caricaProfilo(username);
    });
  }

  caricaProfilo(username: string): void {
    this.loading.set(true);
    this.error.set('');
    this.utenteService.getProfilo(username).subscribe({
      next: data => {
        this.profilo.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Profilo non trovato.');
        this.loading.set(false);
      }
    });
  }

  get isProprioProfile(): boolean {
    return this.authService.getCurrentUsername() === this.profilo()?.username;
  }

  apriModifica(): void {
    const p = this.profilo();
    if (!p) return;
    this.form = {
      nome: p.nome,
      cognome: p.cognome,
      bio: p.bio ?? '',
      fotoProfilo: p.fotoProfilo ?? ''
    };
    this.erroreModifica.set('');
    this.modalitaModifica.set(true);
  }

  annullaModifica(): void {
    this.modalitaModifica.set(false);
  }

  salva(): void {
    if (this.salvando()) return;
    this.salvando.set(true);
    this.erroreModifica.set('');
    this.utenteService.updateMyProfilo(this.form).subscribe({
      next: aggiornato => {
        this.profilo.set(aggiornato);
        this.modalitaModifica.set(false);
        this.salvando.set(false);
      },
      error: () => {
        this.erroreModifica.set('Errore durante il salvataggio. Riprova.');
        this.salvando.set(false);
      }
    });
  }

  tornaHome(): void {
    this.router.navigate(['/home']);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  }
}
