import { z } from 'zod';
import { DEMANDA_CATEGORIAS } from '../../api/demandas';

// Limites espelham o DemandaCreateSchema do backend, para o erro aparecer antes do envio.
export const novaDemandaSchema = z.object({
  foto: z.string().min(1, 'Anexe ao menos uma foto'),
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
});

export type NovaDemandaFormValues = z.infer<typeof novaDemandaSchema>;
