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
    posts: PostDto[];
    memberDal: string;
}
