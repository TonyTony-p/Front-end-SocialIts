import type { PermessoDto } from './PermessoDto';

/** Allineato al backend GruppoDto.java */
export interface GruppoDto {
  id: number;
  nome: string;
  alias: string;
  permessi?: PermessoDto[];
  createdAt?: string;
  updatedAt?: string;
}
