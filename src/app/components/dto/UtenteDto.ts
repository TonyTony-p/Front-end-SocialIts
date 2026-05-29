import { PostDto } from "./PostDto";
import { RuoloDto } from "./RuoloDto";

/** Allineato al backend UtenteDto.java */
export interface UtenteDto {
    id: number;
    nome: string;
    cognome: string;
    username: string;
    email: string;
    dataNascita?: string;
    telefono?: string;    // String nel backend, non number
    indirizzo?: string;
    ruolo?: RuoloDto;
    post?: PostDto[];
    createdAt?: string;
    updatedAt?: string;
}