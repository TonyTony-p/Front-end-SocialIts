export interface SegnalazioneFormDto {
  idPost: number;
  motivo: string;
}

export interface SegnalazioneDto {
  id: number;
  idPost: number;
  usernameUtente: string;
  motivo: string;
  createdAt: string;
}

export const MOTIVI_SEGNALAZIONE = [
  { valore: 'SPAM',           etichetta: 'Spam' },
  { valore: 'INAPPROPRIATO',  etichetta: 'Contenuto inappropriato' },
  { valore: 'MOLESTIE',       etichetta: 'Molestie o incitamento all\'odio' },
  { valore: 'DISINFORMAZIONE',etichetta: 'Disinformazione' },
  { valore: 'ALTRO',          etichetta: 'Altro' },
] as const;
