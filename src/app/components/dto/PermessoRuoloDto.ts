import type { RuoloDto } from './RuoloDto';
import type { PermessoDto } from './PermessoDto';

export interface PermessoRuoloDto {
  id: number;
  ruolo: RuoloDto;
  permesso: PermessoDto;
}
