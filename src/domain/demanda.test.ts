import { formatarData, formatarProtocolo, podeEditar, podeExcluir } from './demanda';

describe('demanda helpers', () => {
  it('formats the API date (UTC without offset) as dd/mm/yyyy', () => {
    // Meio-dia UTC cai no mesmo dia em qualquer fuso do Brasil.
    expect(formatarData('2026-10-15T12:00:00')).toBe('15/10/2026');
  });

  it('returns an empty string for an unparseable date', () => {
    expect(formatarData('not-a-date')).toBe('');
  });

  it('builds the protocol from the creation year and a zero-padded id', () => {
    expect(formatarProtocolo({ id: 187, createdAt: '2026-10-15T12:00:00' })).toBe('#2026-00187');
  });

  it('lets citizens delete only pending demands, and managers delete any', () => {
    const cidadao = { role: 'cidadao' };
    const gestor = { role: 'gestor' };

    expect(podeExcluir({ status: 'PENDING' }, cidadao)).toBe(true);
    expect(podeExcluir({ status: 'IN_PROGRESS' }, cidadao)).toBe(false);
    expect(podeExcluir({ status: 'RESOLVED' }, gestor)).toBe(true);
  });

  it('lets citizens edit only pending demands, and managers edit any', () => {
    expect(podeEditar({ status: 'PENDING' }, { role: 'cidadao' })).toBe(true);
    expect(podeEditar({ status: 'RESOLVED' }, { role: 'cidadao' })).toBe(false);
    expect(podeEditar({ status: 'IN_PROGRESS' }, { role: 'gestor' })).toBe(true);
  });
});
