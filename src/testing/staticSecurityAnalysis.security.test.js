import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

// Static security checks scanning src/ for dangerous patterns like dangerouslySetInnerHTML.

const SRC_ROOT = join(__dirname, '..');
const EXCLUDED_DIR_SEGMENT = `${sep}i18n${sep}translations${sep}`;

function listSourceFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      out.push(...listSourceFiles(full));
      continue;
    }
    if (!['.js', '.jsx'].includes(extname(entry))) continue;
    if (/\.test\.jsx?$/.test(entry)) continue;
    if (full.includes(EXCLUDED_DIR_SEGMENT)) continue;
    out.push(full);
  }
  return out;
}

const FILES = listSourceFiles(SRC_ROOT).map((file) => ({
  file: relative(SRC_ROOT, file),
  content: readFileSync(file, 'utf8'),
}));

function filesMatching(pattern) {
  return FILES.filter(({ content }) => pattern.test(content)).map(({ file }) => file);
}

describe('SEC: static analysis of src/ — no dangerous DOM/eval sinks', () => {
  it('never uses dangerouslySetInnerHTML', () => {
    expect(filesMatching(/dangerouslySetInnerHTML/)).toEqual([]);
  });

  it('never assigns to element.innerHTML/outerHTML', () => {
    expect(filesMatching(/\.(innerHTML|outerHTML)\s*=/)).toEqual([]);
  });

  it('never calls eval() or the Function constructor on a dynamic string', () => {
    expect(filesMatching(/\beval\s*\(|new\s+Function\s*\(/)).toEqual([]);
  });
});

describe('SEC: static analysis of src/ — safe external links', () => {
  it('never opens target="_blank" without rel="noopener"', () => {
    // Heuristic: any file that mentions _blank must also mention noopener somewhere
    // in it. There are currently no target="_blank" links in the app at all.
    const hits = FILES.filter(
      ({ content }) => content.includes('_blank') && !content.includes('noopener'),
    ).map(({ file }) => file);
    expect(hits).toEqual([]);
  });
});

describe('SEC: static analysis of src/ — no hardcoded credentials', () => {
  it('carries no private key material, AWS access key ids, or literal secret/password assignments', () => {
    const patterns = [
      /-----BEGIN (RSA|EC|DSA|OPENSSH|PGP) PRIVATE KEY-----/,
      /AKIA[0-9A-Z]{16}/,
      /(?:secret|passwd|api[_-]?key)\s*[:=]\s*['"][^'"\s]{8,}['"]/i,
    ];

    const hits = [];
    for (const pattern of patterns) {
      hits.push(...filesMatching(pattern).map((file) => `${file} matches ${pattern}`));
    }
    expect(hits).toEqual([]);
  });
});
