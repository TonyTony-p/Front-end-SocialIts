import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostService } from '../../services/post-service';

const MAX_FILES = 5;
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain'
];

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './crea-post.html',
  styleUrls: ['./crea-post.css']
})
export class CreatePostComponent {
  @ViewChild('imageInput') imageInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('docInput') docInputRef!: ElementRef<HTMLInputElement>;

  postForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  characterCount = 0;
  maxCharacters = 1000;

  selectedFiles: File[] = [];
  previewUrls: string[] = [];
  fileError = '';

  // Poll state
  sondaggioAttivo = false;
  domandaSondaggio = '';
  opzioniSondaggio: string[] = ['', ''];
  durataGiorni = 1;
  readonly DURATE = [1, 3, 7, 14];
  readonly MAX_OPZIONI = 5;

  constructor(
    private fb: FormBuilder,
    private postService: PostService,
    private router: Router
  ) {
    this.postForm = this.fb.group({
      contenuto: ['', [Validators.required, Validators.maxLength(this.maxCharacters)]]
    });
    this.postForm.get('contenuto')?.valueChanges.subscribe(v => {
      this.characterCount = v ? v.length : 0;
    });
  }

  get contenuto() { return this.postForm.get('contenuto'); }
  get isOverLimit(): boolean { return this.characterCount > this.maxCharacters; }
  get remainingCharacters(): number { return this.maxCharacters - this.characterCount; }

  // --- Poll methods ---
  toggleSondaggio(): void {
    this.sondaggioAttivo = !this.sondaggioAttivo;
    if (!this.sondaggioAttivo) this.resetSondaggio();
  }

  resetSondaggio(): void {
    this.domandaSondaggio = '';
    this.opzioniSondaggio = ['', ''];
    this.durataGiorni = 1;
  }

  aggiungiOpzione(): void {
    if (this.opzioniSondaggio.length < this.MAX_OPZIONI) {
      this.opzioniSondaggio = [...this.opzioniSondaggio, ''];
    }
  }

  rimuoviOpzione(index: number): void {
    if (this.opzioniSondaggio.length > 2) {
      this.opzioniSondaggio = this.opzioniSondaggio.filter((_, i) => i !== index);
    }
  }

  trackByIndex(index: number): number { return index; }

  get sondaggioValido(): boolean {
    return this.domandaSondaggio.trim().length > 0 &&
      this.opzioniSondaggio.filter(o => o.trim().length > 0).length >= 2;
  }

  // --- File methods ---
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    this.fileError = '';
    const nuovi = Array.from(input.files);
    for (const f of nuovi) {
      if (!ALLOWED_TYPES.includes(f.type)) {
        this.fileError = `Tipo non supportato: ${f.name}`;
        input.value = '';
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        this.fileError = `File troppo grande (max 10MB): ${f.name}`;
        input.value = '';
        return;
      }
    }
    if (this.selectedFiles.length + nuovi.length > MAX_FILES) {
      this.fileError = `Puoi allegare al massimo ${MAX_FILES} file`;
      input.value = '';
      return;
    }
    const nuoveUrl = nuovi.map(f => f.type.startsWith('image/') ? URL.createObjectURL(f) : '');
    this.selectedFiles = [...this.selectedFiles, ...nuovi];
    this.previewUrls = [...this.previewUrls, ...nuoveUrl];
    input.value = '';
  }

  rimuoviFile(index: number): void {
    URL.revokeObjectURL(this.previewUrls[index]);
    this.selectedFiles = this.selectedFiles.filter((_, i) => i !== index);
    this.previewUrls = this.previewUrls.filter((_, i) => i !== index);
  }

  isImage(file: File): boolean { return file.type.startsWith('image/'); }

  getFileIcon(file: File): string {
    if (file.type.startsWith('image/')) return 'fa-regular fa-image';
    if (file.type === 'application/pdf') return 'fas fa-file-pdf';
    if (file.type.includes('word')) return 'fas fa-file-word';
    if (file.type.includes('excel') || file.type.includes('spreadsheet')) return 'fas fa-file-excel';
    if (file.type.includes('powerpoint') || file.type.includes('presentation')) return 'fas fa-file-powerpoint';
    return 'fas fa-file';
  }

  onSubmit(): void {
    if (this.postForm.invalid || this.isOverLimit) {
      this.postForm.markAllAsTouched();
      return;
    }
    if (this.sondaggioAttivo && !this.sondaggioValido) return;

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const sondaggio = this.sondaggioAttivo ? {
      domanda: this.domandaSondaggio.trim(),
      opzioni: this.opzioniSondaggio.filter(o => o.trim().length > 0),
      durataGiorni: this.durataGiorni
    } : undefined;

    this.postService.createPost(this.postForm.value.contenuto, this.selectedFiles, sondaggio).subscribe({
      next: () => {
        this.successMessage = 'Post creato con successo!';
        this.postForm.reset();
        this.characterCount = 0;
        this.previewUrls.forEach(u => URL.revokeObjectURL(u));
        this.selectedFiles = [];
        this.previewUrls = [];
        this.resetSondaggio();
        this.sondaggioAttivo = false;
        this.isSubmitting = false;
        setTimeout(() => this.router.navigate(['/home']), 500);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.error?.message || error.error || 'Errore durante la creazione del post.';
      }
    });
  }

  onCancel(): void {
    this.postForm.reset();
    this.characterCount = 0;
    this.previewUrls.forEach(u => URL.revokeObjectURL(u));
    this.selectedFiles = [];
    this.previewUrls = [];
    this.resetSondaggio();
    this.sondaggioAttivo = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.router.navigate(['/home']);
  }

  onBack(): void { this.router.navigate(['/home']); }
}
