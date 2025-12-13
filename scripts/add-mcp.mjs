#!/usr/bin/env node

/**
 * Interactive MCP Creation Script
 * Guides users through creating a new MCP configuration
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MCPS_DIR = path.join(__dirname, '../src/data/mcps');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function questionWithDefault(prompt, defaultValue) {
  return new Promise((resolve) => {
    rl.question(`${prompt} [${defaultValue}]: `, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

async function selectOption(prompt, options) {
  console.log(`\n${prompt}`);
  options.forEach((opt, i) => console.log(`  ${i + 1}. ${opt}`));
  const answer = await question('Select (number): ');
  const index = parseInt(answer, 10) - 1;
  return options[index] || options[0];
}

async function confirm(prompt) {
  const answer = await question(`${prompt} (y/n): `);
  return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
}

function getExistingServices() {
  return fs
    .readdirSync(MCPS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function generateId(service, name, source) {
  const baseName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (source === 'official') {
    return baseName === service ? service : `${service}-${baseName}`;
  }
  return `${baseName}-community`;
}

function generateFileName(name, source) {
  const baseName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (source === 'official') {
    return `official-${baseName}.json`;
  }
  return `community-${baseName}.json`;
}

async function collectInputs() {
  const inputs = {};
  console.log('\n--- User Inputs (credentials, config) ---');
  console.log('Define variables the user needs to provide.');
  console.log('Leave name empty to finish.\n');

  while (true) {
    const name = await question('Input variable name (e.g., API_KEY): ');
    if (!name.trim()) break;

    const label = await question('  Label: ');
    const type = await selectOption('  Type:', ['string', 'password', 'number', 'boolean']);
    const required = await confirm('  Required?');
    const description = await question('  Description: ');

    inputs[name.trim()] = {
      label,
      required,
      type,
      description,
    };
  }

  return inputs;
}

async function collectStdioConfig(inputs) {
  console.log('\n--- STDIO Configuration ---');
  const command = await questionWithDefault('Command', 'npx');
  const argsStr = await question('Arguments (space-separated, e.g., -y @example/mcp): ');
  const args = argsStr.split(' ').filter(Boolean);

  const env = {};
  if (Object.keys(inputs).length > 0) {
    console.log('\nMap inputs to environment variables:');
    for (const [key] of Object.entries(inputs)) {
      const envVar = await questionWithDefault(`  ${key} -> ENV var`, key);
      env[envVar] = `\${${key}}`;
    }
  }

  return {
    template: {
      command,
      args,
      env,
    },
  };
}

async function collectHttpConfig(transport, inputs) {
  console.log(`\n--- ${transport.toUpperCase()} Configuration ---`);
  const url = await question('URL endpoint: ');

  const headers = {};
  if (Object.keys(inputs).length > 0) {
    console.log('\nMap inputs to headers:');
    for (const [key] of Object.entries(inputs)) {
      const useInHeader = await confirm(`  Use ${key} in headers?`);
      if (useInHeader) {
        const headerName = await questionWithDefault('  Header name', 'Authorization');
        const headerValue = await questionWithDefault('  Header value template', `Bearer \${${key}}`);
        headers[headerName] = headerValue;
      }
    }
  }

  return {
    template: {
      type: transport,
      url,
      headers,
    },
  };
}

async function main() {
  console.log('=================================');
  console.log('   Add New MCP - Interactive');
  console.log('=================================\n');

  // Service selection
  const existingServices = getExistingServices();
  console.log('Existing services:', existingServices.join(', ') || 'none');

  const serviceName = await question('\nService name (existing or new): ');
  const service = serviceName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const serviceDir = path.join(MCPS_DIR, service);

  const isNewService = !existingServices.includes(service);

  if (isNewService) {
    console.log(`\nCreating new service: ${service}`);
    fs.mkdirSync(serviceDir, { recursive: true });

    // Create _meta.json
    const displayName = await question('Service display name: ');
    const serviceDesc = await question('Service description: ');
    const website = await question('Service website (or empty): ');
    const category = await selectOption('Category:', [
      'documentation', 'development', 'database', 'automation',
      'ai', 'communication', 'productivity', 'other'
    ]);

    const meta = {
      service,
      displayName,
      description: serviceDesc,
      website: website || null,
      icon: service,
      category,
    };

    fs.writeFileSync(
      path.join(serviceDir, '_meta.json'),
      JSON.stringify(meta, null, 2) + '\n'
    );
    console.log(`Created: ${service}/_meta.json`);
  }

  // MCP details
  console.log('\n--- MCP Details ---');
  const mcpName = await question('MCP name: ');
  const description = await question('Description: ');
  const source = await selectOption('Source type:', ['official', 'community']);
  const transport = await selectOption('Transport:', ['stdio', 'sse', 'streamable-http']);

  const category = await selectOption('Category:', [
    'documentation', 'development', 'database', 'automation',
    'ai', 'communication', 'productivity', 'other'
  ]);

  const logoUrl = await question('Logo URL (or empty): ');

  // Maintainer
  console.log('\n--- Maintainer ---');
  const maintainerName = await question('Maintainer name: ');
  const maintainerUrl = await question('Maintainer URL (or empty): ');
  const maintainerGithub = await question('GitHub username/org: ');

  // Inputs
  const inputs = await collectInputs();

  // Configuration based on transport
  let configuration;
  if (transport === 'stdio') {
    configuration = await collectStdioConfig(inputs);
  } else {
    configuration = await collectHttpConfig(transport, inputs);
  }

  // Metadata
  console.log('\n--- Metadata ---');
  const homepage = await question('Documentation URL (or empty): ');
  const repository = await question('Repository URL (or empty): ');

  const today = new Date().toISOString().split('T')[0];

  // Generate MCP
  const mcpId = generateId(service, mcpName, source);
  const fileName = source === 'official' && mcpName.toLowerCase() === service
    ? 'official.json'
    : generateFileName(mcpName, source);

  const mcp = {
    $schema: '../_schema.json',
    id: mcpId,
    name: mcpName,
    description,
    category,
    icon: service,
    ...(logoUrl && { logoUrl }),
    source,
    maintainer: {
      name: maintainerName,
      ...(maintainerUrl && { url: maintainerUrl }),
      ...(maintainerGithub && { github: maintainerGithub }),
    },
    status: 'active',
    version: '1.0.0',
    transport,
    inputs,
    configuration,
    metadata: {
      ...(homepage && { homepage }),
      ...(repository && { repository }),
      addedAt: today,
      lastUpdated: today,
    },
  };

  // Write file
  const filePath = path.join(serviceDir, fileName);
  fs.writeFileSync(filePath, JSON.stringify(mcp, null, 2) + '\n');

  console.log('\n=================================');
  console.log('   MCP Created Successfully!');
  console.log('=================================');
  console.log(`\nFile: src/data/mcps/${service}/${fileName}`);
  console.log(`ID: ${mcpId}`);
  console.log('\nNext steps:');
  console.log('  1. npm run validate-mcps');
  console.log('  2. npm run list-mcps');
  console.log('  3. git add && git commit');
  console.log('  4. Open a Pull Request');

  rl.close();
}

main().catch((err) => {
  console.error('Error:', err);
  rl.close();
  process.exit(1);
});
