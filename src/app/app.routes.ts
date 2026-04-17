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
    path: '**',
    redirectTo: 'preview'
  }
];

    

