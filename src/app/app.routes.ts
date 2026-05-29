import { Routes } from '@angular/router';

import { HomeComponent } from './components/home/home';
import { AuthGuard } from './guards/guards-guard';
import { LoginComponent } from './components/login/login';
import { Registrazione } from './components/registrazione/registrazione';
import { Preview } from './components/preview/preview';
import { CreatePostComponent } from './components/crea-post/crea-post';
import { PasswordResetRequestComponent } from './components/password-reset-request/password-reset-request';
import { VerificaCodiceComponent } from './components/verifica-codice/verifica-codice';
import { NuovaPasswordComponent } from './components/nuova-password-component/nuova-password-component';
import { ProfiloComponent } from './components/profilo/profilo';
import { DashboardProfessoreComponent } from './components/classi/dashboard-professore/dashboard-professore';
import { FormClasseComponent } from './components/classi/form-classe/form-classe';
import { DettaglioClasseComponent } from './components/classi/dettaglio-classe/dettaglio-classe';
import { EsploraClassiComponent } from './components/classi/esplora-classi/esplora-classi';
import { DashboardStudenteComponent } from './components/classi/dashboard-studente/dashboard-studente';
import { GestioneProfessoriComponent } from './components/istituto/gestione-professori/gestione-professori';
import { GestioneIstitutiComponent } from './components/admin/gestione-istituti/gestione-istituti';
import { GestioneGruppiComponent } from './components/admin/gestione-gruppi/gestione-gruppi';
import { GestioneRuoliComponent } from './components/admin/gestione-ruoli/gestione-ruoli';
import { GestionePermessiComponent } from './components/admin/gestione-permessi/gestione-permessi';
import { GestioneRuoloPermessoComponent } from './components/admin/gestione-ruolo-permesso/gestione-ruolo-permesso';
import { GestioneUtentiComponent } from './components/admin/gestione-utenti/gestione-utenti';
import { GestioneClassiAdminComponent } from './components/admin/gestione-classi-admin/gestione-classi-admin';
import { MessaggiComponent } from './components/messaggi/messaggi';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },

  { path: 'registrazione', component: Registrazione },


  {
    path: 'preview',
    component: Preview,
  },

  { path: 'crea-post',
    component: CreatePostComponent,
    canActivate: [AuthGuard] },

  {
    path: 'home',
    component: HomeComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'recupera-password',
    component: PasswordResetRequestComponent
  },

    {
    path: 'verifica-codice',
    component: VerificaCodiceComponent
  },

    {
    path: 'nuova-password',
    component: NuovaPasswordComponent
  },

  {
    path: 'profilo/:username',
    component: ProfiloComponent,
    canActivate: [AuthGuard]
  },

  // ── Classi (Professore) ────────────────────────────────────────
  {
    path: 'classi/mie',
    component: DashboardProfessoreComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'classi/nuova',
    component: FormClasseComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'classi/:id/modifica',
    component: FormClasseComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'classi/:id',
    component: DettaglioClasseComponent,
    canActivate: [AuthGuard]
  },

  // ── Classi (Studente) ──────────────────────────────────────────
  {
    path: 'esplora-classi',
    component: EsploraClassiComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard-studente',
    component: DashboardStudenteComponent,
    canActivate: [AuthGuard]
  },

  // ── Istituto ───────────────────────────────────────────────────
  {
    path: 'istituto/professori',
    component: GestioneProfessoriComponent,
    canActivate: [AuthGuard]
  },

  // ── Admin ──────────────────────────────────────────────────────
  {
    path: 'admin/istituti',
    component: GestioneIstitutiComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'admin/gruppi',
    component: GestioneGruppiComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'admin/ruoli',
    component: GestioneRuoliComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'admin/permessi',
    component: GestionePermessiComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'admin/ruoli-permessi',
    component: GestioneRuoloPermessoComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'admin/utenti',
    component: GestioneUtentiComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'admin/classi',
    component: GestioneClassiAdminComponent,
    canActivate: [AuthGuard]
  },

  // ── Messaggi DM ───────────────────────────────────────────────
  {
    path: 'messaggi',
    component: MessaggiComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'messaggi/:username',
    component: MessaggiComponent,
    canActivate: [AuthGuard]
  },

  {
    path: '**',
    redirectTo: 'preview'
  }
];

    

