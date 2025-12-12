#!/usr/bin/env npx tsx
/**
 * Story Coverage Check Script
 *
 * Ensures that components in shared/ directories have corresponding story files.
 *
 * Usage:
 *   npx tsx scripts/check-story-coverage.ts                    # Check all
 *   npx tsx scripts/check-story-coverage.ts --staged-only      # Only staged files
 *   npx tsx scripts/check-story-coverage.ts --fix              # Show fix suggestions
 *
 * Exit codes:
 *   0 - All components have stories
 *   1 - Missing stories found
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Configuration
const SRC_DIR = path.join(__dirname, '..', 'src');

// Directories that require stories
const REQUIRED_STORY_DIRS = [
  'shared/ui',
  'shared/patterns',
  'shared/components',
];

// Files to ignore (not components or handled differently)
const IGNORE_PATTERNS = [
  /index\.tsx?$/,           // Re-export files
  /\.stories\.tsx?$/,       // Story files themselves
  /\.test\.tsx?$/,          // Test files
  /\.spec\.tsx?$/,          // Spec files
  /types\.tsx?$/,           // Type definition files
  /utils\.tsx?$/,           // Utility files
  /hooks\.tsx?$/,           // Hook files (not visual)
  /context\.tsx?$/,         // Context files
  /provider\.tsx?$/i,       // Provider files
  /README\.md$/,            // Documentation
];

// Minimum LOC to require story (for features/)
const MIN_LOC_FOR_FEATURE_STORY = 50;

interface MissingStory {
  component: string;
  expectedStory: string;
  directory: string;
  tier: 1 | 2 | 3;
}

function isComponentFile(filePath: string): boolean {
  // Check if file is a component (not in ignore list)
  const fileName = path.basename(filePath);
  return (
    (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) &&
    !IGNORE_PATTERNS.some((pattern) => pattern.test(fileName))
  );
}

function getStoryPath(componentPath: string): string {
  const ext = path.extname(componentPath);
  const baseName = path.basename(componentPath, ext);
  const dir = path.dirname(componentPath);
  return path.join(dir, `${baseName}.stories${ext === '.ts' ? '.ts' : '.tsx'}`);
}

function storyExists(componentPath: string): boolean {
  const storyPath = getStoryPath(componentPath);
  return fs.existsSync(storyPath);
}

function getFilesInDir(dir: string): string[] {
  const files: string[] = [];

  function walk(currentDir: string) {
    if (!fs.existsSync(currentDir)) return;

    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (isComponentFile(fullPath)) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

function getStagedFiles(): string[] {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf-8',
      cwd: path.join(__dirname, '..', '..'),
    });
    return output
      .split('\n')
      .filter((f) => f.startsWith('frontend/src/'))
      .map((f) => path.join(__dirname, '..', '..', f));
  } catch {
    console.error('Error getting staged files');
    return [];
  }
}

function getTier(filePath: string): 1 | 2 | 3 {
  if (filePath.includes('shared/ui')) return 1;
  if (filePath.includes('shared/patterns')) return 2;
  if (filePath.includes('shared/components')) return 2;
  return 3;
}

function checkCoverage(stagedOnly: boolean): MissingStory[] {
  const missing: MissingStory[] = [];

  let filesToCheck: string[];

  if (stagedOnly) {
    // Only check staged files
    filesToCheck = getStagedFiles().filter(isComponentFile);

    // Filter to only required directories
    filesToCheck = filesToCheck.filter((f) =>
      REQUIRED_STORY_DIRS.some((dir) => f.includes(dir))
    );
  } else {
    // Check all files in required directories
    filesToCheck = [];
    for (const dir of REQUIRED_STORY_DIRS) {
      const fullDir = path.join(SRC_DIR, dir);
      filesToCheck.push(...getFilesInDir(fullDir));
    }
  }

  for (const file of filesToCheck) {
    if (!storyExists(file)) {
      const relativePath = path.relative(SRC_DIR, file);
      const tier = getTier(file);
      missing.push({
        component: relativePath,
        expectedStory: path.relative(SRC_DIR, getStoryPath(file)),
        directory: path.dirname(relativePath),
        tier,
      });
    }
  }

  return missing;
}

function printReport(missing: MissingStory[], showFix: boolean): void {
  if (missing.length === 0) {
    console.log('✅ All components have stories!');
    return;
  }

  console.log(`\n❌ Missing stories: ${missing.length}\n`);
  console.log('─'.repeat(60));

  // Group by tier
  const byTier = {
    1: missing.filter((m) => m.tier === 1),
    2: missing.filter((m) => m.tier === 2),
    3: missing.filter((m) => m.tier === 3),
  };

  if (byTier[1].length > 0) {
    console.log('\n📦 Tier 1 (shared/ui) - 4-6 stories required:');
    for (const m of byTier[1]) {
      console.log(`   • ${m.component}`);
      if (showFix) {
        console.log(`     → Create: ${m.expectedStory}`);
      }
    }
  }

  if (byTier[2].length > 0) {
    console.log('\n🎨 Tier 2 (shared/patterns, components) - 5-8 stories required:');
    for (const m of byTier[2]) {
      console.log(`   • ${m.component}`);
      if (showFix) {
        console.log(`     → Create: ${m.expectedStory}`);
      }
    }
  }

  if (byTier[3].length > 0) {
    console.log('\n🔧 Tier 3 (features) - 2-4 stories required:');
    for (const m of byTier[3]) {
      console.log(`   • ${m.component}`);
      if (showFix) {
        console.log(`     → Create: ${m.expectedStory}`);
      }
    }
  }

  console.log('\n─'.repeat(60));
  console.log('\n📖 See: .claude/skills/storybook/SKILL.md for templates\n');
}

// Main
const args = process.argv.slice(2);
const stagedOnly = args.includes('--staged-only');
const showFix = args.includes('--fix');

const missing = checkCoverage(stagedOnly);
printReport(missing, showFix);

// Exit with error if missing stories
if (missing.length > 0) {
  process.exit(1);
}
