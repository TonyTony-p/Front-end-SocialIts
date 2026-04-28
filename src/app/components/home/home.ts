import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { PostDto } from '../dto/PostDto';
import { PostService } from '../../services/post-service';
import { LikeService } from '../../services/like-service';
import { SondaggioService } from '../../services/sondaggio-service';
import { Observable, forkJoin, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { CommentoService } from '../../services/commento-service';
import { Router } from '@angular/router';
import { ChatComponent } from '../chat/chat';
import { ThemeService } from '../../services/theme.service';
import { UtenteService } from '../../services/utente-service';
import { ProfiloDto } from '../dto/ProfiloDto';
import { ClasseCorsoService } from '../../services/classe-corso-service';
import { AnnuncioDto, IscrizioneClasseDto } from '../dto/ClasseCorsoDto';

type FeedTab = 'tutti' | 'seguiti' | 'annunci';

interface AnnuncioConClasse extends AnnuncioDto {
  classeNome: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit, OnDestroy {

  @ViewChild(ChatComponent) chatComponent!: ChatComponent;

  private scrollObserver?: IntersectionObserver;

  @ViewChild('scrollSentinel') set scrollSentinel(el: ElementRef | undefined) {
    this.scrollObserver?.disconnect();
    if (el) {
      this.scrollObserver = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) this.loadMorePosts();
      }, { threshold: 0.1 });
      this.scrollObserver.observe(el.nativeElement);
    }
  }

  readonly PAGE_SIZE = 10;

  feedTab = signal<FeedTab>('tutti');
  posts = signal<PostDto[]>([]);
  loading = signal<boolean>(true);
  error = signal<string>('');
  currentPage = signal<number>(0);
  hasMore = signal<boolean>(true);
  loadingMore = signal<boolean>(false);

  postsSeguiti = signal<PostDto[]>([]);
  loadingSeguiti = signal<boolean>(false);
  errorSeguiti = signal<string>('');

  annunciClassi = signal<AnnuncioConClasse[]>([]);
  loadingAnnunci = signal<boolean>(false);
  errorAnnunci = signal<string>('');
  mieiLikeIds = signal<Set<number>>(new Set());
  likingInProgress = signal<Set<number>>(new Set());

  tendenze = signal<PostDto[]>([]);
  loadingTendenze = signal<boolean>(true);
  errorTendenze = signal<string>('');
  mostraTendenze = signal<boolean>(true);

  nuoviCommenti = signal<Map<number, string>>(new Map());
  commentoInCaricamento = signal<Set<number>>(new Set());
  mostraCommenti = signal<Set<number>>(new Set());
  mostraCommentiTendenze = signal<Set<number>>(new Set());
  commentoInModifica = signal<number | null>(null);
  testoModifica = signal<string>('');
  mostraModaleEliminazione = signal<boolean>(false);
  commentoDaEliminare = signal<{postId: number, commentoId: number} | null>(null);
  postDaEliminare = signal<{postId: number} | null>(null);

  composerAperto = signal<boolean>(false);
  testoNuovoPost = signal<string>('');
  pubblicandoPost = signal<boolean>(false);
  readonly MAX_CHARS = 500;

  @ViewChild('composerImageInput') composerImageInput!: ElementRef<HTMLInputElement>;
  @ViewChild('composerDocInput') composerDocInput!: ElementRef<HTMLInputElement>;
  composerFiles: File[] = [];
  composerPreviewUrls: string[] = [];
  menuAllegatiAperto = signal<boolean>(false);

  // Poll state for composer
  composerSondaggioAttivo = signal<boolean>(false);
  composerDomanda = '';
  composerOpzioni: string[] = ['', ''];
  composerDurata = 1;
  readonly DURATE = [1, 3, 7, 14];
  readonly MAX_OPZIONI = 5;

  // Vote tracking
  votandoInProgress = signal<Set<number>>(new Set());

  // Like animation
  likeAnimatingIds = signal<Set<number>>(new Set());

  // Search
  searchQuery = signal<string>('');
  searchResults = signal<ProfiloDto[]>([]);
  searching = signal<boolean>(false);
  searchError = signal<string>('');
  showSearchResults = signal<boolean>(false);

  constructor(
    private router: Router,
    private postService: PostService,
    private sondaggioService: SondaggioService,
    public authService: AuthService,
    private likeService: LikeService,
    private commentoService: CommentoService,
    public themeService: ThemeService,
    private utenteService: UtenteService,
    private classeService: ClasseCorsoService
  ) {}

  ngOnInit(): void {
    this.loadPosts();
    this.loadTendenze();
    this.loadMieiLike();
  }

  ngOnDestroy(): void {
    this.scrollObserver?.disconnect();
  }

  logout(): void { this.authService.logout(); }

  apriChat(): void { this.chatComponent?.open(); }

  navigateToCreatePost(): void { this.router.navigate(['/crea-post']); }
  navigateToProfilo(): void { this.router.navigate(['/profilo', this.authService.getCurrentUsername()]); }
  navigateToProfiloDiUtente(username: string): void { this.router.navigate(['/profilo', username]); }
  navigateTo(path: string): void { this.router.navigate([path]); }
  navigateToMieClassi(): void {
    this.router.navigate([this.authService.isProfessore() ? '/classi/mie' : '/dashboard-studente']);
  }

  cambiaTab(tab: FeedTab): void {
    this.feedTab.set(tab);
    if (tab === 'seguiti' && this.postsSeguiti().length === 0 && !this.loadingSeguiti()) {
      this.loadPostSeguiti();
    }
    if (tab === 'annunci' && this.annunciClassi().length === 0 && !this.loadingAnnunci()) {
      this.loadAnnunciClassi();
    }
  }

  loadAnnunciClassi(): void {
    this.loadingAnnunci.set(true);
    this.errorAnnunci.set('');
    this.classeService.miIscrizioni().pipe(
      switchMap((iscrizioni: IscrizioneClasseDto[]) => {
        const approvate = iscrizioni.filter(i => i.stato === 'APPROVATA');
        if (approvate.length === 0) return of([] as AnnuncioConClasse[]);
        return forkJoin(
          approvate.map(i =>
            this.classeService.listaAnnunci(i.classeId).pipe(
              map((annunci: AnnuncioDto[]) => annunci.map(a => ({ ...a, classeNome: i.classeNome }))),
              catchError(() => of([] as AnnuncioConClasse[]))
            )
          )
        ).pipe(
          map((results: AnnuncioConClasse[][]) => {
            const all = results.flat();
            all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return all;
          })
        );
      })
    ).subscribe({
      next: (annunci) => { this.annunciClassi.set(annunci); this.loadingAnnunci.set(false); },
      error: () => { this.errorAnnunci.set('Errore nel caricamento degli annunci.'); this.loadingAnnunci.set(false); }
    });
  }

  loadPostSeguiti(): void {
    this.loadingSeguiti.set(true);
    this.errorSeguiti.set('');
    this.postService.getPostDaSeguiti().subscribe({
      next: data => { this.postsSeguiti.set(data); this.loadingSeguiti.set(false); },
      error: () => { this.errorSeguiti.set('Impossibile caricare i post dei seguiti.'); this.loadingSeguiti.set(false); }
    });
  }

  apriComposer(): void { this.composerAperto.set(true); }
  chiudiComposer(): void {
    this.composerAperto.set(false);
    this.testoNuovoPost.set('');
    this.composerPreviewUrls.forEach(u => URL.revokeObjectURL(u));
    this.composerFiles = [];
    this.composerPreviewUrls = [];
    this.menuAllegatiAperto.set(false);
    this.composerSondaggioAttivo.set(false);
    this.composerDomanda = '';
    this.composerOpzioni = ['', ''];
    this.composerDurata = 1;
  }

  toggleComposerSondaggio(): void {
    this.composerSondaggioAttivo.update(v => !v);
    if (!this.composerSondaggioAttivo()) {
      this.composerDomanda = '';
      this.composerOpzioni = ['', ''];
      this.composerDurata = 1;
    }
  }

  aggiungiOpzioneComposer(): void {
    if (this.composerOpzioni.length < this.MAX_OPZIONI) {
      this.composerOpzioni = [...this.composerOpzioni, ''];
    }
  }

  rimuoviOpzioneComposer(index: number): void {
    if (this.composerOpzioni.length > 2) {
      this.composerOpzioni = this.composerOpzioni.filter((_, i) => i !== index);
    }
  }

  trackByIndex(index: number): number { return index; }

  get composerSondaggioValido(): boolean {
    return this.composerDomanda.trim().length > 0 &&
      this.composerOpzioni.filter(o => o.trim().length > 0).length >= 2;
  }

  votaSondaggio(postId: number, idOpzione: number): void {
    if (this.votandoInProgress().has(postId)) return;
    this.votandoInProgress.update(s => new Set(s).add(postId));
    this.sondaggioService.vota(idOpzione).subscribe({
      next: sondaggioAggiornato => {
        const aggiorna = (posts: PostDto[]) =>
          posts.map(p => p.id === postId ? { ...p, sondaggio: sondaggioAggiornato } : p);
        this.posts.update(aggiorna);
        this.postsSeguiti.update(aggiorna);
      },
      complete: () => this.votandoInProgress.update(s => { const ns = new Set(s); ns.delete(postId); return ns; }),
      error: () => this.votandoInProgress.update(s => { const ns = new Set(s); ns.delete(postId); return ns; })
    });
  }
  aggiornaTesto(testo: string): void {
    this.testoNuovoPost.set(testo);
  }

  toggleMenuAllegati(event: Event): void {
    event.stopPropagation();
    this.menuAllegatiAperto.update(v => !v);
  }

  @HostListener('document:click')
  chiudiMenuAllegati(): void { this.menuAllegatiAperto.set(false); }

  apriSelezioneImmagine(): void {
    this.menuAllegatiAperto.set(false);
    this.composerImageInput.nativeElement.click();
  }

  apriSelezioneDocumento(): void {
    this.menuAllegatiAperto.set(false);
    this.composerDocInput.nativeElement.click();
  }

  onComposerFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const nuovi = Array.from(input.files);
    if (this.composerFiles.length + nuovi.length > 5) return;
    const nuoveUrl = nuovi.map(f => f.type.startsWith('image/') ? URL.createObjectURL(f) : '');
    this.composerFiles = [...this.composerFiles, ...nuovi];
    this.composerPreviewUrls = [...this.composerPreviewUrls, ...nuoveUrl];
    input.value = '';
  }

  rimuoviComposerFile(index: number): void {
    URL.revokeObjectURL(this.composerPreviewUrls[index]);
    this.composerFiles = this.composerFiles.filter((_, i) => i !== index);
    this.composerPreviewUrls = this.composerPreviewUrls.filter((_, i) => i !== index);
  }

  isComposerImage(file: File): boolean { return file.type.startsWith('image/'); }

  pubblicaNuovoPost(): void {
    const testo = this.testoNuovoPost().trim();
    if (!testo || this.pubblicandoPost()) return;
    if (this.composerSondaggioAttivo() && !this.composerSondaggioValido) return;
    this.pubblicandoPost.set(true);
    const sondaggio = this.composerSondaggioAttivo() ? {
      domanda: this.composerDomanda.trim(),
      opzioni: this.composerOpzioni.filter(o => o.trim().length > 0),
      durataGiorni: this.composerDurata
    } : undefined;
    this.postService.createPost(testo, this.composerFiles, sondaggio).subscribe({
      next: nuovoPost => {
        this.posts.update(posts => [nuovoPost, ...posts]);
        this.chiudiComposer();
      },
      error: () => this.pubblicandoPost.set(false),
      complete: () => this.pubblicandoPost.set(false)
    });
  }

  loadPosts(): void {
    this.loading.set(true);
    this.error.set('');
    this.currentPage.set(0);
    this.hasMore.set(true);
    this.postService.getAllPosts(0, this.PAGE_SIZE).subscribe({
      next: data => {
        this.posts.set(data);
        this.hasMore.set(data.length === this.PAGE_SIZE);
        this.loading.set(false);
      },
      error: err => { this.error.set('Impossibile caricare i post: ' + (err.message || 'Errore sconosciuto')); this.loading.set(false); }
    });
  }

  loadMorePosts(): void {
    if (!this.hasMore() || this.loadingMore() || this.loading()) return;
    this.loadingMore.set(true);
    const nextPage = this.currentPage() + 1;
    this.postService.getAllPosts(nextPage, this.PAGE_SIZE).subscribe({
      next: data => {
        this.posts.update(posts => [...posts, ...data]);
        this.currentPage.set(nextPage);
        this.hasMore.set(data.length === this.PAGE_SIZE);
        this.loadingMore.set(false);
      },
      error: () => this.loadingMore.set(false)
    });
  }

  loadTendenze(): void {
    this.loadingTendenze.set(true);
    this.errorTendenze.set('');
    this.postService.getTendenze().subscribe({
      next: data => { this.tendenze.set(data); this.loadingTendenze.set(false); },
      error: err => { this.errorTendenze.set('Impossibile caricare i post di tendenza: ' + (err.message || 'Errore sconosciuto')); this.loadingTendenze.set(false); }
    });
  }

  toggleMostraTendenze(): void { this.mostraTendenze.update(v => !v); }

  loadMieiLike(): void {
    this.likeService.getMieiLike().subscribe({
      next: (response: any) => {
        let lista = Array.isArray(response) ? response : Array.isArray(response.content) ? response.content : [];
        const likeIds = new Set<number>(lista.map((like: any) => Number(like.idPost)));
        this.mieiLikeIds.set(likeIds);
      }
    });
  }

  toggleLike(post: PostDto): void {
    const postId = post.id;
    if (this.isLikingInProgress(postId)) return;
    this.likingInProgress.update(set => new Set(set).add(postId));
    const alreadyLiked = this.hasLiked(postId);
    const action$: Observable<any> = alreadyLiked ? this.likeService.rimuoviLike(postId) : this.likeService.creaLike(postId);

    action$.subscribe({
      next: () => {
        const aggiorna = (posts: PostDto[]) => posts.map(p => p.id === postId ? { ...p, numeroLike: (p.numeroLike ?? 0) + (alreadyLiked ? -1 : 1) } : p);
        this.posts.update(aggiorna);
        this.tendenze.update(aggiorna);
        this.postsSeguiti.update(aggiorna);
        this.mieiLikeIds.update(set => {
          const ns = new Set(set);
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
      complete: () => { this.likingInProgress.update(set => { const ns = new Set(set); ns.delete(postId); return ns; }); }
    });
  }

  toggleCommenti(postId: number): void {
    this.mostraCommenti.update(set => {
      const ns = new Set(set);
      ns.has(postId) ? ns.delete(postId) : ns.add(postId);
      return ns;
    });
  }
  toggleCommentiTendenze(postId: number): void {
    this.mostraCommentiTendenze.update(set => {
      const ns = new Set(set);
      ns.has(postId) ? ns.delete(postId) : ns.add(postId);
      return ns;
    });
  }
  sonoCommentiVisibili(postId: number): boolean { return this.mostraCommenti().has(postId); }
  sonoCommentiVisibiliTendenze(postId: number): boolean { return this.mostraCommentiTendenze().has(postId); }

  aggiornaTestoCommento(postId: number, testo: string): void {
    this.nuoviCommenti.update(map => { const nm = new Map(map); nm.set(postId, testo); return nm; });
  }
  getTestoCommento(postId: number): string { return this.nuoviCommenti().get(postId) || ''; }
  isCommentoInCaricamento(postId: number): boolean { return this.commentoInCaricamento().has(postId); }

  aggiungiCommento(postId: number): void {
    const testo = this.nuoviCommenti().get(postId)?.trim();
    if (!testo) return;
    this.commentoInCaricamento.update(set => new Set(set).add(postId));
    this.commentoService.creaCommento({ idPost: postId, testo }).subscribe({
      next: nuovoCommento => {
        const aggiorna = (posts: PostDto[]) => posts.map(p => p.id === postId ? { ...p, commenti: [...(p.commenti || []), nuovoCommento] } : p);
        this.posts.update(aggiorna);
        this.tendenze.update(aggiorna);
        this.postsSeguiti.update(aggiorna);
        this.nuoviCommenti.update(map => { const nm = new Map(map); nm.delete(postId); return nm; });
      },
      complete: () => { this.commentoInCaricamento.update(set => { const ns = new Set(set); ns.delete(postId); return ns; }); }
    });
  }

  iniziaModificaCommento(commentoId: number, testoAttuale: string): void { this.commentoInModifica.set(commentoId); this.testoModifica.set(testoAttuale); }
  annullaModifica(): void { this.commentoInModifica.set(null); this.testoModifica.set(''); }

  salvaModificaCommento(postId: number, commentoId: number): void {
    const nuovoTesto = this.testoModifica().trim();
    if (!nuovoTesto) return;
    this.commentoService.aggiornaCommento(commentoId, { idPost: postId, testo: nuovoTesto }).subscribe({
      next: commentoAggiornato => {
        const aggiorna = (posts: PostDto[]) => posts.map(p => p.id === postId && p.commenti ? { ...p, commenti: p.commenti.map(c => c.idCommento === commentoId ? commentoAggiornato : c) } : p);
        this.posts.update(aggiorna);
        this.tendenze.update(aggiorna);
        this.postsSeguiti.update(aggiorna);
        this.annullaModifica();
      }
    });
  }

  posoModificareCommento(commento: any): boolean { return this.authService.getCurrentUsername() === commento.utente?.username; }
  possoModificareCommento(commento: any): boolean { return this.authService.getCurrentUsername() === commento.utente?.username; }
  possoEliminarePost(post: PostDto): boolean { return this.authService.getCurrentUsername() === post.usernameUtente; }

  // --- MODALE UNIFICATA ---
  apriModaleEliminazioneCommento(postId: number, commentoId: number): void {
    this.commentoDaEliminare.set({ postId, commentoId });
    this.postDaEliminare.set(null);
    this.mostraModaleEliminazione.set(true);
  }

  apriModaleEliminazionePost(post: PostDto): void {
    if (!this.possoEliminarePost(post)) return;
    this.postDaEliminare.set({ postId: post.id });
    this.commentoDaEliminare.set(null);
    this.mostraModaleEliminazione.set(true);
  }

  chiudiModaleEliminazione(): void {
    this.commentoDaEliminare.set(null);
    this.postDaEliminare.set(null);
    this.mostraModaleEliminazione.set(false);
  }

  confermaEliminazione(): void {
    if (this.commentoDaEliminare()) this.confermaEliminazioneCommento();
    else if (this.postDaEliminare()) this.confermaEliminazionePost();
  }

  confermaEliminazioneCommento(): void {
    const dati = this.commentoDaEliminare();
    if (!dati) return;
    const { postId, commentoId } = dati;
    this.commentoService.eliminaCommento(commentoId).subscribe({
      next: () => {
        const aggiorna = (posts: PostDto[]) => posts.map(p => p.id === postId && p.commenti ? { ...p, commenti: p.commenti.filter(c => c.idCommento !== commentoId) } : p);
        this.posts.update(aggiorna);
        this.tendenze.update(aggiorna);
        this.postsSeguiti.update(aggiorna);
        this.chiudiModaleEliminazione();
      }
    });
  }

  confermaEliminazionePost(): void {
    const dati = this.postDaEliminare();
    if (!dati) return;
    const { postId } = dati;
    this.postService.deletePost(postId).subscribe({
      next: () => {
        const aggiorna = (posts: PostDto[]) => posts.filter(p => p.id !== postId);
        this.posts.update(aggiorna);
        this.tendenze.update(aggiorna);
        this.postsSeguiti.update(aggiorna);
        this.chiudiModaleEliminazione();
      }
    });
  }

  // --- Helper ---
  hasLiked(postId: number): boolean { return this.mieiLikeIds().has(postId); }
  isLikingInProgress(postId: number): boolean { return this.likingInProgress().has(postId); }
  formatDate(dataOra: string): string { return new Date(dataOra).toLocaleString('it-IT', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }); }
  trackByPostId(_index: number, post: PostDto) { return post.id; }

  getRuoloLabel(ruolo?: string): { label: string; icon: string; css: string } {
    switch (ruolo?.toUpperCase()) {
      case 'ADMIN':      return { label: 'Admin',      icon: 'fas fa-shield-halved',   css: 'tag-admin' };
      case 'PROFESSORE': return { label: 'Professore', icon: 'fas fa-chalkboard-user', css: 'tag-professore' };
      case 'STUDENTE':   return { label: 'Studente',   icon: 'fas fa-graduation-cap',  css: 'tag-studente' };
      default:           return { label: ruolo || '',  icon: 'fas fa-user',            css: 'tag-default' };
    }
  }
  trackByCommentId(_index: number, commento: any) { return commento.idCommento; }

  // --- Search ---
  onSearchInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery.set(query);
    if (query.trim().length > 0) {
      this.performSearch(query.trim());
    } else {
      this.showSearchResults.set(false);
      this.searchResults.set([]);
    }
  }

  performSearch(query: string): void {
    this.searching.set(true);
    this.searchError.set('');
    this.utenteService.searchProfiles(query).subscribe({
      next: results => {
        this.searchResults.set(results);
        this.showSearchResults.set(true);
        this.searching.set(false);
      },
      error: () => {
        this.searchError.set('Errore durante la ricerca.');
        this.searching.set(false);
      }
    });
  }

  onSearchBlur(): void {
    setTimeout(() => this.showSearchResults.set(false), 200);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.showSearchResults.set(false);
    this.searchError.set('');
  }
}