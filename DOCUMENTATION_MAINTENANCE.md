# Documentation Maintenance Process

**Last Updated:** October 26, 2025
**Status:** Active
**Audience:** Project Maintainers

## When to Update Documentation

Use this checklist to determine if documentation needs updating:

### Backend Changes Trigger Updates

- [ ] New API endpoint added → Update `docs/content/en/api/automation.md`
- [ ] Existing endpoint modified → Update request/response examples
- [ ] Error codes changed → Update error reference table
- [ ] Database schema changed → Update admin guides
- [ ] Configuration options added → Update Configuration Reference
- [ ] New environment variables → Update deployment docs

### Frontend Changes Trigger Updates

- [ ] New dashboard page created → Add screenshots + update guide
- [ ] UI redesigned → Update all related screenshots
- [ ] New user workflow → Add to Best Practices or Quickstart
- [ ] Button/menu renamed → Update Quickstart Guide
- [ ] New feature released → Update Quickstart + add feature guide

### Behavioral Changes Trigger Updates

- [ ] Bug fix changes user experience → Update Troubleshooting Guide
- [ ] Performance improvement → Update Performance & Scaling guide
- [ ] New error case → Add to Troubleshooting error reference
- [ ] Default behavior changes → Update Configuration Reference
- [ ] Approval logic modified → Update Architecture docs

## Review Checklist

Before committing documentation changes:

```markdown
Documentation Update Checklist:
- [ ] OpenAPI spec updated (if API changed)
- [ ] User guide updated (if UX changed)
- [ ] Screenshots refreshed (if UI changed)
- [ ] Code examples tested (copy-paste works?)
- [ ] Troubleshooting guide updated (if errors changed)
- [ ] Bilingual consistency (EN ↔ UK verified)
- [ ] Links validated (no broken references)
- [ ] Table of contents synced (mkdocs.yml updated)
- [ ] Grammar/spelling checked
- [ ] Technical accuracy verified

Commit message:
docs(automation): update [section] for [feature/fix]

Example:
docs(automation): update configuration reference for new topic-specific rules
```

## Auto-Sync Scripts

### Script 1: Table of Contents Sync

**Purpose:** Auto-generate mkdocs.yml navigation from directory structure
**Location:** `scripts/sync_docs_toc.py`
**Run:** `uv run python scripts/sync_docs_toc.py`

```python
#!/usr/bin/env python3
"""
Sync mkdocs.yml nav with docs/content/ directory structure.
"""

import os
import yaml
from pathlib import Path

def scan_docs_dir(base_path: str = "docs/content/en") -> dict:
    """Scan docs directory and build nav structure."""
    nav = {}

    for root, dirs, files in os.walk(base_path):
        # Build section name from directory
        rel_path = os.path.relpath(root, base_path)
        section = rel_path.replace("/", " ").replace("-", " ").title()

        # Add markdown files to section
        for file in sorted(files):
            if file.endswith(".md") and file != "README.md":
                page_name = file.replace(".md", "").replace("-", " ").title()
                page_path = os.path.join(rel_path, file).replace("\\", "/")

                if section not in nav:
                    nav[section] = []

                nav[section].append({page_name: page_path})

    return nav

if __name__ == "__main__":
    print("Syncing mkdocs.yml navigation from docs/content/")

    # Read current mkdocs.yml
    with open("docs/mkdocs.yml", "r") as f:
        config = yaml.safe_load(f)

    # Generate nav
    new_nav = scan_docs_dir("docs/content/en")

    # Update config
    config["nav"] = new_nav

    # Write back
    with open("docs/mkdocs.yml", "w") as f:
        yaml.dump(config, f)

    print(f"✓ Updated {len(new_nav)} sections")
```

### Script 2: Link Validator

**Purpose:** Check all markdown links, report 404s
**Location:** `scripts/validate_docs_links.py`
**Run:** `uv run python scripts/validate_docs_links.py`

```python
#!/usr/bin/env python3
"""
Validate all links in documentation.
"""

import os
import re
from pathlib import Path
from urllib.parse import urlparse

def find_broken_links(docs_dir: str = "docs/content/en") -> list[str]:
    """Find broken markdown links."""
    errors = []

    for root, dirs, files in os.walk(docs_dir):
        for file in files:
            if file.endswith(".md"):
                filepath = os.path.join(root, file)

                with open(filepath, "r") as f:
                    content = f.read()
                    line_num = 0

                    for line in content.split("\n"):
                        line_num += 1
                        # Find markdown links: [text](url)
                        links = re.findall(r"\[([^\]]+)\]\(([^)]+)\)", line)

                        for text, url in links:
                            # Skip external links
                            if url.startswith("http"):
                                continue

                            # Check relative links
                            full_path = os.path.join(root, url.split("#")[0])
                            if not os.path.exists(full_path):
                                errors.append(
                                    f"{filepath}:{line_num} - "
                                    f"Broken link: {url}"
                                )

    return errors

if __name__ == "__main__":
    print("Validating documentation links...")

    broken = find_broken_links()

    if broken:
        print(f"✗ Found {len(broken)} broken links:\n")
        for error in broken:
            print(f"  {error}")
        exit(1)
    else:
        print("✓ All links valid")
```

### Script 3: Screenshot Update Checker

**Purpose:** Compare screenshot timestamps with code changes
**Location:** `scripts/check_outdated_screenshots.py`
**Run:** `uv run python scripts/check_outdated_screenshots.py`

```python
#!/usr/bin/env python3
"""
Check if screenshots are outdated compared to code changes.
"""

import os
from datetime import datetime
from pathlib import Path

def check_screenshot_freshness(
    screenshots_dir: str = "docs/content/en/features/screenshots",
    code_dir: str = "frontend/src"
) -> list[str]:
    """Compare screenshot mod times with code mod times."""
    warnings = []

    for screenshot in os.listdir(screenshots_dir):
        if not screenshot.endswith(".png"):
            continue

        screenshot_path = os.path.join(screenshots_dir, screenshot)
        screenshot_mtime = os.path.getmtime(screenshot_path)
        screenshot_date = datetime.fromtimestamp(screenshot_mtime)

        # Find corresponding component (rough heuristic)
        component_name = screenshot.split("-")[0]  # e.g., "auto-approval.png" -> "auto-approval"

        # Check if code changed since screenshot
        for root, dirs, files in os.walk(code_dir):
            for file in files:
                if component_name in file and file.endswith(".tsx"):
                    file_path = os.path.join(root, file)
                    file_mtime = os.path.getmtime(file_path)
                    file_date = datetime.fromtimestamp(file_mtime)

                    # If code changed after screenshot, warn
                    if file_date > screenshot_date:
                        warnings.append(
                            f"⚠️  {screenshot} might be outdated "
                            f"(code changed {file_date}, screenshot from {screenshot_date})"
                        )

    return warnings

if __name__ == "__main__":
    print("Checking screenshot freshness...")

    warnings = check_screenshot_freshness()

    if warnings:
        print(f"Found {len(warnings)} potentially outdated screenshots:\n")
        for warning in warnings:
            print(f"  {warning}")
    else:
        print("✓ All screenshots appear up-to-date")
```

## CI/CD Integration

### GitHub Actions Workflow

**File:** `.github/workflows/docs-validation.yml`

```yaml
name: Documentation Validation

on:
  pull_request:
    paths:
      - 'docs/**'
      - '.github/workflows/docs-validation.yml'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.13'

      - name: Install uv
        run: pip install uv

      - name: Install dependencies
        run: uv sync --all-groups

      - name: Validate links
        run: uv run python scripts/validate_docs_links.py

      - name: Check outdated screenshots
        run: uv run python scripts/check_outdated_screenshots.py

      - name: Build docs
        run: uv run mkdocs build --config-file docs/mkdocs.yml

      - name: Upload build artifacts
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: docs-build
          path: docs/site/
```

## Screenshot Guidelines

### Quality Standards

**Resolution:** 1920x1080 (full screen) or 1280x720 (component)
**Format:** PNG (lossless)
**File size:** <500 KB per screenshot
**Aspect ratio:** 16:9 preferred

### Naming Convention

```
{page}-{section}-{version}.png

Examples:
- automation-quickstart-step1.png
- automation-rules-preview-v2.png
- automation-dashboard-stats.png
```

### Storage Location

```
docs/content/en/features/screenshots/
├── automation-quickstart-step1.png
├── automation-quickstart-step2.png
├── automation-rules-preview.png
└── automation-dashboard-stats.png
```

### Annotation Guidelines

- Use red boxes or arrows to highlight important UI elements
- Add text overlays for explanations (if needed)
- Light theme preferred (better contrast)
- Remove sensitive data (emails, tokens, etc.)

## Bilingual Workflow

### Translation Process

1. **Write in English first** (authoritative version)
2. **Translate to Ukrainian** (use glossary for consistency)
3. **Review both versions** for terminology alignment

### Shared Glossary

**File:** `docs/GLOSSARY.md`

```markdown
# Documentation Glossary

| English | Ukrainian | Context |
|---------|-----------|---------|
| Automation | Автоматизація | Feature name |
| Rule | Правило | Approval rule |
| Schedule | Розклад | Cron schedule |
| Threshold | Поріг | Approval threshold |
| Version | Версія | Content version |
| Pending | Очікування | Status: not reviewed |
| Auto-approve | Авто-затвердити | Action: auto-approve |
| Confidence | Впевненість | AI confidence score |
| Similarity | Схожість | Vector similarity |
```

### Translation Tools

- **Primary:** Use professional translator or bilingual team member
- **Validation:** Use Grammarly for grammar checking
- **Consistency:** Check glossary before translating technical terms

## Maintenance Schedule

### Weekly (Every Monday)

- [ ] Review recent code changes
- [ ] Identify docs needing updates
- [ ] Add to backlog if needed

### Monthly (First Friday)

- [ ] Full audit of user guides
- [ ] Check all external links
- [ ] Review and update metrics/examples
- [ ] Run documentation validation scripts

### Quarterly (End of quarter)

- [ ] Major documentation review
- [ ] Update architecture diagrams
- [ ] Refresh all screenshots
- [ ] Audit API documentation
- [ ] Plan Q1 improvements

### Annually (January 1)

- [ ] Update "Last Updated" dates
- [ ] Deprecate outdated sections
- [ ] Archive old versions
- [ ] Plan major documentation refactor

## Version Control Best Practices

### Branch Naming

```
docs/update-configuration-reference
docs/add-troubleshooting-guide
docs/refresh-screenshots
```

### Commit Messages

```
docs(automation): update configuration reference for new topic-specific rules
docs(guides): add troubleshooting section for high false positive rate
docs(screenshots): refresh automation dashboard screenshots
```

### Pull Request Template

```markdown
## Documentation Changes

### What changed?
- [ ] User guides updated
- [ ] Admin guides updated
- [ ] API documentation updated
- [ ] Screenshots updated
- [ ] Configuration examples updated

### Testing
- [ ] Links validated
- [ ] All examples tested
- [ ] Bilingual consistency checked

### Related Issue
Closes #123

### Additional Notes
Any special context or notes for reviewers
```

## Common Documentation Issues

| Issue | Prevention | Fix |
|-------|-----------|-----|
| Broken links | Run link validator before commit | Update links, retest |
| Outdated screenshots | Tag code changes, check timestamps | Refresh screenshots |
| Inconsistent terminology | Use glossary | Replace all instances |
| Bilingual mismatch | Use translation template | Retranslate section |
| Missing examples | Test all code snippets | Add working example |
| Incorrect API docs | Auto-generate from OpenAPI | Regenerate spec |

## Related Documents

- [Configuration Reference](docs/content/en/guides/automation-configuration.md)
- [Best Practices Guide](docs/content/en/guides/automation-best-practices.md)
- [API Reference](docs/content/en/api/automation.md)

---

**Maintained by:** Project Team
**Last Review:** October 26, 2025
**Next Review:** January 26, 2026
