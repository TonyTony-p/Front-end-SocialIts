// password-reset-request.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PasswordResetService } from '../../services/password-reset-service';


@Component({
  selector: 'app-password-reset-request',
  templateUrl: './password-reset-request.html',
  styleUrls: ['./password-reset-request.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class PasswordResetRequestComponent {
  resetForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private passwordResetService: PasswordResetService,
    private router: Router
  ) {
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.resetForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      this.passwordResetService.richiestaResetPassword(this.resetForm.value).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'Codice inviato! Controlla la tua email.';
          
          // Dopo 2 secondi, vai alla pagina di verifica codice
          setTimeout(() => {
            this.router.navigate(['/verifica-codice']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Email non trovata';
          console.error('Reset password error:', error);
        }
      });
    } else {
      this.errorMessage = 'Inserisci un\'email valida';
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToPreview(): void {
    this.router.navigate(['/preview']);
  }
}