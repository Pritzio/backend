#!/usr/bin/env node

/**
 * Version Analyzer for Pritzio Backend
 * Automatically analyzes changes and determines semantic version
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class VersionAnalyzer {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.devFolder = path.join(this.projectRoot, '.dev');
    this.versionFile = path.join(this.devFolder, 'version-control', 'VERSION.md');
    this.changelogFile = path.join(this.devFolder, 'version-control', 'CHANGELOG.md');
    this.dailyLogFile = path.join(this.devFolder, 'version-control', 'DAILY_LOG.md');
    
    this.currentVersion = this.getCurrentVersion();
    this.changes = {
      added: [],
      changed: [],
      fixed: [],
      removed: [],
      security: [],
      performance: [],
      documentation: [],
      testing: []
    };
  }

  /**
   * Get current version from VERSION.md
   */
  getCurrentVersion() {
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
   * Analyze git changes since last version
   */
  analyzeGitChanges() {
    try {
      // Get last tag or commit
      let lastReference;
      try {
        lastReference = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
      } catch {
        // No tags found, use last commit
        lastReference = execSync('git log --oneline -1 --format="%H"', { encoding: 'utf8' }).trim();
      }

      // Get changes since last reference
      const changes = execSync(`git diff --name-status ${lastReference}..HEAD`, { encoding: 'utf8' });
      
      this.parseGitChanges(changes);
    } catch (error) {
      console.error('Error analyzing git changes:', error.message);
      this.analyzeFileSystemChanges();
    }
  }

  /**
   * Parse git changes output
   */
  parseGitChanges(changes) {
    const lines = changes.trim().split('\n');
    
    lines.forEach(line => {
      if (!line) return;
      
      const [status, file] = line.split('\t');
      if (!file) return;

      // Skip certain files
      if (this.shouldSkipFile(file)) return;

      this.categorizeChange(status, file);
    });
  }

  /**
   * Analyze file system changes as fallback
   */
  analyzeFileSystemChanges() {
    console.log('Analyzing file system changes...');
    
    // This would analyze actual file modifications
    // For now, we'll use a simple approach
    this.changes.documentation.push('File system analysis performed');
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
  categorizeChange(status, file) {
    const fileType = this.getFileType(file);
    
    switch (status) {
      case 'A': // Added
        this.changes.added.push(`${fileType}: ${file}`);
        break;
      case 'M': // Modified
        this.changes.changed.push(`${fileType}: ${file}`);
        break;
      case 'D': // Deleted
        this.changes.removed.push(`${fileType}: ${file}`);
        break;
      case 'R': // Renamed
        this.changes.changed.push(`${fileType}: ${file} (renamed)`);
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
   * Determine version bump type
   */
  determineVersionBump() {
    const current = this.parseVersion(this.currentVersion);
    
    // Check for breaking changes
    if (this.hasBreakingChanges()) {
      return { type: 'major', newVersion: `${current.major + 1}.0.0` };
    }
    
    // Check for new features
    if (this.hasNewFeatures()) {
      return { type: 'minor', newVersion: `${current.major}.${current.minor + 1}.0` };
    }
    
    // Default to patch
    return { type: 'patch', newVersion: `${current.major}.${current.minor}.${current.patch + 1}` };
  }

  /**
   * Check for breaking changes
   */
  hasBreakingChanges() {
    // Look for breaking change indicators
    const breakingPatterns = [
      /breaking/i,
      /incompatible/i,
      /deprecated/i,
      /removed/i,
      /changed.*api/i
    ];

    return this.changes.changed.some(change => 
      breakingPatterns.some(pattern => pattern.test(change))
    );
  }

  /**
   * Check for new features
   */
  hasNewFeatures() {
    return this.changes.added.length > 0 || 
           this.changes.changed.some(change => 
             change.includes('Source Code') || 
             change.includes('New endpoint') ||
             change.includes('New module')
           );
  }

  /**
   * Parse version string
   */
  parseVersion(version) {
    const parts = version.split('.').map(Number);
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0
    };
  }

  /**
   * Generate analysis report
   */
  generateReport() {
    const versionBump = this.determineVersionBump();
    
    const report = {
      currentVersion: this.currentVersion,
      suggestedVersion: versionBump.newVersion,
      bumpType: versionBump.type,
      changes: this.changes,
      summary: this.generateSummary(),
      timestamp: new Date().toISOString()
    };

    // Save analysis report
    const reportFile = path.join(this.devFolder, 'version-control', 'ANALYSIS_REPORT.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    return report;
  }

  /**
   * Generate human-readable summary
   */
  generateSummary() {
    const totalChanges = Object.values(this.changes).reduce((sum, arr) => sum + arr.length, 0);
    
    if (totalChanges === 0) {
      return 'No significant changes detected since last version.';
    }

    const summary = [];
    
    if (this.changes.added.length > 0) {
      summary.push(`${this.changes.added.length} new items added`);
    }
    if (this.changes.changed.length > 0) {
      summary.push(`${this.changes.changed.length} items modified`);
    }
    if (this.changes.fixed.length > 0) {
      summary.push(`${this.changes.fixed.length} issues fixed`);
    }
    if (this.changes.removed.length > 0) {
      summary.push(`${this.changes.removed.length} items removed`);
    }

    return summary.join(', ') + '.';
  }

  /**
   * Run the analysis
   */
  run() {
    console.log('🔍 Analyzing changes for version bump...');
    console.log(`📋 Current version: ${this.currentVersion}`);
    
    // Analyze changes
    this.analyzeGitChanges();
    
    // Generate report
    const report = this.generateReport();
    
    // Display results
    console.log('\n📊 Analysis Results:');
    console.log(`🎯 Suggested version: ${report.suggestedVersion}`);
    console.log(`📈 Bump type: ${report.bumpType}`);
    console.log(`📝 Summary: ${report.summary}`);
    
    if (Object.values(this.changes).some(arr => arr.length > 0)) {
      console.log('\n📋 Changes detected:');
      Object.entries(this.changes).forEach(([category, items]) => {
        if (items.length > 0) {
          console.log(`  ${category.toUpperCase()}: ${items.length} items`);
          items.slice(0, 3).forEach(item => console.log(`    - ${item}`));
          if (items.length > 3) console.log(`    ... and ${items.length - 3} more`);
        }
      });
    }
    
    console.log('\n✅ Analysis complete! Run "npm run version:bump" to apply changes.');
    
    return report;
  }
}

// Run if called directly
if (require.main === module) {
  const analyzer = new VersionAnalyzer();
  analyzer.run();
}

module.exports = VersionAnalyzer;
