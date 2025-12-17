import type {
    ProviderConfig,
    MCPServerDescriptor,
    AitemplResponse,
} from '../types';
import { normalizeAitempl } from './normalizers/aitempl';
import { catalogAggregator } from './catalogAggregator';
import providersConfig from '../data/providers.json';

/**
 * Servicio principal para gestión de proveedores MCP
 */
export class MCPProviderService {
    private providers: ProviderConfig[];

    constructor() {
        this.providers = providersConfig.providers as ProviderConfig[];
    }

    /**
     * Obtiene todos los proveedores configurados
     */
    getProviders(): ProviderConfig[] {
        return this.providers.filter((p) => p.enabled);
    }

    /**
     * Sincroniza un proveedor específico
     */
    async syncProvider(providerId: string): Promise<MCPServerDescriptor[]> {
        const provider = this.providers.find((p) => p.id === providerId);

        if (!provider || !provider.enabled) {
            throw new Error(`Provider not found or disabled: ${providerId}`);
        }

        console.log(`Syncing provider: ${provider.id} (${provider.type})`);

        try {
            let servers: MCPServerDescriptor[];

            if (provider.type === 'local') {
                // Cargar desde archivo local
                servers = await this.fetchFromLocal(provider);
            } else if (provider.type === 'api') {
                // Obtener desde API externa
                servers = await this.fetchFromAPI(provider);
            } else {
                throw new Error(`Unsupported provider type: ${provider.type}`);
            }

            console.log(`✓ Provider ${provider.id} synced: ${servers.length} servers`);
            return servers;
        } catch (error) {
            console.error(`✗ Failed to sync provider ${provider.id}:`, error);
            throw error;
        }
    }

    /**
     * Sincroniza todos los proveedores habilitados
     */
    async syncAllProviders(): Promise<MCPServerDescriptor[]> {
        const enabledProviders = this.getProviders();
        const allServers: MCPServerDescriptor[] = [];

        for (const provider of enabledProviders) {
            try {
                const servers = await this.syncProvider(provider.id);
                allServers.push(...servers);
            } catch (error) {
                console.error(`Failed to sync provider ${provider.id}, continuing...`);
                // No detener el proceso si un proveedor falla
            }
        }

        return allServers;
    }

    /**
     * Obtiene desde proveedor local (carga dinámica desde carpetas)
     */
    private async fetchFromLocal(provider: ProviderConfig): Promise<MCPServerDescriptor[]> {
        if (provider.id === 'levante') {
            return catalogAggregator.aggregateAll();
        }

        throw new Error(`Local provider ${provider.id} not implemented`);
    }

    /**
     * Obtiene desde proveedor externo (API)
     */
    private async fetchFromAPI(provider: ProviderConfig): Promise<MCPServerDescriptor[]> {
        const response = await fetch(provider.endpoint, {
            headers: {
                Accept: 'application/json',
                'User-Agent': 'Levante-Store/1.0',
            },
        });

        if (!response.ok) {
            throw new Error(
                `API fetch failed: ${response.status} ${response.statusText}`
            );
        }

        const data = await response.json();

        // Normalizar según el proveedor
        if (provider.id === 'aitempl') {
            return normalizeAitempl(data as AitemplResponse, provider.id);
        }

        throw new Error(`No normalizer for provider: ${provider.id}`);
    }

    /**
     * Obtiene un servidor específico por ID
     */
    async getServerById(serverId: string): Promise<MCPServerDescriptor | null> {
        const allServers = await this.syncAllProviders();
        return allServers.find((s) => s.id === serverId) || null;
    }
}

// Exportar instancia singleton
export const mcpProviderService = new MCPProviderService();
