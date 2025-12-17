#!/usr/bin/env node

/**
 * MCP List Script
 * Lists all MCPs in the catalog with their details
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MCPS_DIR = path.join(__dirname, '../src/modules/mcps/data/mcps');

function getServiceFolders() {
  return fs
    .readdirSync(MCPS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function loadServiceMeta(service) {
  const metaPath = path.join(MCPS_DIR, service, '_meta.json');
  if (fs.existsSync(metaPath)) {
    const content = fs.readFileSync(metaPath, 'utf-8');
    return JSON.parse(content);
  }
  return null;
}

function loadMCPsFromService(service) {
  const serviceDir = path.join(MCPS_DIR, service);
  const files = fs.readdirSync(serviceDir).filter(
    (f) => f.endsWith('.json') && !f.startsWith('_')
  );

  return files.map((file) => {
    const filePath = path.join(serviceDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    return {
      id: data.id,
      name: data.name,
      service,
      source: data.source,
      transport: data.transport,
      status: data.status,
    };
  });
}

function main() {
  const args = process.argv.slice(2);
  const showJson = args.includes('--json');
  const sourceArg = args.find((a) => a.startsWith('--source='));
  const filterSource = sourceArg ? sourceArg.split('=')[1] : undefined;
  const serviceArg = args.find((a) => a.startsWith('--service='));
  const filterService = serviceArg ? serviceArg.split('=')[1] : undefined;

  const services = getServiceFolders();
  let allMCPs = [];

  for (const service of services) {
    const mcps = loadMCPsFromService(service);
    allMCPs.push(...mcps);
  }

  // Apply filters
  if (filterSource) {
    allMCPs = allMCPs.filter((m) => m.source === filterSource);
  }
  if (filterService) {
    allMCPs = allMCPs.filter((m) => m.service === filterService);
  }

  if (showJson) {
    console.log(JSON.stringify(allMCPs, null, 2));
    return;
  }

  // Display as table
  console.log('MCP Catalog');
  console.log('===========\n');

  // Group by service
  const byService = new Map();
  for (const mcp of allMCPs) {
    const list = byService.get(mcp.service) || [];
    list.push(mcp);
    byService.set(mcp.service, list);
  }

  for (const [service, mcps] of byService) {
    const meta = loadServiceMeta(service);
    const displayName = meta?.displayName || service;

    console.log(`${displayName} (${service}/)`);
    console.log('-'.repeat(40));

    for (const mcp of mcps) {
      const statusBadge = mcp.status === 'deprecated' ? ' [DEPRECATED]' : '';
      const sourceBadge = mcp.source === 'official' ? '★' : '○';
      console.log(`  ${sourceBadge} ${mcp.name} (${mcp.id})${statusBadge}`);
      console.log(`    Transport: ${mcp.transport}`);
    }
    console.log('');
  }

  // Summary
  console.log('Summary');
  console.log('-------');
  console.log(`Total MCPs: ${allMCPs.length}`);
  console.log(`Official: ${allMCPs.filter((m) => m.source === 'official').length}`);
  console.log(`Community: ${allMCPs.filter((m) => m.source === 'community').length}`);
  console.log(`Services: ${services.length}`);

  if (!filterSource && !filterService) {
    console.log('\nFilters available:');
    console.log('  --source=official|community');
    console.log('  --service=<service-name>');
    console.log('  --json (output as JSON)');
  }
}

main();
