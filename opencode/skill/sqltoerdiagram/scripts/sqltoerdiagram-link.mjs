#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { deflateRawSync } from 'node:zlib';

const DIALECTS = new Set(['postgres', 'mysql', 'sqlite', 'sqlserver']);

function usage() {
  return `Usage: sqltoerdiagram-link.mjs <schema.sql> [--dialect postgres|mysql|sqlite|sqlserver] [--copy] [--out file]\n       sqltoerdiagram-link.mjs --stdin [--dialect postgres|mysql|sqlite|sqlserver] [--copy] [--out file]`;
}

function parseArgs(args) {
  let source = null;
  let dialect = 'postgres';
  let copy = false;
  let out = null;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      return { kind: 'help' };
    }

    if (arg === '--stdin') {
      if (source !== null) throw new Error('Only one schema source allowed');
      source = { kind: 'stdin' };
      continue;
    }

    if (arg === '--copy') {
      copy = true;
      continue;
    }

    if (arg === '--out') {
      const value = args[i + 1];
      if (!value) throw new Error('Missing --out value');
      out = value;
      i += 1;
      continue;
    }

    if (arg === '--dialect') {
      const value = args[i + 1];
      if (!value) throw new Error('Missing --dialect value');
      if (!DIALECTS.has(value)) throw new Error(`Unsupported dialect: ${value}`);
      dialect = value;
      i += 1;
      continue;
    }

    if (arg.startsWith('--dialect=')) {
      const value = arg.slice('--dialect='.length);
      if (!DIALECTS.has(value)) throw new Error(`Unsupported dialect: ${value}`);
      dialect = value;
      continue;
    }

    if (arg.startsWith('-')) throw new Error(`Unknown option: ${arg}`);
    if (source !== null) throw new Error('Only one schema source allowed');
    source = { kind: 'file', path: arg };
  }

  if (source === null) throw new Error('Missing schema source');
  return { kind: 'run', source, dialect, copy, out };
}

function readSql(source) {
  if (source.kind === 'stdin') return readFileSync(0, 'utf8');
  return readFileSync(source.path, 'utf8');
}

function base64Url(buffer) {
  return buffer.toString('base64').replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function createUrl(sql, dialect) {
  const project = {
    app: 'dbdiga',
    version: 1,
    sql,
    dialect,
    positions: {},
    annotations: [],
  };

  const compressed = deflateRawSync(Buffer.from(JSON.stringify(project), 'utf8'));
  return `https://sqltoerdiagram.com/#s=z${base64Url(compressed)}`;
}

function copyToClipboard(value) {
  if (process.platform !== 'darwin') return false;

  const result = spawnSync('pbcopy', { input: value, encoding: 'utf8' });
  if (result.error || result.status !== 0) return false;
  return true;
}

try {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.kind === 'help') {
    console.log(usage());
    process.exit(0);
  }

  const sql = readSql(parsed.source);
  if (sql.trim() === '') throw new Error('Schema is empty');
  const url = createUrl(sql, parsed.dialect);

  if (parsed.out) {
    writeFileSync(parsed.out, `${url}\n`, 'utf8');
    console.log(`Wrote sqltoerdiagram URL to ${parsed.out} (${url.length} chars)`);
  }

  if (parsed.copy) {
    if (copyToClipboard(url)) {
      console.log(`Copied sqltoerdiagram URL to clipboard. Length: ${url.length} chars.`);
    } else {
      console.log(url);
    }
  }

  if (!parsed.copy && !parsed.out) console.log(url);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  console.error(usage());
  process.exit(1);
}
