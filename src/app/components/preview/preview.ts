import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './preview.html',
  styleUrls: ['./preview.css']
})
export class Preview {
  features = [
    {
      icon: 'fas fa-users',
      color: 'brand',
      title: 'Networking Studentesco',
      description: 'Connettiti con studenti del tuo corso o di altri ITS in tutta Italia.'
    },
    {
      icon: 'fas fa-share-nodes',
      color: 'warm',
      title: 'Condivisione Risorse',
      description: 'Condividi appunti, materiali di studio e link utili con la community.'
    },
    {
      icon: 'fas fa-book-open',
      color: 'lime',
      title: 'Supporto allo Studio',
      description: 'Trova aiuto per esami, progetti e preparati al mondo del lavoro.'
    },
    {
      icon: 'fas fa-wand-magic-sparkles',
      color: 'sky',
      title: 'SmarTina AI',
      description: 'La tua assistente intelligente per corsi, scadenze e ogni domanda ITS.'
    },
    {
      icon: 'fas fa-briefcase',
      color: 'warm',
      title: 'Stage & Lavoro',
      description: 'Scopri opportunità di stage e aziende che cercano studenti ITS.'
    },
    {
      icon: 'fas fa-graduation-cap',
      color: 'brand',
      title: 'Community ITS',
      description: 'Un social pensato solo per gli studenti ITS, sicuro e verticale.'
    }
  ];

  constructor(private router: Router, public themeService: ThemeService) {}

  goToLogin()        { this.router.navigate(['/login']); }
  goToRegistration() { this.router.navigate(['/registrazione']); }
}
