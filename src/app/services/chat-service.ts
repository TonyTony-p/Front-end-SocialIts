import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface ChatRequest {
  user_id: string;
  message: string;
}

export interface ChatResponse {
  smartina: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  
  private apiUrl = 'http://localhost:8081/chat';

  constructor(private http: HttpClient) { }

  sendMessage(userId: string, message: string): Observable<ChatResponse> {
    const request: ChatRequest = {
      user_id: userId,
      message: message
    };
    
    return this.http.post<ChatResponse>(this.apiUrl, request);
  }
}