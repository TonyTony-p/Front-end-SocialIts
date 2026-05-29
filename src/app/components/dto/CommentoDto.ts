import type { UtenteDto } from './UtenteDto';
import type { PostDto } from './PostDto';

export interface CommentoDto {
  idCommento: number;
  utente: UtenteDto;
  post?: PostDto;
  testo: string;
  dataOra: string;
  createdAt?: string;
  updatedAt?: string;
}
