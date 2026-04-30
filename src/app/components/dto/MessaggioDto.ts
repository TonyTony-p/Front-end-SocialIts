export interface MessaggioDto {
    id: number;
    mittenteUsername: string;
    testo: string | null;
    eliminato: boolean;
    fissato: boolean;
    pinnedUntil: string | null;
    importante: boolean;
    letto: boolean;
    replyToId: number | null;
    replyToTesto: string | null;
    replyToMittente: string | null;
    createdAt: string;
}

export interface ConversazioneDto {
    id: number;
    altroUsername: string;
    altroNome: string;
    altroCognome: string;
    ultimoMessaggio: string | null;
    ultimoMittenteUsername: string | null;
    updatedAt: string;
    nonLetti: number;
    altroLastSeen: string | null;
    messaggi?: MessaggioDto[];
}

export interface InviaMessaggioDto {
    testo: string;
    replyToId?: number | null;
}
