import type { GruppoDto } from './GruppoDto';

/** Allineato al backend PermessoFormDto.java */
export interface PermessoFormDto {
  id?: number;
  nome: string;
  alias: string;
  gruppo?: GruppoDto; // null per rimuovere l'associazione al gruppo
}
