import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PostDto } from '../components/dto/PostDto';
import { PostFormDto } from '../components/dto/PostFormDto';


@Injectable({
  providedIn: 'root'
})
export class PostService {
  private apiUrl = 'http://localhost:8080/api/post';

  constructor(private http: HttpClient) {}

  // Ottiene tutti i post (paginati)
  getAllPosts(page: number = 0, size: number = 10): Observable<PostDto[]> {
    return this.http.get<PostDto[]>(`${this.apiUrl}?page=${page}&size=${size}`);
  }

  // Ottiene post per ID
  getPostById(id: number): Observable<PostDto> {
    return this.http.get<PostDto>(`${this.apiUrl}/${id}`);
  }

  // Ottiene tutti i post di un utente
  getAllPostsByUtente(idUtente: number): Observable<PostDto[]> {
    return this.http.get<PostDto[]>(`${this.apiUrl}/all/${idUtente}`);
  }

  // Ottiene i post in tendenza
  getTendenze(limit: number = 10): Observable<PostDto[]> {
    return this.http.get<PostDto[]>(`${this.apiUrl}/tendenze?limit=${limit}`);
  }

  // Crea un nuovo post (multipart: testo + file opzionali + sondaggio opzionale)
  createPost(contenuto: string, files?: File[], sondaggio?: { domanda: string; opzioni: string[]; durataGiorni?: number }): Observable<PostDto> {
    const formData = new FormData();
    formData.append('contenuto', contenuto);
    if (files) {
      files.forEach(f => formData.append('files', f));
    }
    if (sondaggio) {
      formData.append('sondaggioJson', JSON.stringify(sondaggio));
    }
    return this.http.post<PostDto>(this.apiUrl, formData);
  }

  // Aggiorna un post
  updatePost(id: number, contenuto: string): Observable<PostDto> {
    return this.http.put<PostDto>(this.apiUrl, { id, contenuto });
  }

  // Elimina un post
  deletePost(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/elimina/${id}`);
  }

  // Ottiene i post degli utenti seguiti
  getPostDaSeguiti(): Observable<PostDto[]> {
    return this.http.get<PostDto[]>(`${this.apiUrl}/seguiti`);
  }
}