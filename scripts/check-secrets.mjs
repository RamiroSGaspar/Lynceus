#!/usr/bin/env node
// Blocks commits that carry credentials. Runs from the git pre-commit hook on the
// staged files, and over every tracked file with `--all`.
// It reports the file and the kind of finding, never the matched text.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const all = process.argv.includes('--all');
const git = (args) => execFileSync('git', args, { encoding: 'buffer', maxBuffer: 256 * 1024 * 1024 });
const root = git(['rev-parse', '--show-toplevel']).toString('utf8').trim();

const FORBIDDEN_NAMES = [
  { name: 'environment file', test: (p) => /(^|\/)\.env(\.(?!example$)[^/]*)?$/.test(p) },
  { name: 'private key file', test: (p) => /\.(pem|p12|pfx|key)$/.test(p) || /(^|\/)id_(rsa|dsa|ecdsa|ed25519)$/.test(p) },
  { name: 'credentials file', test: (p) => /(^|\/)(\.npmrc|\.netrc|\.git-credentials|credentials\.json)$/.test(p) },
  { name: 'Vercel project link', test: (p) => /(^|\/)\.vercel\//.test(p) },
];

const CONTENT_PATTERNS = [
  { name: 'Anthropic API key', re: /sk-ant-[A-Za-z0-9_-]{16,}/ },
  { name: 'API key assignment', re: /(ANTHROPIC|OPENAI|VERCEL)_[A-Z_]*(KEY|TOKEN)\s*[:=]\s*['"]?[A-Za-z0-9_-]{20,}/ },
  { name: 'private key block', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: 'GitHub token', re: /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}|\bgithub_pat_[A-Za-z0-9_]{30,}/ },
  { name: 'npm token', re: /\bnpm_[A-Za-z0-9]{30,}|_authToken\s*=\s*\S{10,}/ },
];

const list = all
  ? git(['-C', root, 'ls-files', '-z'])
  : git(['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR']);
const paths = list.toString('utf8').split('\0').filter(Boolean);

const findings = [];
for (const path of paths) {
  for (const rule of FORBIDDEN_NAMES) {
    if (rule.test(path)) findings.push(`${path}: ${rule.name}`);
  }
  let content;
  try {
    // Staged content for a commit; working tree content for a full scan.
    content = all ? readFileSync(join(root, path)) : git(['show', `:${path}`]);
  } catch {
    continue;
  }
  if (content.length > 5 * 1024 * 1024 || content.subarray(0, 8000).includes(0)) continue;
  const text = content.toString('utf8');
  for (const rule of CONTENT_PATTERNS) {
    if (rule.re.test(text)) findings.push(`${path}: ${rule.name}`);
  }
}

if (findings.length > 0) {
  console.error('Possible credentials found. Nothing was committed.\n');
  for (const finding of findings) console.error(`  - ${finding}`);
  console.error('\nRemove them (keys belong in an untracked .env file) and try again.');
  process.exit(1);
}
if (all) console.log(`check-secrets: ${paths.length} tracked files scanned, nothing found.`);
