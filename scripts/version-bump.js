#!/usr/bin/env node

/**
 * Version Bump Script for Pritzio Backend
 * Applies version changes based on analysis report
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class VersionBumper {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.devFolder = path.join(this.projectRoot, '.dev');
    this.versionControlFolder = path.join(this.devFolder, 'version-control');
    this.analysisReportFile = path.join(this.versionControlFolder, 'ANALYSIS_REPORT.json');
    this.versionFile = path.join(this.versionControlFolder, 'VERSION.md');
    this.changelogFile = path.join(this.versionControlFolder, 'CHANGELOG.md');
    this.dailyLogFile = path.join(this.versionControlFolder, 'DAILY_LOG.md');
    this.packageJsonFile = path.join(this.projectRoot, 'package.json');
    
    this.analysisReport = this.loadAnalysisReport();
  }

  /**
   * Load analysis report
   */
  loadAnalysisReport() {
    try {
      if (!fs.existsSync(this.analysisReportFile)) {
        console.error('❌ Analysis report not found. Run "npm run version:analyze" first.');
        process.exit(1);
      }
      
      const content = fs.readFileSync(this.analysisReportFile, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error('❌ Error loading analysis report:', error.message);
      process.exit(1);
    }
  }

  /**
   * Update package.json version
   */
  updatePackageJson() {
    try {
      const packageJson = JSON.parse(fs.readFileSync(this.packageJsonFile, 'utf8'));
      packageJson.version = this.analysisReport.suggestedVersion;
      
      fs.writeFileSync(this.packageJsonFile, JSON.stringify(packageJson, null, 2));
      console.log(`✅ Updated package.json to version ${this.analysisReport.suggestedVersion}`);
    } catch (error) {
      console.error('❌ Error updating package.json:', error.message);
    }
  }

  /**
   * Update VERSION.md
   */
  updateVersionFile() {
    try {
      let content = fs.readFileSync(this.versionFile, 'utf8');
      
      // Update current version
      content = content.replace(
        /\*\*Current Version:\*\* `[^`]+`/,
        `**Current Version:** \`${this.analysisReport.suggestedVersion}\``
      );
      
      // Update release date
      const today = new Date().toISOString().split('T')[0];
      content = content.replace(
        /\*\*Release Date:\*\* [0-9]{4}-[0-9]{2}-[0-9]{2}/,
        `**Release Date:** ${today}`
      );
      
      // Update next review date (1 week from now)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextReviewDate = nextWeek.toISOString().split('T')[0];
      content = content.replace(
        /\*\*Next Review:\*\* [0-9]{4}-[0-9]{2}-[0-9]{2}/,
        `**Next Review:** ${nextReviewDate}`
      );
      
      fs.writeFileSync(this.versionFile, content);
      console.log(`✅ Updated VERSION.md to version ${this.analysisReport.suggestedVersion}`);
    } catch (error) {
      console.error('❌ Error updating VERSION.md:', error.message);
    }
  }

  /**
   * Update CHANGELOG.md
   */
  updateChangelog() {
    try {
      let content = fs.readFileSync(this.changelogFile, 'utf8');
      
      // Create new changelog entry
      const today = new Date().toISOString().split('T')[0];
      const newEntry = this.generateChangelogEntry(today);
      
      // Insert after [Unreleased] section
      const unreleasedIndex = content.indexOf('## [Unreleased]');
      if (unreleasedIndex !== -1) {
        const beforeUnreleased = content.substring(0, unreleasedIndex);
        const afterUnreleased = content.substring(unreleasedIndex);
        
        content = beforeUnreleased + newEntry + '\n\n' + afterUnreleased;
      } else {
        // If no [Unreleased] section, add at the beginning
        content = newEntry + '\n\n' + content;
      }
      
      fs.writeFileSync(this.changelogFile, content);
      console.log(`✅ Added new changelog entry for version ${this.analysisReport.suggestedVersion}`);
    } catch (error) {
      console.error('❌ Error updating CHANGELOG.md:', error.message);
    }
  }

  /**
   * Generate changelog entry
   */
  generateChangelogEntry(date) {
    const version = this.analysisReport.suggestedVersion;
    let entry = `## [${version}] - ${date}\n\n`;
    
    // Add section based on changes
    if (this.analysisReport.changes.added.length > 0) {
      entry += '### Added\n';
      this.analysisReport.changes.added.forEach(item => {
        entry += `- ${item}\n`;
      });
      entry += '\n';
    }
    
    if (this.analysisReport.changes.changed.length > 0) {
      entry += '### Changed\n';
      this.analysisReport.changes.changed.forEach(item => {
        entry += `- ${item}\n`;
      });
      entry += '\n';
    }
    
    if (this.analysisReport.changes.fixed.length > 0) {
      entry += '### Fixed\n';
      this.analysisReport.changes.fixed.forEach(item => {
        entry += `- ${item}\n`;
      });
      entry += '\n';
    }
    
    if (this.analysisReport.changes.removed.length > 0) {
      entry += '### Removed\n';
      this.analysisReport.changes.removed.forEach(item => {
        entry += `- ${item}\n`;
      });
      entry += '\n';
    }
    
    if (this.analysisReport.changes.security.length > 0) {
      entry += '### Security\n';
      this.analysisReport.changes.security.forEach(item => {
        entry += `- ${item}\n`;
      });
      entry += '\n';
    }
    
    // Remove trailing newlines
    entry = entry.trim();
    
    return entry;
  }

  /**
   * Update DAILY_LOG.md
   */
  updateDailyLog() {
    try {
      let content = fs.readFileSync(this.dailyLogFile, 'utf8');
      
      // Add new version entry
      const today = new Date().toISOString().split('T')[0];
      const newEntry = this.generateDailyLogEntry(today);
      
      // Insert at the beginning
      content = newEntry + '\n\n' + content;
      
      fs.writeFileSync(this.dailyLogFile, content);
      console.log(`✅ Added new daily log entry for version ${this.analysisReport.suggestedVersion}`);
    } catch (error) {
      console.error('❌ Error updating DAILY_LOG.md:', error.message);
    }
  }

  /**
   * Generate daily log entry
   */
  generateDailyLogEntry(date) {
    const version = this.analysisReport.suggestedVersion;
    const bumpType = this.analysisReport.bumpType;
    
    return `## 📅 ${date} - Version ${version} Release

### 🎯 **Daily Goals**
- [x] Release version ${version}
- [x] Update version documentation
- [x] Generate changelog entry

### ✅ **Completed Tasks**

#### Version Release
- Released version ${version} (${bumpType} bump)
- Updated package.json version
- Updated VERSION.md documentation
- Generated changelog entry
- Updated daily development log

#### Changes Summary
${this.analysisReport.summary}

### 🔄 **In Progress**
- N/A

### 📋 **Next Steps**
1. **Next Development Phase**
   - Continue with planned features
   - Prepare for next version bump

2. **Version ${this.getNextVersion()} Planning**
   - Define goals for next version
   - Plan development milestones

### 💡 **Key Decisions Made**

#### Version Bump Decision
- **Previous Version**: ${this.analysisReport.currentVersion}
- **New Version**: ${version}
- **Bump Type**: ${bumpType}
- **Reason**: ${this.getBumpReason()}

### 🐛 **Issues Encountered**
- None

### 🔧 **Technical Notes**

#### Version Update Process
- Package.json updated to ${version}
- Documentation files synchronized
- Changelog entry created
- Daily log updated

### 📊 **Progress Metrics**

#### Version Status
- **Current Version**: ${version} ✅
- **Previous Version**: ${this.analysisReport.currentVersion}
- **Next Expected**: ${this.getNextVersion()}

### 🎉 **Achievements**
- Successfully released version ${version}
- Maintained version control consistency
- Updated all documentation files
- Generated comprehensive changelog

### 📚 **Resources Updated**
- package.json - Version number
- VERSION.md - Current version info
- CHANGELOG.md - New version entry
- DAILY_LOG.md - This entry

### 🔮 **Tomorrow's Goals**
- [ ] Continue development for next version
- [ ] Monitor for any post-release issues
- [ ] Plan next development milestones

---

**Log Entry By**: Version Bump System  
**Date**: ${date}  
**Next Review**: ${this.getNextReviewDate()}  
**Status**: ✅ Version Released`;
  }

  /**
   * Get next version number
   */
  getNextVersion() {
    const current = this.analysisReport.suggestedVersion.split('.');
    const major = parseInt(current[0]);
    const minor = parseInt(current[1]);
    const patch = parseInt(current[2]);
    
    if (this.analysisReport.bumpType === 'major') {
      return `${major + 1}.0.0`;
    } else if (this.analysisReport.bumpType === 'minor') {
      return `${major}.${minor + 1}.0`;
    } else {
      return `${major}.${minor}.${patch + 1}`;
    }
  }

  /**
   * Get bump reason
   */
  getBumpReason() {
    const bumpType = this.analysisReport.bumpType;
    
    switch (bumpType) {
      case 'major':
        return 'Breaking changes detected';
      case 'minor':
        return 'New features added';
      case 'patch':
        return 'Bug fixes and minor improvements';
      default:
        return 'Version bump required';
    }
  }

  /**
   * Get next review date
   */
  getNextReviewDate() {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  }

  /**
   * Create git tag
   */
  createGitTag() {
    try {
      const version = this.analysisReport.suggestedVersion;
      const tagMessage = `Release version ${version}`;
      
      execSync(`git add .`, { cwd: this.projectRoot });
      execSync(`git commit -m "chore: bump version to ${version}"`, { cwd: this.projectRoot });
      execSync(`git tag -a v${version} -m "${tagMessage}"`, { cwd: this.projectRoot });
      
      console.log(`✅ Created git tag v${version}`);
    } catch (error) {
      console.error('❌ Error creating git tag:', error.message);
      console.log('⚠️  Please create git tag manually:');
      console.log(`   git tag -a v${this.analysisReport.suggestedVersion} -m "Release version ${this.analysisReport.suggestedVersion}"`);
    }
  }

  /**
   * Clean up analysis report
   */
  cleanup() {
    try {
      if (fs.existsSync(this.analysisReportFile)) {
        fs.unlinkSync(this.analysisReportFile);
        console.log('✅ Cleaned up analysis report');
      }
    } catch (error) {
      console.error('❌ Error cleaning up:', error.message);
    }
  }

  /**
   * Run the version bump
   */
  run() {
    console.log('🚀 Starting version bump process...');
    console.log(`📋 Current version: ${this.analysisReport.currentVersion}`);
    console.log(`🎯 New version: ${this.analysisReport.suggestedVersion}`);
    console.log(`📈 Bump type: ${this.analysisReport.bumpType}`);
    
    // Update all files
    this.updatePackageJson();
    this.updateVersionFile();
    this.updateChangelog();
    this.updateDailyLog();
    
    // Create git tag
    this.createGitTag();
    
    // Cleanup
    this.cleanup();
    
    console.log('\n🎉 Version bump complete!');
    console.log(`📋 New version: ${this.analysisReport.suggestedVersion}`);
    console.log('📝 All documentation files have been updated');
    console.log('🏷️  Git tag has been created');
    console.log('\n💡 Next steps:');
    console.log('   1. Review the changes');
    console.log('   2. Push the changes and tag');
    console.log('   3. Continue development for next version');
  }
}

// Run if called directly
if (require.main === module) {
  const bumper = new VersionBumper();
  bumper.run();
}

module.exports = VersionBumper;
