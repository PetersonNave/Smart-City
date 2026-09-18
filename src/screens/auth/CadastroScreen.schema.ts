import { z } from 'zod';

export const cadastroSchema = z
  .object({
    username: z.string().min(3, 'Mínimo de 3 caracteres').max(50, 'Máximo de 50 caracteres'),
    email: z.string().min(1, 'Informe seu e-mail').email('E-mail inválido'),
    password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export type CadastroFormValues = z.infer<typeof cadastroSchema>;
