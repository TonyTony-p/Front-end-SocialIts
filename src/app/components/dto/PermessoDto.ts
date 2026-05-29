import type { GruppoDto } from './GruppoDto';
import type { PermessoRuoloDto } from './PermessoRuoloDto';

export interface PermessoDto {
  id: number;
  nome: string;
  alias: string;
  gruppo?: GruppoDto;
  ruoloPermessi?: PermessoRuoloDto[];
  createdAt?: string;
  updatedAt?: string;
}
