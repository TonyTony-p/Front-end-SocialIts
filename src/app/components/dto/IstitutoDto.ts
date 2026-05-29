/** Allineato al backend IstitutoDto.java e IstitutoFormDto.java */

export interface IstitutoDto {
  id: number;
  nome: string;
  descrizione?: string;
  citta?: string;
  numeroClassi: number;
  createdAt: string;
}

export interface IstitutoFormDto {
  nome: string;
  descrizione?: string;
  citta?: string;
}
