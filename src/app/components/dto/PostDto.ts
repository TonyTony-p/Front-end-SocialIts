import { CommentoDto } from "./CommentoDto";
import { LikeDto } from "./LikeDto";

export interface PostDto {
  id: number;
  idUtente: number;
  usernameUtente: string;
  dataOra: string; // LocalDateTime mappato come string ISO
  contenuto: string;
  commenti?: CommentoDto[]; // Opzionale
  like?: LikeDto[]; // Opzionale
  numeroLike?: number; // Opzionale
}