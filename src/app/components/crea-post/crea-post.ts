import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PostService } from '../../services/post-service';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './crea-post.html',
  styleUrls: ['./crea-post.css']
})
export class CreatePostComponent { 
  postForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  characterCount = 0;
  maxCharacters = 1000;

  constructor(
    private fb: FormBuilder,
    private postService: PostService,
    private router: Router
  ) {
    console.log('✅ CreatePostComponent costruito');
    
    this.postForm = this.fb.group({
      contenuto: ['', [
        Validators.required,
        Validators.maxLength(this.maxCharacters)
      ]]
    });

    this.postForm.get('contenuto')?.valueChanges.subscribe(value => {
      this.characterCount = value ? value.length : 0;
    });
  }

  get contenuto() {
    return this.postForm.get('contenuto');
  }

  get isOverLimit(): boolean {
    return this.characterCount > this.maxCharacters;
  }

  get remainingCharacters(): number {
    return this.maxCharacters - this.characterCount;
  }

  onSubmit(): void {
    if (this.postForm.invalid || this.isOverLimit) {
      this.postForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const postFormData = {
      contenuto: this.postForm.value.contenuto
    };

    console.log('📤 Dati da inviare:', postFormData);

    this.postService.createPost(postFormData).subscribe({
      next: (response) => {
        console.log('✅ Post creato con successo:', response);
        this.successMessage = 'Post creato con successo!';
        this.postForm.reset();
        this.characterCount = 0;
        this.isSubmitting = false;
        
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 500);
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('❌ Errore completo:', error);
        
        if (error.error && typeof error.error === 'string') {
          this.errorMessage = error.error;
        } else if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Errore durante la creazione del post. Riprova più tardi.';
        }
      }
    });
  }

  onCancel(): void {
    this.postForm.reset();
    this.characterCount = 0;
    this.errorMessage = '';
    this.successMessage = '';
    this.router.navigate(['/home']);
  }

  onBack(): void {
    this.router.navigate(['/home']);
  }
}