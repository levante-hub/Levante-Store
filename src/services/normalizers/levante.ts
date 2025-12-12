import type { MCPServerDescriptor, MCPStoreResponse } from '../../types/mcps';

/**
 * Normaliza el formato de Levante (ya está en formato correcto, solo añade provider)
 */
export function normalizeLevante(
    data: unknown,
    providerId: string
): MCPServerDescriptor[] {
    const response = data as MCPStoreResponse;

    return response.servers.map((server) => ({
        ...server,
        provider: providerId, // Añadir campo provider a cada servidor
    }));
}
