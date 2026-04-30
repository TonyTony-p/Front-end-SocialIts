import {
    Component, OnInit, OnDestroy, signal, computed,
    ViewChild, ElementRef, AfterViewChecked, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, interval, Subject } from 'rxjs';
import { switchMap, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MessaggiService } from '../../services/messaggi.service';
import { UtenteService } from '../../services/utente-service';
import { AuthService } from '../../services/auth';
import { ThemeService } from '../../services/theme.service';
import { ConversazioneDto, MessaggioDto } from '../dto/MessaggioDto';
import { ProfiloDto } from '../dto/ProfiloDto';

@Component({
    selector: 'app-messaggi',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './messaggi.html',
    styleUrls: ['./messaggi.css']
})
export class MessaggiComponent implements OnInit, OnDestroy, AfterViewChecked {

    @ViewChild('messagesEnd') messagesEnd!: ElementRef;
    @ViewChild('inputRef') inputRef!: ElementRef;

    // Conversazioni
    conversazioni = signal<ConversazioneDto[]>([]);
    conversazioneAttiva = signal<ConversazioneDto | null>(null);
    messaggi = signal<MessaggioDto[]>([]);
    loading = signal<boolean>(false);
    loadingConv = signal<boolean>(false);

    // Invio
    testo = signal<string>('');
    inviando = signal<boolean>(false);

    // Risposta citata
    msgInRisposta = signal<MessaggioDto | null>(null);

    // Ricerca nuova conversazione
    searchQuery = signal<string>('');
    searchResults = signal<ProfiloDto[]>([]);
    searching = signal<boolean>(false);
    showSearch = signal<boolean>(false);
    private searchSubject = new Subject<string>();
    private searchSub?: Subscription;

    // Inoltro
    showInoltraModal = signal<boolean>(false);
    msgDaInoltrare = signal<MessaggioDto | null>(null);
    inoltrando = signal<boolean>(false);

    // Menu contestuale
    menuAperto = signal<number | null>(null);

    // Modal pin durata
    showPinModal = signal<boolean>(false);
    pendingPinMsg = signal<MessaggioDto | null>(null);
    pinDurationSel = signal<number>(168); // default 7 giorni
    readonly pinOptions = [
        { label: '24 ore', hours: 24 },
        { label: '7 giorni', hours: 168 },
        { label: '30 giorni', hours: 720 }
    ];

    // Pannello messaggi importanti
    showImportantiPanel = signal<boolean>(false);
    messaggiImportanti = computed(() =>
        this.messaggi().filter(m => m.importante && !m.eliminato)
    );

    private pollingConv?: Subscription;
    private pollingMsg?: Subscription;
    private shouldScroll = false;

    altroUsername = computed(() => this.conversazioneAttiva()?.altroUsername ?? '');

    constructor(
        private messaggiService: MessaggiService,
        private utenteService: UtenteService,
        public authService: AuthService,
        public themeService: ThemeService,
        private router: Router,
        private route: ActivatedRoute
    ) {}

    ngOnInit(): void {
        this.loadConversazioni();
        this.pollingConv = interval(5000).subscribe(() => this.refreshConversazioni());

        this.route.params.subscribe(params => {
            if (params['username']) this.apriConversazione(params['username']);
        });

        this.searchSub = this.searchSubject.pipe(
            debounceTime(300), distinctUntilChanged()
        ).subscribe(q => {
            if (!q.trim()) { this.searchResults.set([]); this.searching.set(false); return; }
            this.searching.set(true);
            this.utenteService.searchProfiles(q.trim()).subscribe({
                next: r => { this.searchResults.set(r); this.searching.set(false); },
                error: () => this.searching.set(false)
            });
        });
    }

    ngOnDestroy(): void {
        this.pollingConv?.unsubscribe();
        this.pollingMsg?.unsubscribe();
        this.searchSub?.unsubscribe();
    }

    ngAfterViewChecked(): void {
        if (this.shouldScroll) { this.scrollToBottom(); this.shouldScroll = false; }
    }

    @HostListener('document:click')
    onDocumentClick(): void {
        if (this.menuAperto() !== null) this.menuAperto.set(null);
    }

    // ── Conversazioni ────────────────────────────────────────────
    loadConversazioni(): void {
        this.loading.set(true);
        this.messaggiService.getConversazioni().subscribe({
            next: list => { this.conversazioni.set(list); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    refreshConversazioni(): void {
        this.messaggiService.getConversazioni().subscribe({ next: list => this.conversazioni.set(list) });
    }

    apriConversazione(username: string): void {
        this.chiudiRicerca();
        this.pollingMsg?.unsubscribe();
        this.loadingConv.set(true);
        this.conversazioneAttiva.set(null);
        this.messaggi.set([]);
        this.msgInRisposta.set(null);
        this.showImportantiPanel.set(false);

        this.messaggiService.getConversazione(username).subscribe({
            next: conv => {
                this.conversazioneAttiva.set(conv);
                this.messaggi.set((conv.messaggi ?? []).filter(m => !m.eliminato));
                this.loadingConv.set(false);
                this.shouldScroll = true;
                this.router.navigate(['/messaggi', username], { replaceUrl: true });

                this.pollingMsg = interval(3000).pipe(
                    switchMap(() => this.messaggiService.getConversazione(username))
                ).subscribe({
                    next: updated => {
                        const nuovi = (updated.messaggi ?? []).filter(m => !m.eliminato);
                        const vecchi = this.messaggi();
                        const changed = nuovi.length !== vecchi.length ||
                            nuovi.some((m, i) => vecchi[i]?.letto !== m.letto ||
                                vecchi[i]?.fissato !== m.fissato ||
                                vecchi[i]?.importante !== m.importante);
                        if (changed) {
                            this.messaggi.set(nuovi);
                            if (nuovi.length > vecchi.length) this.shouldScroll = true;
                        }
                        this.conversazioneAttiva.set({ ...updated, messaggi: undefined });
                        this.conversazioni.update(list =>
                            list.map(c => c.altroUsername === username ? { ...c, nonLetti: 0 } : c));
                    }
                });
            },
            error: () => this.loadingConv.set(false)
        });
    }

    tornaAllaLista(): void {
        this.pollingMsg?.unsubscribe();
        this.conversazioneAttiva.set(null);
        this.messaggi.set([]);
        this.msgInRisposta.set(null);
        this.showImportantiPanel.set(false);
        this.router.navigate(['/messaggi']);
    }

    // ── Invio ────────────────────────────────────────────────────
    invia(): void {
        // Legge dal DOM direttamente per evitare problemi di binding con i signal
        const raw = this.inputRef?.nativeElement?.value ?? this.testo();
        const t = raw.trim();
        const dest = this.altroUsername();
        if (!t || !dest || this.inviando()) return;

        this.inviando.set(true);
        const replyId = this.msgInRisposta()?.id ?? null;
        this.messaggiService.invia(dest, t, replyId).subscribe({
            next: msg => {
                this.messaggi.update(list => [...list, msg]);
                // Pulisce sia il signal che il DOM
                this.testo.set('');
                if (this.inputRef?.nativeElement) this.inputRef.nativeElement.value = '';
                this.msgInRisposta.set(null);
                this.inviando.set(false);
                this.shouldScroll = true;
                this.refreshConversazioni();
            },
            error: () => this.inviando.set(false)
        });
    }

    onKeydown(event: KeyboardEvent): void {
        if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); this.invia(); }
    }

    onInput(event: Event): void {
        const val = (event.target as HTMLTextAreaElement).value;
        this.testo.set(val);
    }

    // ── Menu contestuale ─────────────────────────────────────────
    toggleMenu(event: Event, msgId: number): void {
        event.stopPropagation();
        this.menuAperto.set(this.menuAperto() === msgId ? null : msgId);
    }

    // ── Azioni menu ──────────────────────────────────────────────
    rispondi(msg: MessaggioDto): void {
        this.menuAperto.set(null);
        this.msgInRisposta.set(msg);
        setTimeout(() => this.inputRef?.nativeElement.focus(), 50);
    }

    copia(msg: MessaggioDto): void {
        this.menuAperto.set(null);
        if (msg.testo) navigator.clipboard.writeText(msg.testo);
    }

    inoltra(msg: MessaggioDto): void {
        this.menuAperto.set(null);
        this.msgDaInoltrare.set(msg);
        this.showInoltraModal.set(true);
    }

    confermaInoltra(conv: ConversazioneDto): void {
        const msg = this.msgDaInoltrare();
        if (!msg?.testo || this.inoltrando()) return;
        this.inoltrando.set(true);
        const testo = '↪ ' + msg.testo;
        this.messaggiService.invia(conv.altroUsername, testo).subscribe({
            next: () => {
                this.showInoltraModal.set(false);
                this.msgDaInoltrare.set(null);
                this.inoltrando.set(false);
                this.refreshConversazioni();
            },
            error: () => {
                this.inoltrando.set(false);
                alert('Errore durante l\'inoltro. Riprova.');
            }
        });
    }

    chiudiInoltra(): void {
        this.showInoltraModal.set(false);
        this.msgDaInoltrare.set(null);
        this.inoltrando.set(false);
    }

    // ── Pin con durata ───────────────────────────────────────────
    fissa(msg: MessaggioDto): void {
        this.menuAperto.set(null);
        if (msg.fissato) {
            // Desfissa direttamente senza dialogo
            this.messaggiService.toggleFissa(msg.id, null).subscribe({
                next: updated => this.messaggi.update(list =>
                    list.map(m => m.id === updated.id
                        ? { ...m, fissato: updated.fissato, pinnedUntil: updated.pinnedUntil }
                        : m))
            });
        } else {
            // Mostra dialog durata
            this.pinDurationSel.set(168);
            this.pendingPinMsg.set(msg);
            this.showPinModal.set(true);
        }
    }

    confermaFissa(): void {
        const msg = this.pendingPinMsg();
        if (!msg) return;
        this.messaggiService.toggleFissa(msg.id, this.pinDurationSel()).subscribe({
            next: updated => {
                this.messaggi.update(list =>
                    list.map(m => m.id === updated.id
                        ? { ...m, fissato: updated.fissato, pinnedUntil: updated.pinnedUntil }
                        : m));
                this.showPinModal.set(false);
                this.pendingPinMsg.set(null);
            },
            error: () => {
                this.showPinModal.set(false);
                this.pendingPinMsg.set(null);
            }
        });
    }

    chiudiPinModal(): void {
        this.showPinModal.set(false);
        this.pendingPinMsg.set(null);
    }

    // ── Importante ───────────────────────────────────────────────
    importante(msg: MessaggioDto): void {
        this.menuAperto.set(null);
        this.messaggiService.toggleImportante(msg.id).subscribe({
            next: updated => this.messaggi.update(list =>
                list.map(m => m.id === updated.id ? { ...m, importante: updated.importante } : m))
        });
    }

    apriImportanti(): void { this.showImportantiPanel.set(true); }
    chiudiImportanti(): void { this.showImportantiPanel.set(false); }

    // ── Elimina (rimuove dalla lista) ────────────────────────────
    elimina(msg: MessaggioDto): void {
        this.menuAperto.set(null);
        this.messaggiService.eliminaMessaggio(msg.id).subscribe({
            next: () => this.messaggi.update(list => list.filter(m => m.id !== msg.id))
        });
    }

    annullaRisposta(): void { this.msgInRisposta.set(null); }

    // ── Ricerca utenti ───────────────────────────────────────────
    apriRicerca(): void { this.showSearch.set(true); this.searchQuery.set(''); this.searchResults.set([]); }
    chiudiRicerca(): void { this.showSearch.set(false); this.searchQuery.set(''); this.searchResults.set([]); }
    onSearchInput(event: Event): void {
        const q = (event.target as HTMLInputElement).value;
        this.searchQuery.set(q); this.searchSubject.next(q);
    }
    selezionaUtente(profilo: ProfiloDto): void { this.apriConversazione(profilo.username); }

    // ── Stato online ─────────────────────────────────────────────
    statoOnline(conv: ConversazioneDto): string {
        if (!conv.altroLastSeen) return '';
        const min = Math.floor((Date.now() - new Date(conv.altroLastSeen).getTime()) / 60000);
        if (min < 2) return 'Online';
        if (min < 60) return `${min} min fa`;
        const h = Math.floor(min / 60);
        if (h < 24) return `${h}h fa`;
        return `${Math.floor(h / 24)}g fa`;
    }
    isOnline(conv: ConversazioneDto): boolean {
        if (!conv.altroLastSeen) return false;
        return Date.now() - new Date(conv.altroLastSeen).getTime() < 120000;
    }

    // ── Utility ──────────────────────────────────────────────────
    isMio(msg: MessaggioDto): boolean {
        return msg.mittenteUsername === this.authService.getCurrentUsername();
    }
    initiali(conv: ConversazioneDto): string {
        return (conv.altroNome.charAt(0) + conv.altroCognome.charAt(0)).toUpperCase();
    }
    inizialiProfilo(p: ProfiloDto): string {
        return (p.nome.charAt(0) + p.cognome.charAt(0)).toUpperCase();
    }
    formatTime(d: string): string {
        return new Date(d).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    }
    formatData(d: string): string {
        const date = new Date(d), oggi = new Date(), ieri = new Date(oggi);
        ieri.setDate(ieri.getDate() - 1);
        if (date.toDateString() === oggi.toDateString()) return 'Oggi';
        if (date.toDateString() === ieri.toDateString()) return 'Ieri';
        return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
    }
    formatUltimoMsg(conv: ConversazioneDto): string {
        if (!conv.ultimoMessaggio) return 'Nessun messaggio';
        const mio = conv.ultimoMittenteUsername === this.authService.getCurrentUsername();
        const preview = conv.ultimoMessaggio.length > 35
            ? conv.ultimoMessaggio.substring(0, 35) + '…' : conv.ultimoMessaggio;
        return mio ? 'Tu: ' + preview : preview;
    }
    previewRisposta(msg: MessaggioDto): string {
        const t = msg.testo ?? 'Messaggio eliminato';
        return t.length > 60 ? t.substring(0, 60) + '…' : t;
    }
    navigateTo(path: string): void { this.router.navigate([path]); }

    private scrollToBottom(): void {
        try { this.messagesEnd?.nativeElement.scrollIntoView({ behavior: 'smooth' }); } catch {}
    }

    gruppiMessaggi(): { label: string; items: MessaggioDto[] }[] {
        const result: { label: string; items: MessaggioDto[] }[] = [];
        let currentLabel = '';
        this.messaggi().forEach(m => {
            const label = this.formatData(m.createdAt);
            if (label !== currentLabel) { currentLabel = label; result.push({ label, items: [m] }); }
            else result[result.length - 1].items.push(m);
        });
        return result;
    }

    messaggiFissati(): MessaggioDto[] {
        return this.messaggi().filter(m => m.fissato && !m.eliminato);
    }
}
