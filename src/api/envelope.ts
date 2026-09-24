import axios from 'axios';

// Contrato padrão do backend Flask: toda resposta vem como { data, message, status_code }.
export type ApiEnvelope<T> = {
  data: T;
  message: string;
  status_code: number;
};

export type ApiFieldErrors = Record<string, string[]>;

/** Erro 400/422 com mensagens por campo (`data.errors`), para mapear no formulário. */
export class ApiValidationError extends Error {
  errors: ApiFieldErrors;
  constructor(message: string, errors: ApiFieldErrors) {
    super(message);
    this.name = 'ApiValidationError';
    this.errors = errors;
  }
}

export const NETWORK_ERROR_MESSAGE =
  'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';

function hasFieldErrors(data: unknown): data is { errors: ApiFieldErrors } {
  return typeof data === 'object' && data !== null && 'errors' in data;
}

/** Desembrulha `data` do envelope e converte falhas da API em erros com mensagem legível. */
export async function unwrap<T>(promise: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  try {
    const response = await promise;
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.data) {
        const envelope = error.response.data as ApiEnvelope<unknown>;
        if (hasFieldErrors(envelope.data)) {
          throw new ApiValidationError(envelope.message, envelope.data.errors);
        }
        throw new Error(envelope.message || 'Erro inesperado ao comunicar com o servidor');
      }
      if (!error.response) {
        throw new Error(NETWORK_ERROR_MESSAGE);
      }
    }
    throw error;
  }
}
