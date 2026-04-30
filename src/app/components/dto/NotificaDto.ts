export type TipoNotifica =
  | 'LIKE'
  | 'COMMENTO'
  | 'FOLLOW'
  | 'ISCRIZIONE_RICHIESTA'
  | 'ISCRIZIONE_APPROVATA'
  | 'ISCRIZIONE_RIFIUTATA'
  | 'ANNUNCIO';

export interface NotificaDto {
  id: number;
  tipo: TipoNotifica;
  attoreUsername: string;
  attoreNome: string;
  idRiferimento: number;
  tipoRiferimento: 'POST' | 'CLASSE' | 'ANNUNCIO' | 'UTENTE';
  messaggio: string;
  letta: boolean;
  createdAt: string;
}
