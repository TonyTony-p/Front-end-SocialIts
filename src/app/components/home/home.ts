import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { PostDto } from '../dto/PostDto';
import { PostService } from '../../services/post-service';
import { LikeService } from '../../services/like-service';
import { Observable } from 'rxjs';
import { CommentoService } from '../../services/commento-service';
import { Router } from '@angular/router';
import { ChatComponent } from '../chat/chat';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {

  posts = signal<PostDto[]>([]);
  loading = signal<boolean>(true);
  error = signal<string>('');
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

  constructor(
    private router: Router,
    private postService: PostService,
    public authService: AuthService,
    private likeService: LikeService,
    private commentoService: CommentoService
  ) {}

  ngOnInit(): void {
    this.loadPosts();
    this.loadTendenze();
    this.loadMieiLike();
  }

  logout(): void { this.authService.logout(); }
  
  navigateToCreatePost(): void { this.router.navigate(['/crea-post']); }

  loadPosts(): void {
    this.loading.set(true);
    this.error.set('');
    this.postService.getAllPosts().subscribe({
      next: data => { this.posts.set(data); this.loading.set(false); },
      error: err => { this.error.set('Impossibile caricare i post: ' + (err.message || 'Errore sconosciuto')); this.loading.set(false); }
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
        this.mieiLikeIds.update(set => {
          const ns = new Set(set);
          alreadyLiked ? ns.delete(postId) : ns.add(postId);
          return ns;
        });
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
        this.chiudiModaleEliminazione();
      }
    });
  }

  // --- Helper ---
  hasLiked(postId: number): boolean { return this.mieiLikeIds().has(postId); }
  isLikingInProgress(postId: number): boolean { return this.likingInProgress().has(postId); }
  formatDate(dataOra: string): string { return new Date(dataOra).toLocaleString('it-IT', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }); }
  trackByPostId(index: number, post: PostDto) { return post.id; }
  trackByCommentId(index: number, commento: any) { return commento.idCommento; }
}
