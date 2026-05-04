import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { UtenteService } from '../../services/utente-service';
import { SegueService } from '../../services/segue-service';
import { ThemeService } from '../../services/theme.service';
import { SalvataggioService } from '../../services/salvataggio-service';
import { LikeService } from '../../services/like-service';
import { CommentoService } from '../../services/commento-service';
import { PostService } from '../../services/post-service';
import { NotificaService } from '../../services/notifica.service';
import { ProfiloDto } from '../dto/ProfiloDto';
import { ProfiloFormDto } from '../dto/ProfiloFormDto';
import { PostDto } from '../dto/PostDto';
import { NotificaDto } from '../dto/NotificaDto';
import { Observable, Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-profilo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profilo.html',
  styleUrls: ['./profilo.css']
})
export class ProfiloComponent implements OnInit, OnDestroy {

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

  // Unfollow confirmation
  mostraModaleUnfollow = signal<boolean>(false);

  form: ProfiloFormDto = {};

  // Like state
  mieiLikeIds = signal<Set<number>>(new Set());
  likingInProgress = signal<Set<number>>(new Set());
  likeAnimatingIds = signal<Set<number>>(new Set());

  // Save state
  salvatiIds = signal<Set<number>>(new Set());
  salvandoInProgress = signal<Set<number>>(new Set());

  // Comment state
  mostraCommenti = signal<Set<number>>(new Set());
  nuoviCommenti = signal<Map<number, string>>(new Map());
  commentoInCaricamento = signal<Set<number>>(new Set());

  // Delete modal
  mostraModaleEliminazione = signal<boolean>(false);
  postDaEliminare = signal<{ postId: number } | null>(null);
  eliminandoPost = signal<boolean>(false);
  erroreEliminazione = signal<string>('');

  // Notifications
  notifiche = signal<NotificaDto[]>([]);
  nonLetteCount = signal<number>(0);
  loadingNotifiche = signal<boolean>(false);
  pannelloNotificheAperto = signal<boolean>(false);

  gruppiNotifiche = computed(() => {
    const now = new Date();
    const groups = new Map<string, NotificaDto[]>();
    for (const n of this.notifiche()) {
      const diffDays = Math.floor((now.getTime() - new Date(n.createdAt).getTime()) / 86400000);
      const label = diffDays === 0 ? 'Oggi' : diffDays === 1 ? 'Ieri' : `${diffDays} giorni fa`;
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label)!.push(n);
    }
    return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
  });

  private pollingNotifiche?: Subscription;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private utenteService: UtenteService,
    private segueService: SegueService,
    public authService: AuthService,
    public themeService: ThemeService,
    private salvataggioService: SalvataggioService,
    private likeService: LikeService,
    private commentoService: CommentoService,
    private postService: PostService,
    private notificaService: NotificaService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const username = params.get('username');
      if (username) this.caricaProfilo(username);
    });
    this.loadMieiLike();
    this.loadMieiSalvataggi();
    this.aggiornaContatoreNotifiche();
    this.pollingNotifiche = interval(8000).subscribe(() => this.aggiornaContatoreNotifiche());
  }

  ngOnDestroy(): void {
    this.pollingNotifiche?.unsubscribe();
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

  // ── Segui / Unfollow ───────────────────────────────────────────────────────

  toggleSegui(): void {
    const p = this.profilo();
    if (!p || this.seguendoInProgress()) return;
    if (p.seguito) {
      this.mostraModaleUnfollow.set(true);
      return;
    }
    this.eseguiToggleSegui();
  }

  confermaUnfollow(): void {
    this.mostraModaleUnfollow.set(false);
    this.eseguiToggleSegui();
  }

  annullaUnfollow(): void {
    this.mostraModaleUnfollow.set(false);
  }

  private eseguiToggleSegui(): void {
    const p = this.profilo();
    if (!p) return;
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

  // ── Modifica profilo ───────────────────────────────────────────────────────

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

  // ── Tab ────────────────────────────────────────────────────────────────────

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

  tornaHome(): void {
    this.router.navigate(['/home']);
  }

  navigateToProfiloDiUtente(username: string): void {
    this.router.navigate(['/profilo', username]);
  }

  // ── Notifiche ──────────────────────────────────────────────────────────────

  aggiornaContatoreNotifiche(): void {
    this.notificaService.getContatore().subscribe({
      next: r => this.nonLetteCount.set(r.nonLette)
    });
  }

  apriPannelloNotifiche(): void {
    this.pannelloNotificheAperto.set(true);
    if (this.notifiche().length === 0 && !this.loadingNotifiche()) {
      this.loadingNotifiche.set(true);
      this.notificaService.getNotifiche().subscribe({
        next: data => { this.notifiche.set(data); this.loadingNotifiche.set(false); }
      });
    }
  }

  chiudiPannelloNotifiche(): void {
    this.pannelloNotificheAperto.set(false);
  }

  segnaComeLetta(n: NotificaDto): void {
    if (n.letta) return;
    this.notificaService.segnaComeLetta(n.id).subscribe(() => {
      this.notifiche.update(list => list.map(x => x.id === n.id ? { ...x, letta: true } : x));
      this.nonLetteCount.update(c => Math.max(0, c - 1));
    });
  }

  segnaComeLetteTutte(): void {
    this.notificaService.segnaComeLetteTutte().subscribe(() => {
      this.notifiche.update(list => list.map(x => ({ ...x, letta: true })));
      this.nonLetteCount.set(0);
    });
  }

  eliminaNotifica(id: number): void {
    this.notificaService.elimina(id).subscribe(() => {
      const rimossa = this.notifiche().find(x => x.id === id);
      this.notifiche.update(list => list.filter(x => x.id !== id));
      if (rimossa && !rimossa.letta) this.nonLetteCount.update(c => Math.max(0, c - 1));
    });
  }

  navigaANotifica(n: NotificaDto): void {
    this.segnaComeLetta(n);
    this.chiudiPannelloNotifiche();
    if (n.tipoRiferimento === 'POST') {
      this.router.navigate(['/home']);
    } else if (n.tipoRiferimento === 'UTENTE') {
      this.navigateToProfiloDiUtente(n.attoreUsername);
    } else if (n.tipoRiferimento === 'CONVERSAZIONE') {
      this.router.navigate(['/messaggi', n.attoreUsername]);
    } else if (n.tipoRiferimento === 'CLASSE' || n.tipoRiferimento === 'ANNUNCIO') {
      this.router.navigate(['/classi', n.idRiferimento]);
    }
  }

  getIconaNotifica(tipo: string): string {
    switch (tipo) {
      case 'LIKE': return 'fa-solid fa-star';
      case 'COMMENTO': return 'fa-regular fa-comment';
      case 'FOLLOW': return 'fas fa-user-plus';
      case 'ISCRIZIONE_RICHIESTA': return 'fas fa-user-clock';
      case 'ISCRIZIONE_APPROVATA': return 'fas fa-circle-check';
      case 'ISCRIZIONE_RIFIUTATA': return 'fas fa-circle-xmark';
      case 'ANNUNCIO': return 'fas fa-bullhorn';
      case 'MESSAGGIO': return 'fa-regular fa-envelope';
      default: return 'fa-regular fa-bell';
    }
  }

  getColoreNotifica(tipo: string): string {
    switch (tipo) {
      case 'LIKE': return 'nt-yellow';
      case 'COMMENTO': return 'nt-blue';
      case 'FOLLOW': return 'nt-green';
      case 'ISCRIZIONE_RICHIESTA': return 'nt-orange';
      case 'ISCRIZIONE_APPROVATA': return 'nt-green';
      case 'ISCRIZIONE_RIFIUTATA': return 'nt-red';
      case 'ANNUNCIO': return 'nt-purple';
      case 'MESSAGGIO': return 'nt-blue';
      default: return 'nt-gray';
    }
  }

  // ── Likes ──────────────────────────────────────────────────────────────────

  loadMieiLike(): void {
    this.likeService.getMieiLike().subscribe({
      next: (response: any) => {
        const lista = Array.isArray(response) ? response
          : Array.isArray(response.content) ? response.content : [];
        this.mieiLikeIds.set(new Set<number>(lista.map((l: any) => Number(l.idPost))));
      }
    });
  }

  hasLiked(postId: number): boolean { return this.mieiLikeIds().has(postId); }
  isLikingInProgress(postId: number): boolean { return this.likingInProgress().has(postId); }

  toggleLike(post: PostDto): void {
    const postId = post.id;
    if (this.isLikingInProgress(postId)) return;
    this.likingInProgress.update(s => new Set(s).add(postId));
    const alreadyLiked = this.hasLiked(postId);
    const action$: Observable<any> = alreadyLiked
      ? this.likeService.rimuoviLike(postId)
      : this.likeService.creaLike(postId);

    action$.subscribe({
      next: () => {
        const aggiorna = (posts: PostDto[]) => posts.map(p =>
          p.id === postId ? { ...p, numeroLike: (p.numeroLike ?? 0) + (alreadyLiked ? -1 : 1) } : p);
        this.profilo.update(p => p ? { ...p, posts: aggiorna(p.posts) } : p);
        this.postSalvati.update(aggiorna);
        this.mieiLikeIds.update(s => {
          const ns = new Set(s);
          alreadyLiked ? ns.delete(postId) : ns.add(postId);
          return ns;
        });
        if (!alreadyLiked) {
          this.likeAnimatingIds.update(s => new Set(s).add(postId));
          setTimeout(() => {
            this.likeAnimatingIds.update(s => { const ns = new Set(s); ns.delete(postId); return ns; });
          }, 600);
        }
      },
      error: () => { this.likingInProgress.update(s => { const ns = new Set(s); ns.delete(postId); return ns; }); },
      complete: () => { this.likingInProgress.update(s => { const ns = new Set(s); ns.delete(postId); return ns; }); }
    });
  }

  // ── Salvataggi ─────────────────────────────────────────────────────────────

  loadMieiSalvataggi(): void {
    this.salvataggioService.mieiSalvataggi().subscribe({
      next: (ids) => this.salvatiIds.set(new Set<number>(ids))
    });
  }

  hasSalvato(postId: number): boolean { return this.salvatiIds().has(postId); }

  toggleSalvataggio(postId: number): void {
    if (this.salvandoInProgress().has(postId)) return;
    this.salvandoInProgress.update(s => new Set(s).add(postId));
    const giaSalvato = this.hasSalvato(postId);
    const action$ = giaSalvato
      ? this.salvataggioService.rimuovi(postId)
      : this.salvataggioService.salva(postId);
    action$.subscribe({
      next: () => {
        this.salvatiIds.update(s => {
          const ns = new Set(s);
          giaSalvato ? ns.delete(postId) : ns.add(postId);
          return ns;
        });
        if (giaSalvato && this.tabAttiva() === 'salvati') {
          this.postSalvati.update(list => list.filter(p => p.id !== postId));
        }
      },
      error: () => { this.salvandoInProgress.update(s => { const ns = new Set(s); ns.delete(postId); return ns; }); },
      complete: () => { this.salvandoInProgress.update(s => { const ns = new Set(s); ns.delete(postId); return ns; }); }
    });
  }

  // ── Commenti ───────────────────────────────────────────────────────────────

  toggleCommenti(postId: number): void {
    this.mostraCommenti.update(s => {
      const ns = new Set(s);
      ns.has(postId) ? ns.delete(postId) : ns.add(postId);
      return ns;
    });
  }

  sonoCommentiVisibili(postId: number): boolean { return this.mostraCommenti().has(postId); }

  aggiornaTestoCommento(postId: number, testo: string): void {
    this.nuoviCommenti.update(m => { const nm = new Map(m); nm.set(postId, testo); return nm; });
  }

  getTestoCommento(postId: number): string { return this.nuoviCommenti().get(postId) || ''; }
  isCommentoInCaricamento(postId: number): boolean { return this.commentoInCaricamento().has(postId); }

  aggiungiCommento(postId: number): void {
    const testo = this.nuoviCommenti().get(postId)?.trim();
    if (!testo) return;
    this.commentoInCaricamento.update(s => new Set(s).add(postId));
    this.commentoService.creaCommento({ idPost: postId, testo }).subscribe({
      next: nuovoCommento => {
        const aggiorna = (posts: PostDto[]) => posts.map(p =>
          p.id === postId ? { ...p, commenti: [...(p.commenti || []), nuovoCommento] } : p);
        this.profilo.update(p => p ? { ...p, posts: aggiorna(p.posts) } : p);
        this.postSalvati.update(aggiorna);
        this.nuoviCommenti.update(m => { const nm = new Map(m); nm.delete(postId); return nm; });
      },
      error: () => { this.commentoInCaricamento.update(s => { const ns = new Set(s); ns.delete(postId); return ns; }); },
      complete: () => { this.commentoInCaricamento.update(s => { const ns = new Set(s); ns.delete(postId); return ns; }); }
    });
  }

  // ── Eliminazione post ──────────────────────────────────────────────────────

  possoEliminarePost(post: PostDto): boolean {
    return this.authService.getCurrentUsername() === post.usernameUtente;
  }

  apriModaleEliminazionePost(post: PostDto): void {
    if (!this.possoEliminarePost(post)) return;
    this.postDaEliminare.set({ postId: post.id });
    this.mostraModaleEliminazione.set(true);
  }

  chiudiModaleEliminazione(): void {
    this.postDaEliminare.set(null);
    this.mostraModaleEliminazione.set(false);
    this.eliminandoPost.set(false);
    this.erroreEliminazione.set('');
  }

  confermaEliminazionePost(): void {
    const dati = this.postDaEliminare();
    if (!dati || this.eliminandoPost()) return;
    this.eliminandoPost.set(true);
    this.erroreEliminazione.set('');
    this.postService.deletePost(dati.postId).subscribe({
      next: () => {
        const id = dati.postId;
        this.profilo.update(p => p ? {
          ...p,
          posts: p.posts.filter(post => post.id !== id),
          numPost: p.numPost - 1
        } : p);
        this.postSalvati.update(list => list.filter(p => p.id !== id));
        this.chiudiModaleEliminazione();
      },
      error: (err) => {
        this.eliminandoPost.set(false);
        const backendMsg = typeof err?.error === 'string' ? err.error : err?.error?.message;
        this.erroreEliminazione.set(backendMsg || 'Errore durante l\'eliminazione. Riprova.');
      }
    });
  }

  // ── Date helpers ───────────────────────────────────────────────────────────

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  }

  formatPostDate(dataOra: string): string {
    return new Date(dataOra).toLocaleString('it-IT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  getRuoloLabel(ruolo?: string): { label: string; icon: string; css: string } {
    switch (ruolo?.toUpperCase()) {
      case 'ADMIN':       return { label: 'Admin',       icon: 'fas fa-shield-halved',   css: 'tag-admin' };
      case 'PROFESSORE':  return { label: 'Professore',  icon: 'fas fa-chalkboard-user', css: 'tag-professore' };
      case 'USER':
      case 'STUDENTE':    return { label: 'Studente',    icon: 'fas fa-graduation-cap',  css: 'tag-studente' };
      default:            return { label: ruolo || '',   icon: 'fas fa-user',            css: 'tag-default' };
    }
  }
}
