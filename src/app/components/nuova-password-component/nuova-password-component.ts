// nuova-password.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PasswordResetService } from '../../services/password-reset-service';


@Component({
  selector: 'app-nuova-password',
  templateUrl: './nuova-password-component.html',
  styleUrls: ['./nuova-password-component.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class NuovaPasswordComponent implements OnInit {
  passwordForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  codice: string = '';
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(
    private fb: FormBuilder,
    private passwordResetService: PasswordResetService,
    private router: Router
  ) {
    // Recupera il codice passato dalla pagina precedente
    const navigation = this.router.getCurrentNavigation();
    this.codice = navigation?.extras?.state?.['codice'] || '';

    this.passwordForm = this.fb.group({
      nuovaPassword: ['', [Validators.required, Validators.minLength(6)]],
      confermaPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Se non c'è il codice, torna alla pagina di verifica
    if (!this.codice) {
      this.router.navigate(['/verifica-codice']);
    }
  }

  // Validator personalizzato per controllare che le password coincidano
  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('nuovaPassword')?.value;
    const confirmPassword = group.get('confermaPassword')?.value;
    
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  toggleShowPassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleShowConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    if (this.passwordForm.valid && this.codice) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const request = {
        codice: this.codice,
        nuovaPassword: this.passwordForm.get('nuovaPassword')?.value
      };

      this.passwordResetService.impostaNuovaPassword(request).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'Password aggiornata con successo!';
          
          // Vai al login dopo 2 secondi
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Errore durante l\'aggiornamento della password';
          console.error('Imposta password error:', error);
        }
      });
    } else if (!this.codice) {
      this.errorMessage = 'Codice di verifica mancante';
    } else {
      this.errorMessage = 'Controlla tutti i campi';
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToPreview(): void {
    this.router.navigate(['/preview']);
  }
}