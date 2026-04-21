import { OpzioneDto } from './OpzioneDto';

export interface SondaggioDto {
  idSondaggio: number;
  domanda: string;
  scadenza?: string;
  scaduto: boolean;
  totaleVoti: number;
  opzioni: OpzioneDto[];
  idOpzioneVotata?: number;
}
