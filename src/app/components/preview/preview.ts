import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule],
  templateUrl: './preview.html',
  styleUrls: ['./preview.css']
})
export class Preview {
  features = [

    {
      icon: 'pi pi-users',
      title: 'Networking Studentesco',
      description: 'Connettiti con studenti del tuo corso o di altri ITS'
    },
    {
      icon: 'pi pi-share-alt',
      title: 'Condivisione Risorse',
      description: 'Condividi appunti, materiali di studio e conoscenze'
    },
    {
      icon: 'pi pi-book',
      title: 'Supporto allo Studio',
      description: 'Trova aiuto per esami e progetti '
    }
  ];

  constructor(private router: Router) {}

  goToLogin() {
    this.router.navigate(['/login']);
  }
}