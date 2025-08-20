#!/usr/bin/env node

/**
 * Internal Version Creator for Pritzio Backend
 * Creates internal development versions without affecting release version
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class InternalVersionCreator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.devFolder = path.join(this.projectRoot, '.dev');
    this.versionControlFolder = path.join(this.devFolder, 'version-control');
    this.versionFile = path.join(this.versionControlFolder, 'VERSION.md');
    this.internalVersionFile = path.join(this.versionControlFolder, 'INTERNAL_VERSION.md');
    this.internalChangelogFile = path.join(this.versionControlFolder, 'INTERNAL_CHANGELOG.md');
    this.dailyLogFile = path.join(this.versionControlFolder, 'DAILY_LOG.md');
    
    this.currentReleaseVersion = this.getCurrentReleaseVersion();
    this.currentInternalVersion = this.getCurrentInternalVersion();
  }

  /**
   * Get current release version from VERSION.md
   */
  getCurrentReleaseVersion() {
    try {
      const content = fs.readFileSync(this.versionFile, 'utf8');
      const match = content.match(/\*\*Current Version:\*\* `([^`]+)`/);
      return match ? match[1] : '0.0.1';
    } catch (error) {
      console.error('Error reading version file:', error.message);
      return '0.0.1';
    }
  }

  /**
   * Get current internal version
   */
  getCurrentInternalVersion() {
    try {
      if (fs.existsSync(this.internalVersionFile)) {
        const content = fs.readFileSync(this.internalVersionFile, 'utf8');
        const match = content.match(/\*\*Current Internal Version:\*\* `([^`]+)`/);
        return match ? match[1] : `${this.currentReleaseVersion}-dev.0`;
      }
      return `${this.currentReleaseVersion}-dev.0`;
    } catch (error) {
      return `${this.currentReleaseVersion}-dev.0`;
    }
  }

  /**
   * Calculate next internal version
   */
  calculateNextInternalVersion() {
    const currentInternal = this.currentInternalVersion;
    
    if (currentInternal.includes('-dev.')) {
      const parts = currentInternal.split('-dev.');
      const baseVersion = parts[0];
      const internalNumber = parseInt(parts[1]) || 0;
      return `${baseVersion}-dev.${internalNumber + 1}`;
    } else {
      return `${this.currentReleaseVersion}-dev.1`;
    }
  }

  /**
   * Analyze changes since last internal version
   */
  analyzeChanges() {
    try {
      // Get changes since last internal version
      let changes;
      try {
        changes = execSync(`git diff --name-status ${this.currentInternalVersion}..HEAD`, { encoding: 'utf8' });
      } catch {
        // If no tag found, get changes since last commit
        changes = execSync('git diff --name-status HEAD~1..HEAD', { encoding: 'utf8' });
      }
      
      return this.parseChanges(changes);
    } catch (error) {
      console.error('Error analyzing changes:', error.message);
      return { added: [], changed: [], fixed: [], removed: [] };
    }
  }

  /**
   * Parse git changes output
   */
  parseChanges(changes) {
    const result = {
      added: [],
      changed: [],
      fixed: [],
      removed: []
    };

    const lines = changes.trim().split('\n');
    
    lines.forEach(line => {
      if (!line) return;
      
      const [status, file] = line.split('\t');
      if (!file) return;

      // Skip certain files
      if (this.shouldSkipFile(file)) return;

      this.categorizeChange(status, file, result);
    });

    return result;
  }

  /**
   * Determine if file should be skipped
   */
  shouldSkipFile(file) {
    const skipPatterns = [
      /^\.dev\//,
      /^node_modules\//,
      /^dist\//,
      /^coverage\//,
      /\.log$/,
      /\.tmp$/,
      /\.env/
    ];

    return skipPatterns.some(pattern => pattern.test(file));
  }

  /**
   * Categorize change based on status and file
   */
  categorizeChange(status, file, result) {
    const fileType = this.getFileType(file);
    
    switch (status) {
      case 'A': // Added
        result.added.push(`${fileType}: ${file}`);
        break;
      case 'M': // Modified
        result.changed.push(`${fileType}: ${file}`);
        break;
      case 'D': // Deleted
        result.removed.push(`${fileType}: ${file}`);
        break;
      case 'R': // Renamed
        result.changed.push(`${fileType}: ${file} (renamed)`);
        break;
    }
  }

  /**
   * Get file type for categorization
   */
  getFileType(file) {
    if (file.includes('src/')) return 'Source Code';
    if (file.includes('test/')) return 'Test';
    if (file.includes('docs/')) return 'Documentation';
    if (file.includes('scripts/')) return 'Script';
    if (file.includes('docker/')) return 'Docker';
    if (file.includes('package.json') || file.includes('package-lock.json')) return 'Dependencies';
    if (file.includes('.md')) return 'Documentation';
    if (file.includes('.ts') || file.includes('.js')) return 'Code';
    return 'File';
  }

  /**
   * Create or update INTERNAL_VERSION.md
   */
  createInternalVersionFile() {
    const nextInternalVersion = this.calculateNextInternalVersion();
    const today = new Date().toISOString().split('T')[0];
    
    const content = `# Internal Version - Pritzio Backend

## 🏷️ Internal Version Information

**Current Internal Version:** \`${nextInternalVersion}\`  
**Base Release Version:** \`${this.currentReleaseVersion}\`  
**Created Date:** ${today}  
**Status:** In Development  

## 📋 Version Details

### Version Number
- **Base Version:** ${this.currentReleaseVersion}
- **Internal Number:** ${nextInternalVersion.split('-dev.')[1]}
- **Full Internal Version:** ${nextInternalVersion}

### Development Phase
- **Phase:** Internal Development
- **Purpose:** Track development progress
- **Visibility:** Development team only
- **Release Status:** Not ready for production

## 🎯 Development Goals

### Current Focus
- [ ] Continue development of planned features
- [ ] Maintain code quality and testing
- [ ] Prepare for next release

### Next Milestone
- [ ] Complete current development phase
- [ ] Run comprehensive testing
- [ ] Prepare for release ${this.currentReleaseVersion}

## 📊 Progress Tracking

### Changes Since Last Internal Version
- **Added:** ${this.analyzeChanges().added.length} items
- **Modified:** ${this.analyzeChanges().changed.length} items
- **Fixed:** ${this.analyzeChanges().fixed.length} items
- **Removed:** ${this.analyzeChanges().removed.length} items

## 🔄 Version Flow

### Internal Version Chain
\`\`\`
${this.currentReleaseVersion} (Release)
├── ${this.currentReleaseVersion}-dev.1
├── ${this.currentReleaseVersion}-dev.2
└── ${nextInternalVersion} ← Current
\`\`\`

### Next Steps
1. **Continue Development** with current internal version
2. **Create Next Internal Version** when significant changes are made
3. **Prepare for Release** when features are complete and stable

## 📝 Notes

- **Internal versions** are for development tracking only
- **Package.json** maintains the release version
- **Git tags** are created for each internal version
- **Documentation** is updated for internal tracking

---

**Last Updated:** ${today}  
**Next Review:** ${this.getNextReviewDate()}  
**Maintainer:** Development Team`;

    fs.writeFileSync(this.internalVersionFile, content);
    console.log(`✅ Created INTERNAL_VERSION.md for version ${nextInternalVersion}`);
  }

  /**
   * Update INTERNAL_CHANGELOG.md
   */
  updateInternalChangelog() {
    const nextInternalVersion = this.calculateNextInternalVersion();
    const today = new Date().toISOString().split('T')[0];
    const changes = this.analyzeChanges();
    
    let content = '';
    
    // Create file if it doesn't exist
    if (!fs.existsSync(this.internalChangelogFile)) {
      content = `# Internal Changelog - Pritzio Backend

This file tracks internal development versions and changes.

## [${nextInternalVersion}] - ${today}

`;
    } else {
      content = fs.readFileSync(this.internalChangelogFile, 'utf8');
      
      // Add new entry at the beginning
      const newEntry = `## [${nextInternalVersion}] - ${today}

`;
      content = newEntry + content;
    }

    // Add change details
    if (changes.added.length > 0) {
      content += '### Added\n';
      changes.added.forEach(item => {
        content += `- ${item}\n`;
      });
      content += '\n';
    }
    
    if (changes.changed.length > 0) {
      content += '### Changed\n';
      changes.changed.forEach(item => {
        content += `- ${item}\n`;
      });
      content += '\n';
    }
    
    if (changes.fixed.length > 0) {
      content += '### Fixed\n';
      changes.fixed.forEach(item => {
        content += `- ${item}\n`;
      });
      content += '\n';
    }
    
    if (changes.removed.length > 0) {
      content += '### Removed\n';
      changes.removed.forEach(item => {
        content += `- ${item}\n`;
      });
      content += '\n';
    }

    // Remove trailing newlines
    content = content.trim();
    
    fs.writeFileSync(this.internalChangelogFile, content);
    console.log(`✅ Updated INTERNAL_CHANGELOG.md for version ${nextInternalVersion}`);
  }

  /**
   * Update DAILY_LOG.md
   */
  updateDailyLog() {
    const nextInternalVersion = this.calculateNextInternalVersion();
    const today = new Date().toISOString().split('T')[0];
    const changes = this.analyzeChanges();
    
    let content = fs.readFileSync(this.dailyLogFile, 'utf8');
    
    const newEntry = `## 📅 ${today} - Internal Version ${nextInternalVersion}

### 🎯 **Daily Goals**
- [x] Create internal version ${nextInternalVersion}
- [x] Track development progress
- [x] Update internal documentation

### ✅ **Completed Tasks**

#### Internal Version Creation
- Created internal version ${nextInternalVersion}
- Updated INTERNAL_VERSION.md
- Updated INTERNAL_CHANGELOG.md
- Updated daily development log

#### Changes Summary
- **Added:** ${changes.added.length} items
- **Modified:** ${changes.changed.length} items
- **Fixed:** ${changes.fixed.length} items
- **Removed:** ${changes.removed.length} items

### 🔄 **In Progress**
- Development of planned features
- Code quality improvements
- Testing and validation

### 📋 **Next Steps**
1. **Continue Development**
   - Implement planned features
   - Maintain code quality
   - Add comprehensive tests

2. **Next Internal Version**
   - Create when significant changes are made
   - Track progress granularly
   - Prepare for release

### 💡 **Key Decisions Made**

#### Internal Version Strategy
- **Previous Internal Version**: ${this.currentInternalVersion}
- **New Internal Version**: ${nextInternalVersion}
- **Base Release Version**: ${this.currentReleaseVersion}
- **Purpose**: Development tracking and progress monitoring

### 🐛 **Issues Encountered**
- None

### 🔧 **Technical Notes**

#### Internal Version System
- Internal versions track development progress
- Package.json maintains release version
- Git tags created for internal versions
- Documentation updated for internal tracking

### 📊 **Progress Metrics**

#### Version Status
- **Release Version**: ${this.currentReleaseVersion}
- **Internal Version**: ${nextInternalVersion} ✅
- **Development Phase**: Active
- **Release Readiness**: In Progress

### 🎉 **Achievements**
- Successfully created internal version ${nextInternalVersion}
- Maintained development tracking
- Updated all internal documentation
- Prepared for continued development

### 📚 **Resources Updated**
- INTERNAL_VERSION.md - Current internal version
- INTERNAL_CHANGELOG.md - Internal version history
- DAILY_LOG.md - This entry

### 🔮 **Tomorrow's Goals**
- [ ] Continue development for planned features
- [ ] Maintain code quality standards
- [ ] Prepare for next internal version or release

---

**Log Entry By**: Internal Version System  
**Date**: ${today}  
**Next Review**: ${this.getNextReviewDate()}  
**Status**: ✅ Internal Version Created`;

    // Insert at the beginning
    content = newEntry + '\n\n' + content;
    
    fs.writeFileSync(this.dailyLogFile, content);
    console.log(`✅ Updated DAILY_LOG.md for internal version ${nextInternalVersion}`);
  }

  /**
   * Get next review date (1 week from now)
   */
  getNextReviewDate() {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  }

  /**
   * Create git tag for internal version
   */
  createGitTag() {
    try {
      const nextInternalVersion = this.calculateNextInternalVersion();
      const tagMessage = `Internal development version ${nextInternalVersion}`;
      
      execSync(`git add .`, { cwd: this.projectRoot });
      execSync(`git commit -m "chore: create internal version ${nextInternalVersion}"`, { cwd: this.projectRoot });
      execSync(`git tag -a v${nextInternalVersion} -m "${tagMessage}"`, { cwd: this.projectRoot });
      
      console.log(`✅ Created git tag v${nextInternalVersion}`);
    } catch (error) {
      console.error('❌ Error creating git tag:', error.message);
      console.log('⚠️  Please create git tag manually:');
      console.log(`   git tag -a v${this.calculateNextInternalVersion()} -m "Internal development version ${this.calculateNextInternalVersion()}"`);
    }
  }

  /**
   * Run the internal version creation
   */
  run() {
    const nextInternalVersion = this.calculateNextInternalVersion();
    
    console.log('🔧 Creating internal development version...');
    console.log(`📋 Current release version: ${this.currentReleaseVersion}`);
    console.log(`📋 Current internal version: ${this.currentInternalVersion}`);
    console.log(`🎯 New internal version: ${nextInternalVersion}`);
    
    // Create internal version files
    this.createInternalVersionFile();
    this.updateInternalChangelog();
    this.updateDailyLog();
    
    // Create git tag
    this.createGitTag();
    
    console.log('\n🎉 Internal version creation complete!');
    console.log(`📋 New internal version: ${nextInternalVersion}`);
    console.log('📝 Internal documentation has been updated');
    console.log('🏷️  Git tag has been created');
    console.log('\n💡 Next steps:');
    console.log('   1. Continue development with current internal version');
    console.log('   2. Create next internal version when significant changes are made');
    console.log('   3. Prepare for release when features are complete');
    
    return nextInternalVersion;
  }
}

// Run if called directly
if (require.main === module) {
  const creator = new InternalVersionCreator();
  creator.run();
}

module.exports = InternalVersionCreator;
