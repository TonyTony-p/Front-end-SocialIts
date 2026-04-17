import { GruppoDto } from "./GruppoDto";
import { PermessoDto } from "./PermessoDto";
import { RuoloDto } from "./RuoloDto";

export interface LoginResponse {
  token: string;
  username: string;
  nome: string;
  cognome: string;
  ruoli: RuoloDto[];
  permessi: PermessoDto[];
  gruppi: GruppoDto[];
}