import { editarDemandaSchema, novaDemandaSchema } from './demandaForm.schema';

describe('novaDemandaSchema', () => {
  const valid = {
    foto: { uri: 'file:///foto.jpg', mimeType: 'image/jpeg' },
    titulo: 'Semáforo danificado',
    categoria: 'PUBLIC_LIGHTING',
    descricao: 'Semáforo apagado há três dias na esquina.',
    localizacao: 'Rua XV de Novembro, 450',
  };

  function firstMessage(input: Record<string, unknown>) {
    const result = novaDemandaSchema.safeParse(input);
    return result.success ? null : result.error.issues[0].message;
  }

  it('accepts a complete demand', () => {
    expect(novaDemandaSchema.safeParse(valid).success).toBe(true);
  });

  it('requires a photo (Figma error state)', () => {
    expect(firstMessage({ ...valid, foto: null })).toBe('Anexe ao menos uma foto');
  });

  it('requires a category from the backend list', () => {
    expect(firstMessage({ ...valid, categoria: '' })).toBe('Selecione uma categoria');
    expect(firstMessage({ ...valid, categoria: 'infraestrutura' })).toBe('Selecione uma categoria');
  });

  it('mirrors the backend length limits for title and description', () => {
    expect(firstMessage({ ...valid, titulo: 'abc' })).toBe('O título deve ter no mínimo 5 caracteres');
    expect(firstMessage({ ...valid, descricao: 'curta' })).toBe(
      'Descreva o problema com pelo menos 10 caracteres'
    );
  });

  it('requires a location', () => {
    expect(firstMessage({ ...valid, localizacao: '  ' })).toBe('Informe a localização do problema');
  });
});

describe('editarDemandaSchema', () => {
  it('keeps the current photo when no new one is chosen', () => {
    const result = editarDemandaSchema.safeParse({
      foto: null,
      titulo: 'Semáforo danificado',
      categoria: 'PUBLIC_LIGHTING',
      descricao: 'Semáforo apagado há três dias na esquina.',
      localizacao: 'Av. Brasil, 1200',
    });
    expect(result.success).toBe(true);
  });
});
