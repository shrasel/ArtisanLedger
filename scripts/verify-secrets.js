#!/usr/bin/env node

/**
 * Artisan Ledger — Pre-Commit Security & Secret Scanner
 * Inspects all staged files and diffs to prevent accidental commits of
 * credentials, API tokens, SQLite databases, and private keys.
 */

const { execSync } = require('child_process');
const path = require('path');

const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function getStagedFiles() {
  try {
    const stdout = execSync('git diff --cached --name-only --diff-filter=ACMR', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return stdout
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);
  } catch (err) {
    return [];
  }
}

// 1. Forbidden File Patterns (Cannot be staged under any circumstances)
const FORBIDDEN_FILE_RULES = [
  {
    pattern: /^\.env(\..+)?$/i,
    allowed: /^\.env\.example$/i,
    description: 'Environment file containing live credentials',
  },
  {
    pattern: /(^|\/)(ledger\.db.*|\.sqlite.*|\.db(-\w+)?)$/i,
    description: 'Embedded SQLite database file containing ledger state',
  },
  {
    pattern: /\.(pem|key|pkcs12|pfx|p12|keystore)$/i,
    description: 'Cryptographic private key or certificate bundle',
  },
  {
    pattern: /(^|\/)id_(rsa|ed25519|ecdsa|dsa)(\.pub)?$/i,
    description: 'SSH private or public key identity',
  },
  {
    pattern: /(credentials|service[-_]account|client[-_]secret).*\.json$/i,
    description: 'Service account or OAuth secret credentials file',
  },
  {
    pattern: /(^|\/)\.npmrc$/i,
    description: 'NPM runtime config (may contain auth tokens)',
  },
];

// 2. High-Risk Secret Patterns in Staged Content
const SECRET_DIFF_PATTERNS = [
  {
    name: 'Resend API Key',
    regex: /\bre_[a-zA-Z0-9]{24,}\b/,
  },
  {
    name: 'OpenAI Secret API Key',
    regex: /sk-(?:proj-)?[A-Za-z0-9_-]{32,}/,
  },
  {
    name: 'Private Encryption Key Header',
    regex: /-----BEGIN (?:RSA |OPENSSH |EC |PGP )?PRIVATE KEY-----/,
  },
  {
    name: 'GitHub Personal Access Token',
    regex: /(?:ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{82})/,
  },
  {
    name: 'AWS Access Key ID',
    regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/,
  },
  {
    name: 'Generic Hardcoded JWT Token',
    regex: /eyJ[A-Za-z0-9-_]{18,}\.eyJ[A-Za-z0-9-_]{18,}\.[A-Za-z0-9-_]{20,}/,
  },
  {
    name: 'Database URL with Embedded Password',
    regex: /(?:postgres|postgresql|mysql|mongodb(?:\+srv)?):\/\/[^\s:]+:[^\s@]+@/,
  },
  {
    name: 'Google App Password (16-char)',
    regex: /(?:smtpPass|smtp_pass|password|app_password)\s*[:=]\s*['"][a-z]{4}\s*[a-z]{4}\s*[a-z]{4}\s*[a-z]{4}['"]/i,
  },
];

function checkSecurity() {
  const stagedFiles = getStagedFiles();
  if (stagedFiles.length === 0) {
    process.exit(0);
  }

  const violations = [];

  // Phase A: File Name Inspection
  for (const file of stagedFiles) {
    for (const rule of FORBIDDEN_FILE_RULES) {
      if (rule.pattern.test(file)) {
        if (rule.allowed && rule.allowed.test(file)) {
          continue;
        }
        violations.push({
          file,
          type: 'Forbidden File',
          detail: rule.description,
        });
      }
    }
  }

  // Phase B: Staged Diff Inspection for Secret Leakage
  for (const file of stagedFiles) {
    // Skip binary files, lockfiles, or files that failed filename checks
    if (file === 'package-lock.json' || file.endsWith('.lock') || file.endsWith('.png') || file.endsWith('.jpg')) {
      continue;
    }

    try {
      const diff = execSync(`git diff --cached -U0 -- "${file}"`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const lines = diff.split('\n');
      for (const line of lines) {
        // Only inspect added lines (starting with '+', but not '+++')
        if (line.startsWith('+') && !line.startsWith('+++')) {
          const addedContent = line.slice(1);
          for (const pattern of SECRET_DIFF_PATTERNS) {
            if (pattern.regex.test(addedContent)) {
              // Mask sensitive match for display
              const match = addedContent.match(pattern.regex)[0];
              const masked =
                match.length > 8
                  ? `${match.slice(0, 4)}...${match.slice(-4)}`
                  : '****';
              violations.push({
                file,
                type: `Secret Detected (${pattern.name})`,
                detail: `Staged addition matches pattern: ${masked}`,
              });
            }
          }
        }
      }
    } catch (err) {
      // Ignore git diff errors for non-text files
    }
  }

  if (violations.length > 0) {
    console.error(`\n${RED}${BOLD}╔══════════════════════════════════════════════════════════════════════════════════╗${RESET}`);
    console.error(`${RED}${BOLD}║  SECURITY ALERT: SENSITIVE DATA OR SECRETS DETECTED IN STAGED COMMIT             ║${RESET}`);
    console.error(`${RED}${BOLD}╚══════════════════════════════════════════════════════════════════════════════════╝${RESET}\n`);
    console.error(`${YELLOW}The commit has been BLOCKED to prevent sensitive credentials from leaking.${RESET}\n`);

    console.error(`${BOLD}Violations Found (${violations.length}):${RESET}`);
    violations.forEach((v, idx) => {
      console.error(`  ${RED}[${idx + 1}] ${v.file}${RESET}`);
      console.error(`      ${CYAN}Category:${RESET} ${v.type}`);
      console.error(`      ${YELLOW}Details:${RESET}  ${v.detail}`);
    });

    console.error(`\n${BOLD}Remediation Steps:${RESET}`);
    console.error(`  1. Unstage the sensitive file:`);
    console.error(`     ${CYAN}git reset HEAD <file-path>${RESET}`);
    console.error(`  2. Ensure the file or secret pattern is excluded in ${CYAN}.gitignore${RESET}`);
    console.error(`  3. Move any credentials to an uncommitted ${CYAN}.env.local${RESET} file.`);
    console.error(`\n${RED}${BOLD}Commit aborted.${RESET}\n`);
    process.exit(1);
  }

  console.log(`${GREEN}✓ Pre-commit security check: No sensitive files or secrets detected.${RESET}`);
  process.exit(0);
}

checkSecurity();
