import { PostDto } from "./PostDto";
import { RuoloDto } from "./RuoloDto";

export interface UtenteDto {
    id: number;
    nome: string;
    cognome: string;
    codiceFiscale: string;
    email: string;
    dataNascita: string; 
    telefono: number; 
    indirizzo: string;
    ruolo: RuoloDto; 
    post: PostDto[];
    createdAt: string; 
    updatedAt: string;
}