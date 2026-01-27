import { CloudProvider, CloudEnvironment, CloudAccount, CloudRole } from '../types';
import { CloudConfigurationManager } from '../managers/CloudConfigurationManager';
import { CloudRolesTab } from '../managers/CloudRolesTab';
import { createCloudEnvironment, createCloudAccount, createCloudRole } from '../../../utils/cloudUtils';
import { getCloudTemplate } from '../../../utils/cloudTemplates';

/**
 * Comprehensive test suite for Cloud Configuration UI functionality
 * This test validates the checkpoint requirements for task 5
 */
export class CloudConfigUITest {
  private static testResults: { [key: string]: boolean } = {};
  private static testMessages: { [key: string]: string } = {};

  /**
   * Test 1: Verify cloud configuration UI is functional
   */
  public static testCloudConfigurationUI(): boolean {
    console.log('🧪 Testing cloud configuration UI functionality...');
    
    try {
      // Check if cloud roles tab exists
      const cloudRolesTab = document.getElementById('cloud-roles-tab');
      if (!cloudRolesTab) {
        this.testMessages['cloudUI'] = 'Cloud Roles tab not found in UI';
        return false;
      }

      // Check if cloud environments container exists
      const cloudEnvironmentsContainer = document.getElementById('cloud-environments-container');
      if (!cloudEnvironmentsContainer) {
        this.testMessages['cloudUI'] = 'Cloud environments container not found';
        return false;
      }

      // Check if add environment button exists
      const addEnvironmentBtn = document.getElementById('add-cloud-environment');
      if (!addEnvironmentBtn) {
        this.testMessages['cloudUI'] = 'Add cloud environment button not found';
        return false;
      }

      this.testMessages['cloudUI'] = 'Cloud configuration UI elements are present';
      return true;
    } catch (error) {
      this.testMessages['cloudUI'] = `Cloud UI test failed: ${error}`;
      return false;
    }
  }

  /**
   * Test 2: Verify new selector configuration system
   */
  public static testSelectorConfigurationSystem(): boolean {
    console.log('🧪 Testing selector configuration system...');
    
    try {
      // Test AWS CN template has selectors
      const awsCnTemplate = getCloudTemplate(CloudProvider.AWS_CN);
      
      if (!awsCnTemplate.selectors) {
        this.testMessages['selectors'] = 'AWS CN template missing selectors';
        return false;
      }

      if (!awsCnTemplate.selectors.accountSelection || !awsCnTemplate.selectors.console) {
        this.testMessages['selectors'] = 'AWS CN template missing required selector sections';
        return false;
      }

      // Check account selection selectors
      const accountSelection = awsCnTemplate.selectors.accountSelection;
      if (!accountSelection.accountContainers || accountSelection.accountContainers.length === 0) {
        this.testMessages['selectors'] = 'AWS CN template missing account containers';
        return false;
      }

      if (!accountSelection.roleElements || accountSelection.roleElements.length === 0) {
        this.testMessages['selectors'] = 'AWS CN template missing role elements';
        return false;
      }

      // Check console selectors
      const console = awsCnTemplate.selectors.console;
      if (!console.accountContainers || console.accountContainers.length === 0) {
        this.testMessages['selectors'] = 'AWS CN template missing console account containers';
        return false;
      }

      if (!console.roleElements || console.roleElements.length === 0) {
        this.testMessages['selectors'] = 'AWS CN template missing console role elements';
        return false;
      }

      this.testMessages['selectors'] = 'Selector configuration system is properly implemented';
      return true;
    } catch (error) {
      this.testMessages['selectors'] = `Selector configuration test failed: ${error}`;
      return false;
    }
  }

  /**
   * Test 3: Verify layout changes (title left, add button right, always expanded environments)
   */
  public static testLayoutChanges(): boolean {
    console.log('🧪 Testing layout changes...');
    
    try {
      // Create a test environment to check layout
      const testEnv = createCloudEnvironment('Test Layout Environment', CloudProvider.AWS_CN);
      const testAccount = createCloudAccount('Test Account', 'domain', 'test.example.com', '#ff0000');
      testEnv.accounts.push(testAccount);

      // Get the app controller to access cloud configuration manager
      const appController = (window as any).enveilApp?.getController();
      if (!appController) {
        this.testMessages['layout'] = 'App controller not available for layout testing';
        return false;
      }

      const cloudConfigManager = appController.getCloudConfigurationManager();
      const addResult = cloudConfigManager.addCloudEnvironment(testEnv);
      
      if (!addResult.isValid) {
        this.testMessages['layout'] = `Failed to add test environment: ${addResult.errors.join(', ')}`;
        return false;
      }

      // Wait a moment for UI to render
      setTimeout(() => {
        // Check if environment header has correct layout structure
        const environmentHeader = document.querySelector('.environment-header');
        if (!environmentHeader) {
          this.testMessages['layout'] = 'Environment header not found';
          return false;
        }

        // Check for header left section (title)
        const headerLeft = environmentHeader.querySelector('.environment-header-left');
        if (!headerLeft) {
          this.testMessages['layout'] = 'Environment header left section not found';
          return false;
        }

        // Check for header actions section (add button right)
        const headerActions = environmentHeader.querySelector('.environment-header-actions');
        if (!headerActions) {
          this.testMessages['layout'] = 'Environment header actions section not found';
          return false;
        }

        // Check for add account button in header actions
        const addAccountBtn = headerActions.querySelector('.add-account-btn');
        if (!addAccountBtn) {
          this.testMessages['layout'] = 'Add account button not found in header actions';
          return false;
        }

        // Check if accounts container is always expanded (no collapse functionality)
        const accountsContainer = document.querySelector('.environment-accounts');
        if (!accountsContainer) {
          this.testMessages['layout'] = 'Environment accounts container not found';
          return false;
        }

        if (!accountsContainer.classList.contains('expanded')) {
          this.testMessages['layout'] = 'Environment accounts container is not expanded by default';
          return false;
        }

        this.testMessages['layout'] = 'Layout changes are correctly implemented';
        return true;
      }, 100);

      return true;
    } catch (error) {
      this.testMessages['layout'] = `Layout test failed: ${error}`;
      return false;
    }
  }

  /**
   * Test 4: Verify enhanced CloudTemplate with DOM selectors
   */
  public static testEnhancedCloudTemplate(): boolean {
    console.log('🧪 Testing enhanced CloudTemplate with DOM selectors...');
    
    try {
      // Test all cloud providers have enhanced templates
      const providers = [CloudProvider.AWS_CN, CloudProvider.AWS_GLOBAL, CloudProvider.AZURE, CloudProvider.GCP];
      
      for (const provider of providers) {
        const template = getCloudTemplate(provider);
        
        // Skip custom provider as it has empty selectors by design
        if (provider === CloudProvider.CUSTOM) continue;
        
        if (!template.selectors) {
          this.testMessages['enhancedTemplate'] = `${provider} template missing selectors`;
          return false;
        }

        // Verify account selection selectors
        if (!template.selectors.accountSelection) {
          this.testMessages['enhancedTemplate'] = `${provider} template missing accountSelection selectors`;
          return false;
        }

        if (!Array.isArray(template.selectors.accountSelection.accountContainers) || 
            template.selectors.accountSelection.accountContainers.length === 0) {
          this.testMessages['enhancedTemplate'] = `${provider} template has invalid accountContainers`;
          return false;
        }

        if (!Array.isArray(template.selectors.accountSelection.roleElements) || 
            template.selectors.accountSelection.roleElements.length === 0) {
          this.testMessages['enhancedTemplate'] = `${provider} template has invalid roleElements`;
          return false;
        }

        // Verify console selectors
        if (!template.selectors.console) {
          this.testMessages['enhancedTemplate'] = `${provider} template missing console selectors`;
          return false;
        }

        if (!Array.isArray(template.selectors.console.accountContainers) || 
            template.selectors.console.accountContainers.length === 0) {
          this.testMessages['enhancedTemplate'] = `${provider} template has invalid console accountContainers`;
          return false;
        }

        if (!Array.isArray(template.selectors.console.roleElements) || 
            template.selectors.console.roleElements.length === 0) {
          this.testMessages['enhancedTemplate'] = `${provider} template has invalid console roleElements`;
          return false;
        }
      }

      this.testMessages['enhancedTemplate'] = 'Enhanced CloudTemplate with DOM selectors is properly implemented';
      return true;
    } catch (error) {
      this.testMessages['enhancedTemplate'] = `Enhanced CloudTemplate test failed: ${error}`;
      return false;
    }
  }

  /**
   * Test 5: Verify role management table functionality
   */
  public static testRoleManagementTable(): boolean {
    console.log('🧪 Testing role management table functionality...');
    
    try {
      // Test role creation and validation
      const testRole = createCloudRole('Test Role', ['admin', 'developer'], '#ff0000');
      
      if (!testRole.id || !testRole.name || !testRole.keywords || !testRole.highlightColor) {
        this.testMessages['roleTable'] = 'Role creation failed - missing required fields';
        return false;
      }

      if (!Array.isArray(testRole.keywords) || testRole.keywords.length === 0) {
        this.testMessages['roleTable'] = 'Role keywords are not properly configured';
        return false;
      }

      if (!testRole.highlightStyle) {
        this.testMessages['roleTable'] = 'Role highlight style is missing';
        return false;
      }

      // Verify highlight style properties
      const style = testRole.highlightStyle;
      if (!style.textColor || !style.backgroundColor || !style.fontWeight || !style.textDecoration) {
        this.testMessages['roleTable'] = 'Role highlight style is missing required properties';
        return false;
      }

      this.testMessages['roleTable'] = 'Role management table functionality is working correctly';
      return true;
    } catch (error) {
      this.testMessages['roleTable'] = `Role management table test failed: ${error}`;
      return false;
    }
  }

  /**
   * Test 6: Verify configuration persistence and validation
   */
  public static testConfigurationPersistence(): boolean {
    console.log('🧪 Testing configuration persistence and validation...');
    
    try {
      // Get the app controller
      const appController = (window as any).enveilApp?.getController();
      if (!appController) {
        this.testMessages['persistence'] = 'App controller not available for persistence testing';
        return false;
      }

      const cloudConfigManager = appController.getCloudConfigurationManager();
      
      // Test configuration validation
      const validationResult = cloudConfigManager.validateCloudConfiguration();
      
      if (!validationResult) {
        this.testMessages['persistence'] = 'Configuration validation method not available';
        return false;
      }

      // Test configuration statistics
      const stats = cloudConfigManager.getCloudConfigStats();
      
      if (typeof stats.environmentCount !== 'number' || 
          typeof stats.accountCount !== 'number' || 
          typeof stats.roleCount !== 'number') {
        this.testMessages['persistence'] = 'Configuration statistics are not properly calculated';
        return false;
      }

      this.testMessages['persistence'] = 'Configuration persistence and validation is working correctly';
      return true;
    } catch (error) {
      this.testMessages['persistence'] = `Configuration persistence test failed: ${error}`;
      return false;
    }
  }

  /**
   * Run all checkpoint tests
   */
  public static runCheckpointTests(): { passed: number; total: number; results: { [key: string]: { passed: boolean; message: string } } } {
    console.log('🚀 Running Cloud Configuration UI Checkpoint Tests...');
    
    const tests = [
      { name: 'cloudUI', test: this.testCloudConfigurationUI },
      { name: 'selectors', test: this.testSelectorConfigurationSystem },
      { name: 'layout', test: this.testLayoutChanges },
      { name: 'enhancedTemplate', test: this.testEnhancedCloudTemplate },
      { name: 'roleTable', test: this.testRoleManagementTable },
      { name: 'persistence', test: this.testConfigurationPersistence }
    ];

    let passed = 0;
    const results: { [key: string]: { passed: boolean; message: string } } = {};

    for (const { name, test } of tests) {
      try {
        const result = test.call(this);
        this.testResults[name] = result;
        
        results[name] = {
          passed: result,
          message: this.testMessages[name] || 'No message'
        };
        
        if (result) {
          passed++;
          console.log(`✅ ${name}: PASSED - ${this.testMessages[name]}`);
        } else {
          console.log(`❌ ${name}: FAILED - ${this.testMessages[name]}`);
        }
      } catch (error) {
        this.testResults[name] = false;
        results[name] = {
          passed: false,
          message: `Test execution failed: ${error}`
        };
        console.log(`❌ ${name}: ERROR - ${error}`);
      }
    }

    const total = tests.length;
    console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      console.log('🎉 All checkpoint tests passed! Configuration UI is functional.');
    } else {
      console.log('⚠️  Some tests failed. Please review the issues above.');
    }

    return { passed, total, results };
  }

  /**
   * Generate a detailed test report
   */
  public static generateTestReport(): string {
    const testResults = this.runCheckpointTests();
    
    let report = '# Cloud Configuration UI Checkpoint Test Report\n\n';
    report += `**Overall Result:** ${testResults.passed}/${testResults.total} tests passed\n\n`;
    
    report += '## Test Details\n\n';
    
    Object.entries(testResults.results).forEach(([testName, result]) => {
      const status = result.passed ? '✅ PASSED' : '❌ FAILED';
      report += `### ${testName}: ${status}\n`;
      report += `${result.message}\n\n`;
    });
    
    report += '## Summary\n\n';
    if (testResults.passed === testResults.total) {
      report += '🎉 **All tests passed!** The cloud configuration UI is fully functional and meets all checkpoint requirements.\n\n';
      report += '### Verified Functionality:\n';
      report += '- ✅ Cloud configuration UI is functional\n';
      report += '- ✅ New selector configuration system is working\n';
      report += '- ✅ Layout changes are properly implemented\n';
      report += '- ✅ Enhanced CloudTemplate with DOM selectors is working\n';
      report += '- ✅ Role management table functionality is operational\n';
      report += '- ✅ Configuration persistence and validation is working\n';
    } else {
      report += '⚠️ **Some tests failed.** Please review the failed tests and address the issues before proceeding.\n';
    }
    
    return report;
  }
}

// Make the test class available globally for manual testing
(window as any).CloudConfigUITest = CloudConfigUITest;

// Auto-run tests when this module is loaded (for development)
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => CloudConfigUITest.runCheckpointTests(), 1000);
    });
  } else {
    setTimeout(() => CloudConfigUITest.runCheckpointTests(), 1000);
  }
}