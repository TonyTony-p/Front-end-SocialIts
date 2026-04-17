// verifica-codice.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PasswordResetService } from '../../services/password-reset-service';



@Component({
  selector: 'app-verifica-codice',
  templateUrl: './verifica-codice.html',
  styleUrls: ['./verifica-codice.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class VerificaCodiceComponent {
  codiceForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  codiceVerificato: string = ''; // Salviamo il codice per passarlo allo step successivo

  constructor(
    private fb: FormBuilder,
    private passwordResetService: PasswordResetService,
    private router: Router
  ) {
    this.codiceForm = this.fb.group({
      cifra1: ['', [Validators.required, Validators.pattern(/^\d$/)]],
      cifra2: ['', [Validators.required, Validators.pattern(/^\d$/)]],
      cifra3: ['', [Validators.required, Validators.pattern(/^\d$/)]],
      cifra4: ['', [Validators.required, Validators.pattern(/^\d$/)]],
    });
  }

  // Auto-focus sul prossimo input
  onInputChange(event: any, nextInputId: string | null): void {
    const input = event.target;
    if (input.value.length === 1 && nextInputId) {
      const nextInput = document.getElementById(nextInputId) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  }

  // Gestisci backspace per tornare indietro
  onKeyDown(event: KeyboardEvent, prevInputId: string | null): void {
    if (event.key === 'Backspace' && !(event.target as HTMLInputElement).value && prevInputId) {
      const prevInput = document.getElementById(prevInputId) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
      }
    }
  }

  onSubmit(): void {
    if (this.codiceForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      // Componi il codice a 4 cifre
      const codice = 
        this.codiceForm.get('cifra1')?.value +
        this.codiceForm.get('cifra2')?.value +
        this.codiceForm.get('cifra3')?.value +
        this.codiceForm.get('cifra4')?.value;

      this.passwordResetService.verificaCodice({ codice }).subscribe({
        next: () => {
          this.isLoading = false;
          this.codiceVerificato = codice;
          this.successMessage = 'Codice verificato! Reindirizzamento...';
          
          // Vai alla pagina nuova password passando il codice
          setTimeout(() => {
            this.router.navigate(['/nuova-password'], { 
              state: { codice: this.codiceVerificato } 
            });
          }, 1500);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Codice non valido o scaduto';
          console.error('Verifica codice error:', error);
        }
      });
    } else {
      this.errorMessage = 'Inserisci tutte le 4 cifre';
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToPreview(): void {
    this.router.navigate(['/preview']);
  }

  richiestaNuovoCodice(): void {
    this.router.navigate(['/recupera-password']);
  }
}