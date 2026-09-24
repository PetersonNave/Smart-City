import { z } from 'zod';
import { DEMANDA_CATEGORIAS } from '../../api/demandas';

// Limites espelham o DemandaCreateSchema/DemandaUpdateSchema do backend, para o erro
// aparecer antes do envio.
const fotoSchema = z.object({ uri: z.string().min(1), mimeType: z.string().nullish() });

const camposTexto = {
  titulo: z
    .string()
    .trim()
    .min(5, 'O título deve ter no mínimo 5 caracteres')
    .max(120, 'O título deve ter no máximo 120 caracteres'),
  categoria: z
    .string()
    .refine((value) => (DEMANDA_CATEGORIAS as readonly string[]).includes(value), 'Selecione uma categoria'),
  descricao: z
    .string()
    .trim()
    .min(10, 'Descreva o problema com pelo menos 10 caracteres')
    .max(500, 'A descrição deve ter no máximo 500 caracteres'),
  localizacao: z
    .string()
    .trim()
    .min(3, 'Informe a localização do problema')
    .max(500, 'A localização deve ter no máximo 500 caracteres'),
};

/** Nova demanda: a foto é obrigatória (Figma "Anexe ao menos uma foto"). */
export const novaDemandaSchema = z.object({
  foto: fotoSchema.nullable().refine((foto) => foto !== null, 'Anexe ao menos uma foto'),
  ...camposTexto,
});

/** Edição: `foto` só é preenchida se o usuário escolher uma nova (a atual continua na API). */
export const editarDemandaSchema = z.object({
  foto: fotoSchema.nullable(),
  ...camposTexto,
});

export type DemandaFormValues = z.infer<typeof editarDemandaSchema>;

export const DEMANDA_FORM_VAZIO: DemandaFormValues = {
  foto: null,
  titulo: '',
  categoria: '',
  descricao: '',
  localizacao: '',
};
