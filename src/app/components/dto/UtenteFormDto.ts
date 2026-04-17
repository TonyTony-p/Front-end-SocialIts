import { RuoloDto } from "./RuoloDto";

export interface UtenteFormDto{
    id : number;
    nome : string;
    cognome : string;
    codiceFiscale : string;
    email : string;
    password : string;
    dataNascita : string;
    telefono : number;
    indirizzo : string;
    ruolo : RuoloDto;
}