import { AppConfig, CloudProvider } from '../types';
import { CloudConfigurationManager } from '../managers/CloudConfigurationManager';
import { CloudConfigValidator } from '../../../utils/cloudConfigValidator';
import { createCloudEnvironment, createCloudAccount, createCloudRole } from '../../../utils/cloudUtils';

/**
 * Test suite for cloud storage functionality
 * This tests the storage layer implementation for cloud configurations
 */
export class CloudStorageTest {
  
  /**
   * Test backward compatibility with existing configurations
   */
  public static testBackwardCompatibility(): boolean {
    console.log('Testing backward compatibility...');
    
    // Simulate old configuration without cloudEnvironments
    const oldConfig = {
      browserSync: false,
      defaultColors: ['#4a9eff', '#4CAF50'],
      settings: [
        {
          name: 'test',
          enable: true,
          sites: [],
          defaults: {
            envName: 'dev',
            backgroundEnable: false,
            flagEnable: false,
            color: '#4a9eff'
          }
        }
      ]
      // Note: no cloudEnvironments field
    };

    // Test validation with old config
    const validation = CloudConfigValidator.validateAppConfig(oldConfig as AppConfig);
    
    if (!validation.isValid) {
      console.error('Backward compatibility test failed:', validation.errors);
      return false;
    }

    // Test sanitization
    const sanitized = CloudConfigValidator.sanitizeCloudConfig(oldConfig as AppConfig);
    
    if (!sanitized.cloudEnvironments || !Array.isArray(sanitized.cloudEnvironments)) {
      console.error('Sanitization failed to add cloudEnvironments array');
      return false;
    }

    if (sanitized.cloudEnvironments.length !== 0) {
      console.error('Sanitized cloudEnvironments should be empty array');
      return false;
    }

    console.log('✓ Backward compatibility test passed');
    return true;
  }

  /**
   * Test cloud configuration validation
   */
  public static testCloudConfigValidation(): boolean {
    console.log('Testing cloud configuration validation...');
    
    // Test valid environment
    const validEnv = createCloudEnvironment('Test AWS CN', CloudProvider.AWS_CN);
    const envValidation = CloudConfigValidator.validateEnvironment(validEnv);
    
    if (!envValidation.isValid) {
      console.error('Valid environment failed validation:', envValidation.errors);
      return false;
    }

    // Test valid account
    const validAccount = createCloudAccount('Test Account', 'domain', 'example.com', '#ff0000');
    const accountValidation = CloudConfigValidator.validateAccount(validAccount);
    
    if (!accountValidation.isValid) {
      console.error('Valid account failed validation:', accountValidation.errors);
      return false;
    }

    // Test valid role
    const validRole = createCloudRole('Test Role', ['admin', 'developer'], '#00ff00');
    const roleValidation = CloudConfigValidator.validateRole(validRole);
    
    if (!roleValidation.isValid) {
      console.error('Valid role failed validation:', roleValidation.errors);
      return false;
    }

    // Test invalid configurations
    const invalidEnv = { ...validEnv, name: '' }; // Empty name should fail
    const invalidEnvValidation = CloudConfigValidator.validateEnvironment(invalidEnv);
    
    if (invalidEnvValidation.isValid) {
      console.error('Invalid environment passed validation');
      return false;
    }

    console.log('✓ Cloud configuration validation test passed');
    return true;
  }

  /**
   * Test cloud configuration CRUD operations
   */
  public static testCloudConfigCRUD(): boolean {
    console.log('Testing cloud configuration CRUD operations...');
    
    // Create mock configuration
    const mockConfig: AppConfig = {
      browserSync: false,
      defaultColors: ['#4a9eff'],
      settings: [],
      cloudEnvironments: []
    };

    let saveCallCount = 0;
    const mockSaveCallback = () => { saveCallCount++; };
    const mockNotificationCallback = (message: string, type: string) => {
      console.log(`${type.toUpperCase()}: ${message}`);
    };

    const manager = new CloudConfigurationManager(
      mockConfig,
      mockNotificationCallback,
      mockSaveCallback
    );

    // Test adding environment
    const testEnv = createCloudEnvironment('Test Environment', CloudProvider.AWS_CN);
    const addResult = manager.addCloudEnvironment(testEnv);
    
    if (!addResult.isValid) {
      console.error('Failed to add environment:', addResult.errors);
      return false;
    }

    if (mockConfig.cloudEnvironments!.length !== 1) {
      console.error('Environment was not added to configuration');
      return false;
    }

    if (saveCallCount === 0) {
      console.error('Save callback was not called');
      return false;
    }

    // Test adding account
    const testAccount = createCloudAccount('Test Account', 'domain', 'test.amazonaws.cn', '#ff0000');
    const addAccountResult = manager.addCloudAccount(testEnv.id, testAccount);
    
    if (!addAccountResult.isValid) {
      console.error('Failed to add account:', addAccountResult.errors);
      return false;
    }

    if (mockConfig.cloudEnvironments![0].accounts.length !== 1) {
      console.error('Account was not added to environment');
      return false;
    }

    // Test adding role
    const testRole = createCloudRole('Test Role', ['admin'], '#00ff00');
    const addRoleResult = manager.addCloudRole(testEnv.id, testAccount.id, testRole);
    
    if (!addRoleResult.isValid) {
      console.error('Failed to add role:', addRoleResult.errors);
      return false;
    }

    if (mockConfig.cloudEnvironments![0].accounts[0].roles.length !== 1) {
      console.error('Role was not added to account');
      return false;
    }

    // Test statistics
    const stats = manager.getCloudConfigStats();
    if (stats.environmentCount !== 1 || stats.accountCount !== 1 || stats.roleCount !== 1) {
      console.error('Statistics are incorrect:', stats);
      return false;
    }

    console.log('✓ Cloud configuration CRUD test passed');
    return true;
  }

  /**
   * Test configuration import/export with cloud data
   */
  public static testImportExportWithCloudData(): boolean {
    console.log('Testing import/export with cloud data...');
    
    // Create configuration with cloud data
    const configWithCloud: AppConfig = {
      browserSync: true,
      defaultColors: ['#4a9eff', '#ff0000'],
      settings: [
        {
          name: 'test',
          enable: true,
          sites: [],
          defaults: {
            envName: 'dev',
            backgroundEnable: false,
            flagEnable: false,
            color: '#4a9eff'
          }
        }
      ],
      cloudEnvironments: [
        createCloudEnvironment('AWS CN Production', CloudProvider.AWS_CN)
      ]
    };

    // Add account and role to the environment
    const testAccount = createCloudAccount('Production Account', 'domain', 'prod.amazonaws.cn', '#ff0000');
    const testRole = createCloudRole('Admin Role', ['admin', 'root'], '#00ff00');
    testAccount.roles.push(testRole);
    configWithCloud.cloudEnvironments![0].accounts.push(testAccount);

    // Test validation of complete configuration
    const validation = CloudConfigValidator.validateAppConfig(configWithCloud);
    
    if (!validation.isValid) {
      console.error('Configuration with cloud data failed validation:', validation.errors);
      return false;
    }

    // Test JSON serialization/deserialization (simulating export/import)
    const serialized = JSON.stringify(configWithCloud);
    const deserialized = JSON.parse(serialized) as AppConfig;
    
    // Validate deserialized configuration
    const deserializedValidation = CloudConfigValidator.validateAppConfig(deserialized);
    
    if (!deserializedValidation.isValid) {
      console.error('Deserialized configuration failed validation:', deserializedValidation.errors);
      return false;
    }

    // Check that cloud data is preserved
    if (!deserialized.cloudEnvironments || deserialized.cloudEnvironments.length !== 1) {
      console.error('Cloud environments not preserved during serialization');
      return false;
    }

    if (deserialized.cloudEnvironments[0].accounts.length !== 1) {
      console.error('Cloud accounts not preserved during serialization');
      return false;
    }

    if (deserialized.cloudEnvironments[0].accounts[0].roles.length !== 1) {
      console.error('Cloud roles not preserved during serialization');
      return false;
    }

    console.log('✓ Import/export with cloud data test passed');
    return true;
  }

  /**
   * Run all tests
   */
  public static runAllTests(): boolean {
    console.log('Running cloud storage tests...');
    
    const tests = [
      this.testBackwardCompatibility,
      this.testCloudConfigValidation,
      this.testCloudConfigCRUD,
      this.testImportExportWithCloudData
    ];

    let allPassed = true;
    
    for (const test of tests) {
      try {
        if (!test()) {
          allPassed = false;
        }
      } catch (error) {
        console.error('Test failed with exception:', error);
        allPassed = false;
      }
    }

    if (allPassed) {
      console.log('✅ All cloud storage tests passed!');
    } else {
      console.log('❌ Some cloud storage tests failed!');
    }

    return allPassed;
  }
}

// Export for use in other test files or manual testing
(window as any).CloudStorageTest = CloudStorageTest;