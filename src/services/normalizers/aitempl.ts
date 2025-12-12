import type {
    AitemplResponse,
    AitemplContentStructure,
    MCPServerDescriptor,
    EnvVarDefinition,
} from '../../types/mcps';

/**
 * Normaliza la respuesta de AITempl al formato MCPServerDescriptor
 *
 * Desafíos:
 * 1. El campo 'content' está JSON stringificado
 * 2. La estructura es diferente (mcpServers -> [nombre] -> config)
 * 3. Las variables de entorno son strings simples, no objetos EnvVarDefinition
 */
export function normalizeAitempl(
    data: AitemplResponse,
    providerId: string
): MCPServerDescriptor[] {
    return data.mcps.map((server) => {
        // Paso 1: Valores por defecto
        let command = 'npx';
        let args: string[] = [];
        let env: Record<string, string> = {};

        try {
            // Paso 2: Parsear el campo 'content' (JSON stringificado)
            const contentObj: AitemplContentStructure = JSON.parse(server.content);
            const mcpServers = contentObj.mcpServers;

            if (mcpServers) {
                // Paso 3: Obtener la primera (y típicamente única) configuración de servidor
                const serverKey = Object.keys(mcpServers)[0];
                if (serverKey && mcpServers[serverKey]) {
                    const serverConfig = mcpServers[serverKey];
                    command = serverConfig.command || 'npx';
                    args = serverConfig.args || [];
                    env = serverConfig.env || {};
                }
            }
        } catch (e) {
            console.warn(`Failed to parse AITempl server content for ${server.name}:`, e);
            // Continuar con valores por defecto
        }

        // Paso 4: Transformar env de Record<string, string> a Record<string, EnvVarDefinition>
        const envDefinitions: Record<string, EnvVarDefinition> = {};
        for (const [key, value] of Object.entries(env)) {
            envDefinitions[key] = {
                label: key,
                required: true,
                type: 'string',
                default: value,
                description: `Environment variable: ${key}`,
            };
        }

        // Paso 5: Generar MCPServerDescriptor
        return {
            id: `${providerId}-${server.name}`, // ej: "aitempl-filesystem"
            name: server.name,
            description: server.description || '',
            category: server.category || 'general',
            icon: 'server', // Icono por defecto para AITempl
            logoUrl: server.logoUrl,
            provider: providerId, // ✅ Campo provider
            transport: 'stdio', // AITempl solo provee servidores stdio
            command,
            args,
            env: envDefinitions,
            metadata: {
                useCount: server.downloads, // Mapear downloads a useCount
            },
        };
    });
}
