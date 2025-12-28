export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Levante API Services',
    description: `
API services for the Levante ecosystem.

## MCP Catalog
Discover and retrieve MCP (Model Context Protocol) server configurations organized by service providers.
Each MCP includes configuration templates for different transport types (stdio, sse, streamable-http).

### Source Types
- **official**: MCPs created and maintained by the service provider
- **community**: MCPs created by third-party contributors

### Transport Types
- **stdio**: Command-line based MCPs (local execution)
- **sse**: Server-Sent Events based MCPs (HTTP streaming)
- **streamable-http**: HTTP-based MCPs with streaming support
    `,
    version: '1.0.0',
    contact: {
      name: 'Levante API Services',
      url: 'https://github.com/levante-hub/Levante-Store',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'API Base URL',
    },
  ],
  tags: [
    {
      name: 'Catalog',
      description: 'MCP catalog operations',
    },
    {
      name: 'Services',
      description: 'Service provider operations',
    },
    {
      name: 'Statistics',
      description: 'Catalog statistics',
    },
    {
      name: 'Announcements',
      description: 'Announcements operations',
    },
  ],
  paths: {
    '/mcps.json': {
      get: {
        tags: ['Catalog'],
        summary: 'Get full MCP catalog',
        description: 'Returns the complete catalog of MCP servers with optional source filtering',
        operationId: 'getMcpsCatalog',
        parameters: [
          {
            name: 'source',
            in: 'query',
            description: 'Filter by source type',
            required: false,
            schema: {
              type: 'string',
              enum: ['official', 'community'],
            },
          },
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/MCPStoreResponse',
                },
              },
            },
          },
        },
      },
    },
    '/mcps/{id}': {
      get: {
        tags: ['Catalog'],
        summary: 'Get MCP by ID',
        description: 'Returns a specific MCP server by its unique identifier',
        operationId: 'getMcpById',
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'MCP server ID',
            required: true,
            schema: {
              type: 'string',
            },
            examples: {
              supabase: { value: 'supabase' },
              playwright: { value: 'playwright' },
              context7: { value: 'context7' },
            },
          },
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/MCPServer',
                },
              },
            },
          },
          '404': {
            description: 'MCP not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/mcps/services': {
      get: {
        tags: ['Services'],
        summary: 'List all services',
        description: 'Returns a list of all available service providers with their metadata',
        operationId: 'getServices',
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    services: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/ServiceMeta',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/mcps/service/{service}': {
      get: {
        tags: ['Services'],
        summary: 'Get MCPs by service',
        description: 'Returns all MCPs from a specific service provider',
        operationId: 'getMcpsByService',
        parameters: [
          {
            name: 'service',
            in: 'path',
            description: 'Service name',
            required: true,
            schema: {
              type: 'string',
            },
            examples: {
              github: { value: 'github' },
              supabase: { value: 'supabase' },
              documentation: { value: 'documentation' },
            },
          },
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/MCPStoreResponse',
                },
              },
            },
          },
          '404': {
            description: 'Service not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/mcps/stats': {
      get: {
        tags: ['Statistics'],
        summary: 'Get catalog statistics',
        description: 'Returns statistics about the MCP catalog',
        operationId: 'getStats',
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Stats',
                },
              },
            },
          },
        },
      },
    },
    '/announcements': {
      get: {
        tags: ['Announcements'],
        summary: 'Get latest announcement(s) by category',
        description: 'Returns the latest announcement(s) filtered by one or more categories. For a single category, returns one announcement. For multiple categories (comma-separated), returns an array of announcements.',
        operationId: 'getAnnouncements',
        parameters: [
          {
            name: 'category',
            in: 'query',
            description: 'Category or comma-separated categories to filter announcements',
            required: true,
            schema: {
              type: 'string',
            },
            examples: {
              single: {
                value: 'announcement',
                summary: 'Single category',
              },
              multiple: {
                value: 'announcement,privacy,landing',
                summary: 'Multiple categories',
              },
            },
          },
          {
            name: 'language',
            in: 'query',
            description: 'Language for the announcement content',
            required: true,
            schema: {
              type: 'string',
              enum: ['es', 'en'],
            },
            examples: {
              spanish: {
                value: 'es',
                summary: 'Spanish',
              },
              english: {
                value: 'en',
                summary: 'English',
              },
            },
          },
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    {
                      $ref: '#/components/schemas/AnnouncementResponse',
                    },
                    {
                      $ref: '#/components/schemas/AnnouncementsResponse',
                    },
                  ],
                },
              },
            },
          },
          '400': {
            description: 'Bad request - missing or invalid category',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      MCPStoreResponse: {
        type: 'object',
        required: ['version', 'provider', 'servers'],
        properties: {
          version: {
            type: 'string',
            example: '1.0.0',
          },
          provider: {
            $ref: '#/components/schemas/Provider',
          },
          servers: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/MCPServer',
            },
          },
        },
      },
      Provider: {
        type: 'object',
        required: ['id', 'name'],
        properties: {
          id: {
            type: 'string',
            example: 'levante-api-services',
          },
          name: {
            type: 'string',
            example: 'Levante API Services',
          },
          homepage: {
            type: 'string',
            example: 'https://github.com/levante-hub/Levante-Store',
          },
        },
      },
      MCPServer: {
        type: 'object',
        required: ['id', 'name', 'description', 'category', 'source', 'transport', 'configuration'],
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier',
            example: 'supabase',
          },
          name: {
            type: 'string',
            description: 'Display name',
            example: 'Supabase',
          },
          description: {
            type: 'string',
            description: 'Brief description',
            example: 'Access Supabase database and API through MCP',
          },
          category: {
            type: 'string',
            enum: [
              'documentation',
              'development',
              'database',
              'automation',
              'ai',
              'communication',
              'productivity',
              'mcp-ui',
              'christmas',
              'other',
            ],
            example: 'database',
          },
          icon: {
            type: 'string',
            example: 'database',
          },
          logoUrl: {
            type: 'string',
            format: 'uri',
            example: 'https://supabase.com/brand-assets/supabase-logo-icon.png',
          },
          source: {
            type: 'string',
            enum: ['official', 'community'],
            description: 'Origin of the MCP',
            example: 'official',
          },
          maintainer: {
            $ref: '#/components/schemas/Maintainer',
          },
          status: {
            type: 'string',
            enum: ['active', 'deprecated', 'experimental'],
            default: 'active',
          },
          version: {
            type: 'string',
            example: '1.0.0',
          },
          transport: {
            type: 'string',
            enum: ['stdio', 'sse', 'streamable-http'],
            description: 'Transport protocol',
            example: 'streamable-http',
          },
          inputs: {
            type: 'object',
            description: 'User-provided inputs required for this MCP',
            additionalProperties: {
              $ref: '#/components/schemas/InputDefinition',
            },
          },
          configuration: {
            type: 'object',
            description: 'Configuration template',
            properties: {
              template: {
                type: 'object',
              },
            },
          },
          metadata: {
            $ref: '#/components/schemas/Metadata',
          },
        },
      },
      Maintainer: {
        type: 'object',
        required: ['name'],
        properties: {
          name: {
            type: 'string',
            example: 'Supabase',
          },
          url: {
            type: 'string',
            format: 'uri',
            example: 'https://supabase.com',
          },
          github: {
            type: 'string',
            example: 'supabase',
          },
        },
      },
      InputDefinition: {
        type: 'object',
        required: ['label', 'required', 'type'],
        properties: {
          label: {
            type: 'string',
            example: 'API Key',
          },
          required: {
            type: 'boolean',
            example: true,
          },
          type: {
            type: 'string',
            enum: ['string', 'password', 'number', 'boolean'],
            example: 'password',
          },
          default: {
            type: 'string',
          },
          description: {
            type: 'string',
            example: 'Your API key for authentication',
          },
        },
      },
      Metadata: {
        type: 'object',
        properties: {
          homepage: {
            type: 'string',
            format: 'uri',
          },
          repository: {
            type: 'string',
            format: 'uri',
          },
          author: {
            type: 'string',
          },
          addedAt: {
            type: 'string',
            format: 'date',
          },
          lastUpdated: {
            type: 'string',
            format: 'date',
          },
        },
      },
      ServiceMeta: {
        type: 'object',
        required: ['service', 'displayName'],
        properties: {
          service: {
            type: 'string',
            example: 'supabase',
          },
          displayName: {
            type: 'string',
            example: 'Supabase',
          },
          description: {
            type: 'string',
            example: 'MCPs for Supabase database and backend services',
          },
          website: {
            type: 'string',
            format: 'uri',
            nullable: true,
          },
          icon: {
            type: 'string',
          },
          category: {
            type: 'string',
          },
        },
      },
      Stats: {
        type: 'object',
        properties: {
          total: {
            type: 'integer',
            description: 'Total number of MCPs',
            example: 5,
          },
          official: {
            type: 'integer',
            description: 'Number of official MCPs',
            example: 5,
          },
          community: {
            type: 'integer',
            description: 'Number of community MCPs',
            example: 0,
          },
          services: {
            type: 'integer',
            description: 'Number of services',
            example: 4,
          },
          serviceList: {
            type: 'array',
            items: {
              type: 'string',
            },
            example: ['documentation', 'github', 'playwright', 'supabase'],
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            example: 'MCP server not found',
          },
          id: {
            type: 'string',
            example: 'unknown-mcp',
          },
        },
      },
      Announcement: {
        type: 'object',
        required: ['id', 'title', 'full_text', 'category', 'created_at'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique identifier',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          title: {
            type: 'string',
            description: 'Announcement title',
            example: 'New Feature Released',
          },
          full_text: {
            type: 'string',
            description: 'Full announcement text',
            example: 'We are excited to announce the release of our new feature...',
          },
          category: {
            type: 'string',
            enum: ['announcement', 'privacy', 'landing', 'all'],
            description: 'Announcement category',
            example: 'announcement',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
            example: '2025-12-21T15:30:00Z',
          },
        },
      },
      AnnouncementResponse: {
        type: 'object',
        description: 'Response for single category query',
        required: ['announcement'],
        properties: {
          announcement: {
            oneOf: [
              {
                $ref: '#/components/schemas/Announcement',
              },
              {
                type: 'null',
              },
            ],
            description: 'The latest announcement for the requested category, or null if none found',
          },
        },
      },
      AnnouncementsResponse: {
        type: 'object',
        description: 'Response for multiple categories query',
        required: ['announcements', 'total'],
        properties: {
          announcements: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Announcement',
            },
            description: 'Array of latest announcements for each requested category',
          },
          total: {
            type: 'integer',
            description: 'Number of announcements returned',
            example: 2,
          },
        },
      },
    },
  },
};
