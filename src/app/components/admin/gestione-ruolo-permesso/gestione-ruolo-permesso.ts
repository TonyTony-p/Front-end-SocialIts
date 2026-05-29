import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RuoloService } from '../../../services/ruolo-service';
import { PermessoService } from '../../../services/permesso-service';
import { RuoloPermessoService } from '../../../services/ruolo-permesso-service';
import { RuoloDto } from '../../dto/RuoloDto';
import { PermessoDto } from '../../dto/PermessoDto';

@Component({
  selector: 'app-gestione-ruolo-permesso',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestione-ruolo-permesso.html',
  styleUrls: ['./gestione-ruolo-permesso.css']
})
export class GestioneRuoloPermessoComponent implements OnInit {
  ruoli           = signal<RuoloDto[]>([]);
  tuttiPermessi   = signal<PermessoDto[]>([]);

  ruoloSelezionatoId = signal<number | null>(null);
  permessiAssociati  = signal<PermessoDto[]>([]);

  loadingRuoli    = signal(true);
  loadingPermessi = signal(false);
  error           = signal('');
  success         = signal('');

  permessoAggiungereId = signal<number | null>(null);
  actionLoading   = signal(false);

  permessiDisponibili = computed(() => {
    const assIds = new Set(this.permessiAssociati().map(p => p.id));
    return this.tuttiPermessi().filter(p => !assIds.has(p.id));
  });

  ruoloSelezionato = computed(() =>
    this.ruoli().find(r => r.id === this.ruoloSelezionatoId()) ?? null
  );

  constructor(
    private ruoloService: RuoloService,
    private permessoService: PermessoService,
    private ruoloPermessoService: RuoloPermessoService,
    private location: Location
  ) {}

  ngOnInit() {
    this.ruoloService.listaTutti().subscribe({
      next:  (r) => { this.ruoli.set(r); this.loadingRuoli.set(false); },
      error: ()  => { this.error.set('Errore nel caricamento dei ruoli'); this.loadingRuoli.set(false); }
    });
    this.permessoService.listaTutti().subscribe({
      next: (p) => this.tuttiPermessi.set(p)
    });
  }

  goBack() { this.location.back(); }

  onRuoloChange(val: string) {
    const id = val ? +val : null;
    this.ruoloSelezionatoId.set(id);
    this.permessiAssociati.set([]);
    this.permessoAggiungereId.set(null);
    this.error.set('');
    this.success.set('');
    if (id == null) return;
    this.loadingPermessi.set(true);
    this.ruoloPermessoService.getPermessiByRuolo(id).subscribe({
      next:  (p) => { this.permessiAssociati.set(p); this.loadingPermessi.set(false); },
      error: ()  => { this.error.set('Errore nel caricamento dei permessi'); this.loadingPermessi.set(false); }
    });
  }

  associa() {
    const ruoloId   = this.ruoloSelezionatoId();
    const permessoId = this.permessoAggiungereId();
    if (ruoloId == null || permessoId == null) return;
    const permesso = this.tuttiPermessi().find(p => p.id === permessoId);
    if (!permesso) return;
    this.actionLoading.set(true);
    this.error.set('');
    this.ruoloPermessoService.associa({ ruoloId, permesso }).subscribe({
      next: () => {
        this.permessiAssociati.update(list => [...list, permesso]);
        this.permessoAggiungereId.set(null);
        this.actionLoading.set(false);
        this.success.set(`Permesso "${permesso.alias}" associato.`);
        setTimeout(() => this.success.set(''), 3000);
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.error.set(err?.error?.message || 'Errore nell\'associazione.');
      }
    });
  }

  dissocia(permesso: PermessoDto) {
    const ruoloId = this.ruoloSelezionatoId();
    if (ruoloId == null) return;
    if (!confirm(`Rimuovere il permesso "${permesso.alias}" dal ruolo?`)) return;
    this.actionLoading.set(true);
    this.error.set('');
    this.ruoloPermessoService.dissocia({ ruoloId, permesso }).subscribe({
      next: () => {
        this.permessiAssociati.update(list => list.filter(p => p.id !== permesso.id));
        this.actionLoading.set(false);
        this.success.set(`Permesso "${permesso.alias}" rimosso.`);
        setTimeout(() => this.success.set(''), 3000);
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.error.set(err?.error?.message || 'Errore nella dissociazione.');
      }
    });
  }

  onPermessoChange(val: string) {
    this.permessoAggiungereId.set(val ? +val : null);
  }
}
