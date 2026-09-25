import { demandaAtualizadaRoute, parseEditFeedback, parseIdParam, routes } from './routes';

describe('routes helpers', () => {
  it('parses only positive integer ids from the URL', () => {
    expect(parseIdParam('187')).toBe(187);
    expect(parseIdParam(['7', '8'])).toBe(7);
    expect(parseIdParam('abc')).toBeNull();
    expect(parseIdParam('0')).toBeNull();
    expect(parseIdParam('-3')).toBeNull();
    expect(parseIdParam(undefined)).toBeNull();
  });

  it('round-trips the edit feedback through URL params', () => {
    const route = demandaAtualizadaRoute(7, { at: 123, localizacaoAtualizada: true, fotoFalhou: false });

    expect(route.params.id).toBe('7');
    expect(parseEditFeedback(route.params)).toEqual({ at: 123, localizacaoAtualizada: true, fotoFalhou: false });
    expect(parseEditFeedback({ id: '7' })).toBeUndefined();
  });

  it('only adds fotoPendente to the confirmation route when the upload failed', () => {
    expect(routes.demandaEnviada(5, false).params).toEqual({ id: '5' });
    expect(routes.demandaEnviada(5, true).params).toEqual({ id: '5', fotoPendente: '1' });
  });
});
