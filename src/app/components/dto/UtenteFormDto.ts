import { RuoloDto } from "./RuoloDto";

export interface UtenteFormDto {
    id?: number;
    nome: string;
    cognome: string;
    username: string;
    email: string;
    password: string;
    dataNascita?: string;
    telefono?: string;
    indirizzo?: string;
    ruolo: RuoloDto;
}
