import { PostDto } from "./PostDto";
import { RuoloDto } from "./RuoloDto";

export interface UtenteDto {
    id: number;
    nome: string;
    cognome: string;
    username: string;
    codiceFiscale: string;
    email: string;
    dataNascita: string;
    telefono: number;
    indirizzo: string;
    bio: string;
    fotoProfilo: string;
    ruolo: RuoloDto;
    post: PostDto[];
    createdAt: string;
    updatedAt: string;
}