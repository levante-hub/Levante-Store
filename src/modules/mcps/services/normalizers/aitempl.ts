import type {
    AitemplResponse,
    AitemplContentStructure,
    MCPServerDescriptor,
    InputDefinition,
} from '@/modules/mcps/types';

/**
 * Normaliza la respuesta de AITempl al formato MCPServerDescriptor
 */
export function normalizeAitempl(
    data: AitemplResponse,
    providerId: string
): MCPServerDescriptor[] {
    return data.mcps.map((server) => {
        let command = 'npx';
        let args: string[] = [];
        let env: Record<string, string> = {};

        try {
            const contentObj: AitemplContentStructure = JSON.parse(server.content);
            const mcpServers = contentObj.mcpServers;

            if (mcpServers) {
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
        }

        // Transformar env a InputDefinition
        const inputs: Record<string, InputDefinition> = {};
        for (const [key, value] of Object.entries(env)) {
            inputs[key] = {
                label: key,
                required: true,
                type: 'string',
                default: value,
                description: `Environment variable: ${key}`,
            };
        }

        return {
            id: `${providerId}-${server.name}`,
            name: server.name,
            description: server.description || '',
            category: server.category || 'general',
            icon: 'server',
            logoUrl: server.logoUrl,
            source: 'community' as const,
            version: 'latest',
            transport: 'stdio' as const,
            inputs,
            configuration: {
                template: {
                    command,
                    args,
                    env,
                },
            },
            provider: providerId,
            metadata: {
                useCount: server.downloads,
            },
        };
    });
}
