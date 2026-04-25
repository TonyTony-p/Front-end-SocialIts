import { AllegatoDto } from "./AllegatoDto";
import { CommentoDto } from "./CommentoDto";
import { LikeDto } from "./LikeDto";
import { SondaggioDto } from "./SondaggioDto";

export interface PostDto {
  id: number;
  idUtente: number;
  usernameUtente: string;
  dataOra: string;
  contenuto: string;
  commenti?: CommentoDto[];
  like?: LikeDto[];
  numeroLike?: number;
  allegati?: AllegatoDto[];
  sondaggio?: SondaggioDto;
}