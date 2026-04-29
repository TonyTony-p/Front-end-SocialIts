import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { UtenteService } from '../../services/utente-service';
import { SegueService } from '../../services/segue-service';
import { ThemeService } from '../../services/theme.service';
import { SalvataggioService } from '../../services/salvataggio-service';
import { ProfiloDto } from '../dto/ProfiloDto';
import { ProfiloFormDto } from '../dto/ProfiloFormDto';
import { PostDto } from '../dto/PostDto';

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

  tabAttiva = signal<'post' | 'salvati'>('post');
  postSalvati = signal<PostDto[]>([]);
  loadingSalvati = signal<boolean>(false);

  modalitaModifica = signal<boolean>(false);
  salvando = signal<boolean>(false);
  erroreModifica = signal<string>('');
  seguendoInProgress = signal<boolean>(false);

  form: ProfiloFormDto = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private utenteService: UtenteService,
    private segueService: SegueService,
    public authService: AuthService,
    public themeService: ThemeService,
    private salvataggioService: SalvataggioService
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

  toggleSegui(): void {
    const p = this.profilo();
    if (!p || this.seguendoInProgress()) return;
    this.seguendoInProgress.set(true);
    const action$ = p.seguito
      ? this.segueService.smettiDiSeguire(p.username)
      : this.segueService.segui(p.username);

    action$.subscribe({
      next: () => {
        this.profilo.update(current => {
          if (!current) return current;
          const delta = current.seguito ? -1 : 1;
          return { ...current, seguito: !current.seguito, numSeguaci: current.numSeguaci + delta };
        });
      },
      complete: () => this.seguendoInProgress.set(false),
      error: () => this.seguendoInProgress.set(false)
    });
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

  apriTab(tab: 'post' | 'salvati'): void {
    this.tabAttiva.set(tab);
    if (tab === 'salvati' && this.postSalvati().length === 0 && !this.loadingSalvati()) {
      this.loadPostSalvati();
    }
  }

  loadPostSalvati(): void {
    this.loadingSalvati.set(true);
    this.salvataggioService.mieiSalvataggiPosts().subscribe({
      next: (posts) => { this.postSalvati.set(posts); this.loadingSalvati.set(false); },
      error: () => this.loadingSalvati.set(false)
    });
  }

  rimuoviSalvataggio(postId: number): void {
    this.salvataggioService.rimuovi(postId).subscribe({
      next: () => this.postSalvati.update(list => list.filter(p => p.id !== postId))
    });
  }

  tornaHome(): void {
    this.router.navigate(['/home']);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  }

  getRuoloLabel(ruolo?: string): { label: string; icon: string; css: string } {
    switch (ruolo?.toUpperCase()) {
      case 'ADMIN':       return { label: 'Admin',       icon: 'fas fa-shield-halved', css: 'tag-admin' };
      case 'PROFESSORE':  return { label: 'Professore',  icon: 'fas fa-chalkboard-user', css: 'tag-professore' };
      case 'STUDENTE':    return { label: 'Studente',    icon: 'fas fa-graduation-cap', css: 'tag-studente' };
      default:            return { label: ruolo || '',   icon: 'fas fa-user',           css: 'tag-default' };
    }
  }
}
