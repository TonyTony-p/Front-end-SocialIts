export type TipoClasse = 'PUBBLICA' | 'PRIVATA';
export type StatoIscrizione = 'IN_ATTESA' | 'APPROVATA' | 'RIFIUTATA';
export type TipoMateriale = 'LINK' | 'FILE';

export interface ClasseCorsoDto {
  id: number;
  nome: string;
  descrizione?: string;
  codiceInvito: string;
  tipo: TipoClasse;
  professoreUsername: string;
  professoreNome: string;
  numeroStudenti: number;
  createdAt: string;
}

export interface ClasseCorsoFormDto {
  id?: number;
  nome: string;
  descrizione?: string;
  tipo: TipoClasse;
}

export interface IscrizioneClasseDto {
  id: number;
  classeId: number;
  classeNome: string;
  professoreNome?: string;
  studenteUsername: string;
  studenteNome: string;
  stato: StatoIscrizione;
  dataRichiesta: string;
  dataRisposta?: string;
}

export interface AnnuncioDto {
  id: number;
  classeId: number;
  autoreUsername: string;
  autoreNome: string;
  titolo: string;
  contenuto: string;
  createdAt: string;
}

export interface MaterialeClasseDto {
  id: number;
  classeId: number;
  caricatoDaUsername: string;
  nome: string;
  url: string;
  tipo: TipoMateriale;
  dataCaricamento: string;
}

export interface CompitoDto {
  id: number;
  classeId: number;
  titolo: string;
  descrizione?: string;
  scadenza?: string;
  puntiMax?: number;
  createdAt: string;
}

export interface ConsegnaCompitoDto {
  id: number;
  compitoId: number;
  compitoTitolo: string;
  studenteUsername: string;
  contenuto?: string;
  url?: string;
  dataConsegna: string;
  voto?: number;
  feedback?: string;
}
