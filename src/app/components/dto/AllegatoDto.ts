export interface AllegatoDto {
  id: number;
  nomeOriginale: string;
  url: string;
  mimeType: string;
  tipo: string; // 'IMAGE' | 'DOCUMENT'
}
