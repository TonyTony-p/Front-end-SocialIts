import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ClasseCorsoService } from '../../../services/classe-corso-service';
import { AuthService } from '../../../services/auth';
import {
  ClasseCorsoDto, AnnuncioDto, MaterialeClasseDto,
  CompitoDto, ConsegnaCompitoDto, IscrizioneClasseDto
} from '../../dto/ClasseCorsoDto';

type Tab = 'bacheca' | 'lavori' | 'persone' | 'materiali';

@Component({
  selector: 'app-dettaglio-classe',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dettaglio-classe.html',
  styleUrls: ['./dettaglio-classe.css']
})
export class DettaglioClasseComponent implements OnInit {
  classeId = signal(0);
  classe = signal<ClasseCorsoDto | null>(null);
  activeTab = signal<Tab>('bacheca');
  loading = signal(true);
  error = signal('');
  currentUsername = signal('');
  isProfessore = signal(false);

  annunci = signal<AnnuncioDto[]>([]);
  nuovoAnnuncioTitolo = signal('');
  nuovoAnnuncioContenuto = signal('');
  mostraFormAnnuncio = signal(false);

  materiali = signal<MaterialeClasseDto[]>([]);
  formMateriale = signal({ nome: '', url: '', tipo: 'LINK' });
  mostraFormMateriale = signal(false);

  compiti = signal<CompitoDto[]>([]);
  formCompito = signal({ titolo: '', descrizione: '', scadenza: '', puntiMax: undefined as number | undefined });
  mostraFormCompito = signal(false);
  compitoSelezionato = signal<CompitoDto | null>(null);
  consegne = signal<ConsegnaCompitoDto[]>([]);

  iscrizioni = signal<IscrizioneClasseDto[]>([]);
  studentiApprovati = computed(() => this.iscrizioni().filter(i => i.stato === 'APPROVATA'));
  studentiInAttesa = computed(() => this.iscrizioni().filter(i => i.stato === 'IN_ATTESA'));

  constructor(
    private route: ActivatedRoute,
    private classeService: ClasseCorsoService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.classeId.set(id);
    const user = this.authService.getCurrentUser();
    this.currentUsername.set(user?.username || '');

    this.classeService.dettaglioClasse(id).subscribe({
      next: (c) => {
        this.classe.set(c);
        this.isProfessore.set(c.professoreUsername === this.currentUsername());
        this.loading.set(false);
        this.loadTab('bacheca');
      },
      error: () => { this.error.set('Errore nel caricamento della classe'); this.loading.set(false); }
    });
  }

  setTab(tab: Tab) {
    this.activeTab.set(tab);
    this.loadTab(tab);
  }

  private loadTab(tab: Tab) {
    switch (tab) {
      case 'bacheca':
        this.classeService.listaAnnunci(this.classeId()).subscribe({ next: (d) => this.annunci.set(d), error: () => {} });
        break;
      case 'lavori':
        this.classeService.listaCompiti(this.classeId()).subscribe({ next: (d) => this.compiti.set(d), error: () => {} });
        break;
      case 'materiali':
        this.classeService.listaMateriali(this.classeId()).subscribe({ next: (d) => this.materiali.set(d), error: () => {} });
        break;
      case 'persone':
        this.classeService.listaIscrizioni(this.classeId()).subscribe({ next: (d) => this.iscrizioni.set(d), error: () => {} });
        break;
    }
  }

  pubblicaAnnuncio() {
    if (!this.nuovoAnnuncioTitolo().trim()) return;
    this.classeService.creaAnnuncio(this.classeId(), this.nuovoAnnuncioTitolo(), this.nuovoAnnuncioContenuto()).subscribe({
      next: (a) => {
        this.annunci.update(list => [a, ...list]);
        this.nuovoAnnuncioTitolo.set('');
        this.nuovoAnnuncioContenuto.set('');
        this.mostraFormAnnuncio.set(false);
      }
    });
  }

  eliminaAnnuncio(id: number) {
    this.classeService.eliminaAnnuncio(this.classeId(), id).subscribe({
      next: () => this.annunci.update(list => list.filter(a => a.id !== id))
    });
  }

  salvaMateriale() {
    const f = this.formMateriale();
    if (!f.nome || !f.url) return;
    this.classeService.caricaMateriale(this.classeId(), f).subscribe({
      next: (m) => {
        this.materiali.update(list => [m, ...list]);
        this.formMateriale.set({ nome: '', url: '', tipo: 'LINK' });
        this.mostraFormMateriale.set(false);
      }
    });
  }

  eliminaMateriale(id: number) {
    this.classeService.eliminaMateriale(this.classeId(), id).subscribe({
      next: () => this.materiali.update(list => list.filter(m => m.id !== id))
    });
  }

  salvaCompito() {
    const f = this.formCompito();
    if (!f.titolo.trim()) return;
    this.classeService.creaCompito(this.classeId(), f).subscribe({
      next: (c) => {
        this.compiti.update(list => [c, ...list]);
        this.formCompito.set({ titolo: '', descrizione: '', scadenza: '', puntiMax: undefined });
        this.mostraFormCompito.set(false);
      }
    });
  }

  apriConsegne(compito: CompitoDto) {
    this.compitoSelezionato.set(compito);
    this.classeService.listaConsegne(this.classeId(), compito.id).subscribe({
      next: (c) => this.consegne.set(c)
    });
  }

  approvaIscrizione(iscrizioneId: number) {
    this.classeService.aggiornaIscrizione(this.classeId(), iscrizioneId, 'APPROVATA').subscribe({
      next: (upd) => this.iscrizioni.update(list => list.map(i => i.id === iscrizioneId ? upd : i))
    });
  }

  rifiutaIscrizione(iscrizioneId: number) {
    this.classeService.aggiornaIscrizione(this.classeId(), iscrizioneId, 'RIFIUTATA').subscribe({
      next: (upd) => this.iscrizioni.update(list => list.map(i => i.id === iscrizioneId ? upd : i))
    });
  }

  updateCompitoTitolo(val: string) { this.formCompito.update(f => ({...f, titolo: val})); }
  updateCompitoDescrizione(val: string) { this.formCompito.update(f => ({...f, descrizione: val})); }
  updateCompitoScadenza(val: string) { this.formCompito.update(f => ({...f, scadenza: val})); }
  updateCompioPuntiMax(val: any) { this.formCompito.update(f => ({...f, puntiMax: val ? Number(val) : undefined})); }

  updateMaterialeNome(val: string) { this.formMateriale.update(f => ({...f, nome: val})); }
  updateMaterialeUrl(val: string) { this.formMateriale.update(f => ({...f, url: val})); }
  updateMaterialeTipo(val: string) { this.formMateriale.update(f => ({...f, tipo: val})); }
}
