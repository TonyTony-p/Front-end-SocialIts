import { PostDto } from "./PostDto";

export interface ProfiloDto {
    id: number;
    nome: string;
    cognome: string;
    username: string;
    bio: string;
    fotoProfilo: string;
    numPost: number;
    numLike: number;
    numSeguaci: number;
    numSeguiti: number;
    seguito: boolean;
    posts: PostDto[];
    memberDal: string;
    ruolo?: string;
}
