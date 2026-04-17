import { Component, OnInit, PLATFORM_ID, inject, ChangeDetectorRef, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../../services/chat-service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrls: ['./chat.css']
})
export class ChatComponent implements OnInit {
  
  messages = signal<ChatMessage[]>([]);
  userMessage = signal('');
  loading = signal(false);
  userId: string = 'user_' + Math.random().toString(36).substr(2, 9);
  isOpen = signal(false);
  hasUnreadMessages = signal(false);
  
  private platformId = inject(PLATFORM_ID);
  private isBrowser: boolean;
  private cdr = inject(ChangeDetectorRef);

  constructor(private chatService: ChatService) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.addMessage('assistant', 'Ciao, sono SmarTina. In cosa ti posso essere utile?');
    }
  }

  toggleChat(): void {
    this.isOpen.set(!this.isOpen());
    if (this.isOpen()) {
      this.hasUnreadMessages.set(false);
      if (this.isBrowser) {
        setTimeout(() => {
          this.scrollToBottom();
          this.cdr.detectChanges();
        }, 100);
      }
    }
  }

  sendMessage(): void {
    const message = this.userMessage().trim();
    
    if (!message || this.loading() || !this.isBrowser) {
      return;
    }

    this.addMessage('user', message);
    this.userMessage.set('');
    this.loading.set(true);

    this.chatService.sendMessage(this.userId, message).subscribe({
      next: (response) => {
        this.addMessage('assistant', response.smartina);
        this.loading.set(false);
        
        if (!this.isOpen()) {
          this.hasUnreadMessages.set(true);
        }
        
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('[CHAT] Errore:', error);
        this.addMessage('assistant', 'Mi dispiace, si è verificato un errore. Riprova.');
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  private addMessage(role: 'user' | 'assistant', content: string): void {
    this.messages.update(msgs => [...msgs, {
      role: role,
      content: content,
      timestamp: new Date()
    }]);
    
    if (this.isBrowser) {
      this.scrollToBottom();
      this.cdr.detectChanges();
      
      setTimeout(() => {
        this.scrollToBottom();
      }, 50);
    }
  }

  private scrollToBottom(): void {
    if (!this.isBrowser) return;
    
    const chatMessages = document.querySelector('.chat-messages-widget');
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}