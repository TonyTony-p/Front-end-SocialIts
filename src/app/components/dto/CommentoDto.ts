import { PostDto } from "./PostDto";
import { UtenteDto } from "./UtenteDto";


export interface CommentoDto {
  idCommento: number;
  utente: {
    id: number;
    username: string;
  };
  testo: string;
  dataOra: string;
  createdAt?: string;
  updatedAt?: string;
}