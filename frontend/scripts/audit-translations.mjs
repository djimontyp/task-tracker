#!/usr/bin/env node

/**
 * Translation Audit Script
 *
 * Checks translation files for:
 * 1. Missing keys between uk and en
 * 2. Placeholder values (TODO, TBD, ...)
 * 3. Ukrainian pluralization correctness
 * 4. Empty values
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.resolve(__dirname, '../public/locales');
const LANGUAGES = ['uk', 'en'];
const PLACEHOLDER_PATTERNS = [
  /TODO/i,
  /TBD/i,
  /\.\.\./,
  /xxx/i,
  /fixme/i,
  /placeholder/i
];

const REQUIRED_UK_PLURAL_SUFFIXES = ['_one', '_few', '_many'];
const REQUIRED_EN_PLURAL_SUFFIXES = ['_one', '_other'];

class TranslationAuditor {
  constructor() {
    this.issues = [];
    this.stats = {
      totalFiles: 0,
      totalKeys: { uk: 0, en: 0 },
      missingKeys: 0,
      placeholders: 0,
      emptyValues: 0,
      pluralIssues: 0
    };
  }

  /**
   * Load JSON file
   */
  loadJSON(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      this.addIssue('error', `Failed to load ${filePath}: ${error.message}`);
      return null;
    }
  }

  /**
   * Get all translation file names
   */
  getTranslationFiles(lang) {
    const langDir = path.join(LOCALES_DIR, lang);
    if (!fs.existsSync(langDir)) {
      return [];
    }
    return fs.readdirSync(langDir).filter(f => f.endsWith('.json'));
  }

  /**
   * Flatten nested object to dot notation keys
   */
  flattenKeys(obj, prefix = '') {
    let keys = [];
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        keys = keys.concat(this.flattenKeys(value, fullKey));
      } else {
        keys.push({ key: fullKey, value });
      }
    }
    return keys;
  }

  /**
   * Add issue to report
   */
  addIssue(level, message, file = null) {
    this.issues.push({ level, file, message });
  }

  /**
   * Check for placeholder values
   */
  checkPlaceholders(file, lang, entries) {
    const placeholders = [];

    for (const { key, value } of entries) {
      if (typeof value !== 'string') continue;

      for (const pattern of PLACEHOLDER_PATTERNS) {
        if (pattern.test(value)) {
          placeholders.push({ key, value, pattern: pattern.source });
          this.stats.placeholders++;
        }
      }
    }

    if (placeholders.length > 0) {
      this.addIssue(
        'warning',
        `Found ${placeholders.length} placeholder values:\n` +
        placeholders.map(p => `  - ${p.key}: "${p.value}"`).join('\n'),
        `${lang}/${file}`
      );
    }
  }

  /**
   * Check for empty values
   */
  checkEmptyValues(file, lang, entries) {
    const empty = entries.filter(({ value }) =>
      typeof value === 'string' && value.trim() === ''
    );

    if (empty.length > 0) {
      this.stats.emptyValues += empty.length;
      this.addIssue(
        'error',
        `Found ${empty.length} empty values:\n` +
        empty.map(e => `  - ${e.key}`).join('\n'),
        `${lang}/${file}`
      );
    }
  }

  /**
   * Check Ukrainian pluralization
   */
  checkUkrainianPlurals(file, data) {
    const pluralsSection = data.plurals;
    if (!pluralsSection) return;

    const keys = Object.keys(pluralsSection);
    const pluralGroups = {};

    // Group plural keys by base name
    for (const key of keys) {
      const match = key.match(/^(.+?)_(one|few|many)$/);
      if (match) {
        const [, base, form] = match;
        if (!pluralGroups[base]) pluralGroups[base] = new Set();
        pluralGroups[base].add(form);
      }
    }

    // Check each group has all required forms
    for (const [base, forms] of Object.entries(pluralGroups)) {
      const missing = REQUIRED_UK_PLURAL_SUFFIXES
        .map(s => s.replace('_', ''))
        .filter(form => !forms.has(form));

      if (missing.length > 0) {
        this.stats.pluralIssues++;
        this.addIssue(
          'error',
          `Plural "${base}" missing forms: ${missing.join(', ')}`,
          `uk/${file}`
        );
      }
    }
  }

  /**
   * Check English pluralization
   */
  checkEnglishPlurals(file, data) {
    const pluralsSection = data.plurals;
    if (!pluralsSection) return;

    const keys = Object.keys(pluralsSection);
    const pluralGroups = {};

    // Group plural keys by base name
    for (const key of keys) {
      const match = key.match(/^(.+?)_(one|other)$/);
      if (match) {
        const [, base, form] = match;
        if (!pluralGroups[base]) pluralGroups[base] = new Set();
        pluralGroups[base].add(form);
      }
    }

    // Check each group has all required forms
    for (const [base, forms] of Object.entries(pluralGroups)) {
      const missing = REQUIRED_EN_PLURAL_SUFFIXES
        .map(s => s.replace('_', ''))
        .filter(form => !forms.has(form));

      if (missing.length > 0) {
        this.stats.pluralIssues++;
        this.addIssue(
          'error',
          `Plural "${base}" missing forms: ${missing.join(', ')}`,
          `en/${file}`
        );
      }
    }
  }

  /**
   * Compare keys between languages
   */
  compareKeys(file, ukEntries, enEntries) {
    const ukKeys = new Set(ukEntries.map(e => e.key));
    const enKeys = new Set(enEntries.map(e => e.key));

    const missingInEn = [...ukKeys].filter(k => !enKeys.has(k));
    const missingInUk = [...enKeys].filter(k => !ukKeys.has(k));

    if (missingInEn.length > 0) {
      this.stats.missingKeys += missingInEn.length;
      this.addIssue(
        'error',
        `Missing ${missingInEn.length} keys in EN:\n` +
        missingInEn.map(k => `  - ${k}`).join('\n'),
        `en/${file}`
      );
    }

    if (missingInUk.length > 0) {
      this.stats.missingKeys += missingInUk.length;
      this.addIssue(
        'error',
        `Missing ${missingInUk.length} keys in UK:\n` +
        missingInUk.map(k => `  - ${k}`).join('\n'),
        `uk/${file}`
      );
    }
  }

  /**
   * Audit a single file pair
   */
  auditFile(file) {
    const ukPath = path.join(LOCALES_DIR, 'uk', file);
    const enPath = path.join(LOCALES_DIR, 'en', file);

    const ukData = this.loadJSON(ukPath);
    const enData = this.loadJSON(enPath);

    if (!ukData || !enData) return;

    const ukEntries = this.flattenKeys(ukData);
    const enEntries = this.flattenKeys(enData);

    this.stats.totalKeys.uk += ukEntries.length;
    this.stats.totalKeys.en += enEntries.length;

    // Check for missing keys
    this.compareKeys(file, ukEntries, enEntries);

    // Check for placeholders
    this.checkPlaceholders(file, 'uk', ukEntries);
    this.checkPlaceholders(file, 'en', enEntries);

    // Check for empty values
    this.checkEmptyValues(file, 'uk', ukEntries);
    this.checkEmptyValues(file, 'en', enEntries);

    // Check pluralization
    this.checkUkrainianPlurals(file, ukData);
    this.checkEnglishPlurals(file, enData);
  }

  /**
   * Run full audit
   */
  run() {
    console.log('🔍 Starting translation audit...\n');

    const ukFiles = this.getTranslationFiles('uk');
    const enFiles = this.getTranslationFiles('en');

    // Check for file discrepancies
    const allFiles = new Set([...ukFiles, ...enFiles]);
    const missingInEn = ukFiles.filter(f => !enFiles.includes(f));
    const missingInUk = enFiles.filter(f => !ukFiles.includes(f));

    if (missingInEn.length > 0) {
      this.addIssue(
        'error',
        `Files missing in EN: ${missingInEn.join(', ')}`
      );
    }

    if (missingInUk.length > 0) {
      this.addIssue(
        'error',
        `Files missing in UK: ${missingInUk.join(', ')}`
      );
    }

    // Audit each file
    for (const file of allFiles) {
      if (ukFiles.includes(file) && enFiles.includes(file)) {
        this.auditFile(file);
        this.stats.totalFiles++;
      }
    }

    this.printReport();
  }

  /**
   * Print audit report
   */
  printReport() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 TRANSLATION AUDIT REPORT');
    console.log('═══════════════════════════════════════════════════════\n');

    // Statistics
    console.log('📈 STATISTICS:');
    console.log(`   Files audited: ${this.stats.totalFiles}`);
    console.log(`   Total keys (UK): ${this.stats.totalKeys.uk}`);
    console.log(`   Total keys (EN): ${this.stats.totalKeys.en}`);
    console.log('');

    // Issues summary
    const errors = this.issues.filter(i => i.level === 'error').length;
    const warnings = this.issues.filter(i => i.level === 'warning').length;

    console.log('🚨 ISSUES SUMMARY:');
    console.log(`   Errors: ${errors}`);
    console.log(`   Warnings: ${warnings}`);
    console.log(`   - Missing keys: ${this.stats.missingKeys}`);
    console.log(`   - Placeholder values: ${this.stats.placeholders}`);
    console.log(`   - Empty values: ${this.stats.emptyValues}`);
    console.log(`   - Pluralization issues: ${this.stats.pluralIssues}`);
    console.log('');

    // Detailed issues
    if (this.issues.length > 0) {
      console.log('📋 DETAILED ISSUES:\n');

      const errorIssues = this.issues.filter(i => i.level === 'error');
      const warningIssues = this.issues.filter(i => i.level === 'warning');

      if (errorIssues.length > 0) {
        console.log('❌ ERRORS:');
        for (const issue of errorIssues) {
          if (issue.file) {
            console.log(`\n   📄 ${issue.file}`);
          }
          console.log(`   ${issue.message}`);
        }
        console.log('');
      }

      if (warningIssues.length > 0) {
        console.log('⚠️  WARNINGS:');
        for (const issue of warningIssues) {
          if (issue.file) {
            console.log(`\n   📄 ${issue.file}`);
          }
          console.log(`   ${issue.message}`);
        }
        console.log('');
      }
    } else {
      console.log('✅ NO ISSUES FOUND!\n');
    }

    console.log('═══════════════════════════════════════════════════════');

    // Exit with error code if issues found
    if (errors > 0) {
      console.log('\n❌ Audit failed with errors\n');
      process.exit(1);
    } else if (warnings > 0) {
      console.log('\n⚠️  Audit completed with warnings\n');
      process.exit(0);
    } else {
      console.log('\n✅ Audit passed successfully\n');
      process.exit(0);
    }
  }
}

// Run audit
const auditor = new TranslationAuditor();
auditor.run();
