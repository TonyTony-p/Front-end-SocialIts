import type { PermessoRuoloDto } from './PermessoRuoloDto';

export interface RuoloDto {
  id: number;
  nome: string;
  alias: string;
  ruoloPermessi?: PermessoRuoloDto[];
  createdAt?: string;
  updatedAt?: string;
}