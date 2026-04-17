import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { tap } from 'rxjs';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  imports: [CommonModule, ReactiveFormsModule],
  styleUrls: ['./login.css']
})
//
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;
  private platformId = inject(PLATFORM_ID);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Se esiste già un token valido, vai direttamente in home
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      this.authService.login(this.loginForm.value).pipe(
        tap(() => {
          // Qui il token è già salvato
          this.router.navigate(['/home']);
        })
      ).subscribe({
        next: () => this.isLoading = false,
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = 'Username o password errati';
          console.error('Login error:', error);
        }
      });

    } else {
      this.errorMessage = 'Compila tutti i campi obbligatori';
    }
  }

  goToPreview(): void {
    this.router.navigate(['/preview']);
  }

  goToRegistration(): void {
    this.router.navigate(['/registrazione']);
  }
  goToPasswordReset(): void {
  this.router.navigate(['/recupera-password']);
}
}