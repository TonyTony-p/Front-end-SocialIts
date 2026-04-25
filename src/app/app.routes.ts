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

  {
    path: '**',
    redirectTo: 'preview'
  }
];

    

