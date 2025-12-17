#!/usr/bin/env node

/**
 * MCP Validation Script
 * Validates all MCP JSON files against the schema
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MCPS_DIR = path.join(__dirname, '../src/modules/mcps/data/mcps');
const SCHEMA_PATH = path.join(MCPS_DIR, '_schema.json');

function loadSchema() {
  const schemaContent = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  return JSON.parse(schemaContent);
}

function findMCPFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...findMCPFiles(fullPath));
    } else if (
      entry.isFile() &&
      entry.name.endsWith('.json') &&
      !entry.name.startsWith('_')
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

function validateFile(filePath, validate) {
  const relativePath = path.relative(MCPS_DIR, filePath);

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    const valid = validate(data);

    if (!valid && validate.errors) {
      return {
        file: relativePath,
        valid: false,
        errors: validate.errors.map((e) => `${e.instancePath} ${e.message}`),
      };
    }

    return { file: relativePath, valid: true };
  } catch (error) {
    return {
      file: relativePath,
      valid: false,
      errors: [`Parse error: ${error.message}`],
    };
  }
}

function main() {
  console.log('MCP Validation Script');
  console.log('=====================\n');

  // Initialize AJV
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);

  // Load and compile schema
  let schema;
  try {
    schema = loadSchema();
  } catch (error) {
    console.error(`Error loading schema: ${error.message}`);
    process.exit(1);
  }

  const validate = ajv.compile(schema);

  // Find all MCP files
  const mcpFiles = findMCPFiles(MCPS_DIR);

  if (mcpFiles.length === 0) {
    console.log('No MCP files found.');
    process.exit(0);
  }

  console.log(`Found ${mcpFiles.length} MCP file(s)\n`);

  // Validate each file
  const results = mcpFiles.map((file) => validateFile(file, validate));

  // Display results
  const validCount = results.filter((r) => r.valid).length;
  const invalidCount = results.filter((r) => !r.valid).length;

  for (const result of results) {
    if (result.valid) {
      console.log(`✓ ${result.file}`);
    } else {
      console.log(`✗ ${result.file}`);
      for (const error of result.errors || []) {
        console.log(`    - ${error}`);
      }
    }
  }

  console.log('\n---------------------');
  console.log(`Total: ${results.length} | Valid: ${validCount} | Invalid: ${invalidCount}`);

  // Exit with error code if any validation failed
  if (invalidCount > 0) {
    process.exit(1);
  }
}

main();
