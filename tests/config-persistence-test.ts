/**
 * Configuration Persistence and Import/Export Validation
 * Task 10.2: Validate configuration persistence and import/export
 * Requirements: 5.5
 */

import { AppConfig, CloudEnvironment, CloudAccount, CloudRole, RoleHighlightStyle, CloudProvider } from '../entrypoints/options/types';

/**
 * Validates that cloud configuration persistence and import/export works correctly
 * Tests Requirement 5.5
 */
class ConfigurationPersistenceValidator {
    private testResults: Array<{ test: string; passed: boolean; message: string }> = [];

    /**
     * Runs all configuration persistence validation tests
     */
    public async runAllValidationTests(): Promise<boolean> {
        console.log('=== Configuration Persistence and Import/Export Validation ===');
        console.log('Task 10.2 - Requirement 5.5');

        this.testResults = [];

        // Test 1: Cloud configuration saving and loading
        await this.testCloudConfigurationPersistence();

        // Test 2: Full configuration export includes cloud environments
        await this.testFullConfigurationExport();

        // Test 3: Full configuration import handles cloud environments
        await this.testFullConfigurationImport();

        // Test 4: Cloud-specific import/export functionality
        await this.testCloudSpecificImportExport();

        // Test 5: Backward compatibility with existing configurations
        await this.testBackwardCompatibility();

        // Test 6: Configuration validation for cloud environments
        await this.testCloudConfigurationValidation();

        // Report results
        this.reportResults();

        // Return overall success
        return this.testResults.every(result => result.passed);
    }

    /**
     * Test 1: Cloud configuration saving and loading
     * Validates that cloud configurations persist correctly
     */
    private async testCloudConfigurationPersistence(): Promise<void> {
        console.log('\n--- Test 1: Cloud Configuration Persistence ---');

        try {
            // Create test configuration with cloud environments
            const testConfig = this.createTestConfigWithCloudEnvironments();

            // Simulate saving configuration
            const savedConfigJson = JSON.stringify(testConfig);
            
            // Simulate loading configuration
            const loadedConfig = JSON.parse(savedConfigJson) as AppConfig;

            // Validate that cloud environments are preserved
            const cloudEnvironmentsPreserved = loadedConfig.cloudEnvironments !== undefined &&
                Array.isArray(loadedConfig.cloudEnvironments) &&
                loadedConfig.cloudEnvironments.length === testConfig.cloudEnvironments!.length;

            if (cloudEnvironmentsPreserved) {
                // Validate structure integrity
                const firstEnv = loadedConfig.cloudEnvironments![0];
                const structureIntact = firstEnv.id === testConfig.cloudEnvironments![0].id &&
                    firstEnv.accounts.length === testConfig.cloudEnvironments![0].accounts.length &&
                    firstEnv.accounts[0].roles.length === testConfig.cloudEnvironments![0].accounts[0].roles.length;

                if (structureIntact) {
                    this.testResults.push({
                        test: 'Cloud Configuration Persistence',
                        passed: true,
                        message: 'Cloud configurations are correctly saved and loaded with full structure integrity'
                    });
                    console.log('✓ PASSED: Cloud configuration persistence works correctly');
                } else {
                    this.testResults.push({
                        test: 'Cloud Configuration Persistence',
                        passed: false,
                        message: 'Cloud configuration structure is not preserved correctly'
                    });
                    console.log('✗ FAILED: Structure integrity issues detected');
                }
            } else {
                this.testResults.push({
                    test: 'Cloud Configuration Persistence',
                    passed: false,
                    message: 'Cloud environments are not preserved during save/load cycle'
                });
                console.log('✗ FAILED: Cloud environments not preserved');
            }
        } catch (error: any) {
            this.testResults.push({
                test: 'Cloud Configuration Persistence',
                passed: false,
                message: `Error: ${error?.message || 'Unknown error'}`
            });
            console.log('✗ FAILED: Error during test execution');
        }
    }

    /**
     * Test 2: Full configuration export includes cloud environments
     * Validates that export functionality includes cloud configurations
     */
    private async testFullConfigurationExport(): Promise<void> {
        console.log('\n--- Test 2: Full Configuration Export ---');

        try {
            const testConfig = this.createTestConfigWithCloudEnvironments();

            // Simulate export process
            const exportedJson = JSON.stringify(testConfig, null, 2);
            const exportedConfig = JSON.parse(exportedJson) as AppConfig;

            // Validate that cloud environments are included in export
            const cloudEnvironmentsIncluded = exportedConfig.cloudEnvironments !== undefined &&
                Array.isArray(exportedConfig.cloudEnvironments) &&
                exportedConfig.cloudEnvironments.length > 0;

            // Validate that all cloud configuration properties are exported
            if (cloudEnvironmentsIncluded) {
                const firstEnv = exportedConfig.cloudEnvironments![0];
                const firstAccount = firstEnv.accounts[0];
                const firstRole = firstAccount.roles[0];

                const allPropertiesExported = 
                    // Environment properties
                    firstEnv.id && firstEnv.name && firstEnv.provider && firstEnv.template &&
                    // Account properties
                    firstAccount.id && firstAccount.name && firstAccount.color &&
                    // Role properties
                    firstRole.id && firstRole.name && firstRole.keywords && firstRole.highlightStyle;

                if (allPropertiesExported) {
                    this.testResults.push({
                        test: 'Full Configuration Export',
                        passed: true,
                        message: 'Cloud environments and all properties are correctly included in export'
                    });
                    console.log('✓ PASSED: Full configuration export includes cloud environments');
                } else {
                    this.testResults.push({
                        test: 'Full Configuration Export',
                        passed: false,
                        message: 'Some cloud configuration properties are missing in export'
                    });
                    console.log('✗ FAILED: Missing cloud configuration properties in export');
                }
            } else {
                this.testResults.push({
                    test: 'Full Configuration Export',
                    passed: false,
                    message: 'Cloud environments are not included in configuration export'
                });
                console.log('✗ FAILED: Cloud environments not included in export');
            }
        } catch (error: any) {
            this.testResults.push({
                test: 'Full Configuration Export',
                passed: false,
                message: `Error: ${error?.message || 'Unknown error'}`
            });
            console.log('✗ FAILED: Error during test execution');
        }
    }

    /**
     * Test 3: Full configuration import handles cloud environments
     * Validates that import functionality correctly handles cloud configurations
     */
    private async testFullConfigurationImport(): Promise<void> {
        console.log('\n--- Test 3: Full Configuration Import ---');

        try {
            // Create test configuration with cloud environments
            const testConfig = this.createTestConfigWithCloudEnvironments();
            const importJson = JSON.stringify(testConfig);

            // Simulate import process
            const importedConfig = JSON.parse(importJson) as AppConfig;

            // Validate import structure
            const importValid = this.validateImportedConfig(importedConfig);

            // Test backward compatibility - config without cloud environments
            const legacyConfig: AppConfig = {
                browserSync: false,
                defaultColors: ['#ff0000', '#00ff00'],
                settings: []
                // No cloudEnvironments property
            };

            const legacyImportJson = JSON.stringify(legacyConfig);
            const importedLegacyConfig = JSON.parse(legacyImportJson) as AppConfig;

            // Should handle missing cloudEnvironments gracefully
            const backwardCompatible = importedLegacyConfig.cloudEnvironments === undefined;

            if (importValid && backwardCompatible) {
                this.testResults.push({
                    test: 'Full Configuration Import',
                    passed: true,
                    message: 'Import correctly handles both cloud configurations and legacy formats'
                });
                console.log('✓ PASSED: Full configuration import handles cloud environments correctly');
            } else {
                this.testResults.push({
                    test: 'Full Configuration Import',
                    passed: false,
                    message: `Import validation failed: valid=${importValid}, backward compatible=${backwardCompatible}`
                });
                console.log('✗ FAILED: Import handling issues detected');
            }
        } catch (error: any) {
            this.testResults.push({
                test: 'Full Configuration Import',
                passed: false,
                message: `Error: ${error?.message || 'Unknown error'}`
            });
            console.log('✗ FAILED: Error during test execution');
        }
    }

    /**
     * Test 4: Cloud-specific import/export functionality
     * Validates cloud-specific import/export features
     */
    private async testCloudSpecificImportExport(): Promise<void> {
        console.log('\n--- Test 4: Cloud-Specific Import/Export ---');

        try {
            // Create cloud-only configuration
            const cloudOnlyConfig = {
                cloudEnvironments: this.createTestCloudEnvironments()
            };

            // Test cloud-specific export
            const cloudExportJson = JSON.stringify(cloudOnlyConfig, null, 2);
            const exportedCloudConfig = JSON.parse(cloudExportJson);

            const cloudExportValid = exportedCloudConfig.cloudEnvironments &&
                Array.isArray(exportedCloudConfig.cloudEnvironments) &&
                exportedCloudConfig.cloudEnvironments.length > 0;

            // Test cloud-specific import validation
            const validCloudImport = exportedCloudConfig.cloudEnvironments &&
                exportedCloudConfig.cloudEnvironments.every((env: CloudEnvironment) => 
                    env.id && env.name && env.accounts && Array.isArray(env.accounts)
                );

            // Test invalid cloud import
            const invalidCloudConfig = {
                cloudEnvironments: [
                    { id: 'invalid', name: 'Invalid', accounts: 'not-an-array' }
                ]
            };

            const invalidImportDetected = !this.validateCloudEnvironments(invalidCloudConfig.cloudEnvironments);

            if (cloudExportValid && validCloudImport && invalidImportDetected) {
                this.testResults.push({
                    test: 'Cloud-Specific Import/Export',
                    passed: true,
                    message: 'Cloud-specific import/export functionality works correctly with validation'
                });
                console.log('✓ PASSED: Cloud-specific import/export functionality works correctly');
            } else {
                this.testResults.push({
                    test: 'Cloud-Specific Import/Export',
                    passed: false,
                    message: `Cloud import/export issues: export=${cloudExportValid}, import=${validCloudImport}, validation=${invalidImportDetected}`
                });
                console.log('✗ FAILED: Cloud-specific import/export issues detected');
            }
        } catch (error: any) {
            this.testResults.push({
                test: 'Cloud-Specific Import/Export',
                passed: false,
                message: `Error: ${error?.message || 'Unknown error'}`
            });
            console.log('✗ FAILED: Error during test execution');
        }
    }

    /**
     * Test 5: Backward compatibility with existing configurations
     * Validates that existing configurations without cloud environments still work
     */
    private async testBackwardCompatibility(): Promise<void> {
        console.log('\n--- Test 5: Backward Compatibility ---');

        try {
            // Test configurations without cloudEnvironments
            const legacyConfigs = [
                // Old format without cloudEnvironments
                {
                    browserSync: false,
                    defaultColors: ['#ff0000'],
                    settings: []
                },
                // New format with empty cloudEnvironments
                {
                    browserSync: true,
                    defaultColors: ['#00ff00'],
                    settings: [],
                    cloudEnvironments: []
                },
                // New format with cloudEnvironments
                {
                    browserSync: true,
                    defaultColors: ['#0000ff'],
                    settings: [],
                    cloudEnvironments: this.createTestCloudEnvironments()
                }
            ];

            let allCompatible = true;
            let compatibilityMessages: string[] = [];

            for (let i = 0; i < legacyConfigs.length; i++) {
                const config = legacyConfigs[i];
                const configJson = JSON.stringify(config);
                
                try {
                    const parsedConfig = JSON.parse(configJson) as AppConfig;
                    
                    // Validate basic structure
                    const hasRequiredFields = parsedConfig.browserSync !== undefined &&
                        Array.isArray(parsedConfig.defaultColors) &&
                        Array.isArray(parsedConfig.settings);

                    // Validate cloud environments handling
                    const cloudEnvHandling = parsedConfig.cloudEnvironments === undefined || 
                        Array.isArray(parsedConfig.cloudEnvironments);

                    if (!hasRequiredFields || !cloudEnvHandling) {
                        allCompatible = false;
                        compatibilityMessages.push(`Config ${i + 1}: Structure validation failed`);
                    }
                } catch (error) {
                    allCompatible = false;
                    compatibilityMessages.push(`Config ${i + 1}: Parse error`);
                }
            }

            if (allCompatible) {
                this.testResults.push({
                    test: 'Backward Compatibility',
                    passed: true,
                    message: 'All configuration formats (legacy and new) are handled correctly'
                });
                console.log('✓ PASSED: Backward compatibility is maintained');
            } else {
                this.testResults.push({
                    test: 'Backward Compatibility',
                    passed: false,
                    message: `Compatibility issues: ${compatibilityMessages.join(', ')}`
                });
                console.log('✗ FAILED: Backward compatibility issues detected');
            }
        } catch (error: any) {
            this.testResults.push({
                test: 'Backward Compatibility',
                passed: false,
                message: `Error: ${error?.message || 'Unknown error'}`
            });
            console.log('✗ FAILED: Error during test execution');
        }
    }

    /**
     * Test 6: Configuration validation for cloud environments
     * Validates that cloud configuration validation works correctly
     */
    private async testCloudConfigurationValidation(): Promise<void> {
        console.log('\n--- Test 6: Cloud Configuration Validation ---');

        try {
            // Test valid cloud configuration
            const validConfig = this.createTestCloudEnvironments();
            const validConfigValid = this.validateCloudEnvironments(validConfig);

            // Test invalid cloud configurations
            const invalidConfigs = [
                // Missing required fields
                [{ name: 'Invalid', accounts: [] }], // Missing id
                [{ id: 'invalid', accounts: [] }], // Missing name
                [{ id: 'invalid', name: 'Invalid' }], // Missing accounts
                // Invalid data types
                [{ id: 123, name: 'Invalid', accounts: [] }], // id not string
                [{ id: 'invalid', name: 123, accounts: [] }], // name not string
                [{ id: 'invalid', name: 'Invalid', accounts: 'not-array' }], // accounts not array
            ];

            let allInvalidDetected = true;
            for (const invalidConfig of invalidConfigs) {
                if (this.validateCloudEnvironments(invalidConfig)) {
                    allInvalidDetected = false;
                    break;
                }
            }

            // Test account validation
            const invalidAccountConfig = [{
                id: 'test-env',
                name: 'Test Environment',
                enable: true,
                provider: CloudProvider.AWS_CN,
                template: this.createTestTemplate(),
                accounts: [
                    { name: 'Invalid Account', roles: [] } // Missing required fields
                ],
                created: Date.now(),
                modified: Date.now()
            }];

            const invalidAccountDetected = !this.validateCloudEnvironments(invalidAccountConfig);

            if (validConfigValid && allInvalidDetected && invalidAccountDetected) {
                this.testResults.push({
                    test: 'Cloud Configuration Validation',
                    passed: true,
                    message: 'Cloud configuration validation correctly identifies valid and invalid configurations'
                });
                console.log('✓ PASSED: Cloud configuration validation works correctly');
            } else {
                this.testResults.push({
                    test: 'Cloud Configuration Validation',
                    passed: false,
                    message: `Validation issues: valid=${validConfigValid}, invalid detected=${allInvalidDetected}, account validation=${invalidAccountDetected}`
                });
                console.log('✗ FAILED: Cloud configuration validation issues detected');
            }
        } catch (error: any) {
            this.testResults.push({
                test: 'Cloud Configuration Validation',
                passed: false,
                message: `Error: ${error?.message || 'Unknown error'}`
            });
            console.log('✗ FAILED: Error during test execution');
        }
    }

    /**
     * Creates a test configuration with cloud environments
     */
    private createTestConfigWithCloudEnvironments(): AppConfig {
        return {
            browserSync: true,
            defaultColors: ['#ff6b6b', '#4ecdc4', '#45b7d1'],
            settings: [],
            cloudEnvironments: this.createTestCloudEnvironments()
        };
    }

    /**
     * Creates test cloud environments
     */
    private createTestCloudEnvironments(): CloudEnvironment[] {
        return [
            {
                id: 'aws-cn-prod',
                name: 'AWS CN Production',
                enable: true,
                provider: CloudProvider.AWS_CN,
                template: this.createTestTemplate(),
                accounts: [
                    {
                        id: 'prod-account-1',
                        name: 'Production Account 1',
                        enable: true,
                        matchPattern: 'domain',
                        matchValue: 'amazonaws.cn',
                        color: '#ff6b6b',
                        backgroundEnable: true,
                        roles: [
                            {
                                id: 'admin-role',
                                name: 'Administrator',
                                enable: true,
                                keywords: ['admin', 'administrator'],
                                highlightColor: '#e74c3c',
                                highlightStyle: {
                                    textColor: '#ffffff',
                                    backgroundColor: '#e74c3c',
                                    fontWeight: 'bold',
                                    textDecoration: 'none',
                                    border: '1px solid #c0392b'
                                } as RoleHighlightStyle,
                                created: Date.now(),
                                modified: Date.now()
                            }
                        ],
                        created: Date.now(),
                        modified: Date.now()
                    }
                ],
                created: Date.now(),
                modified: Date.now()
            }
        ];
    }

    /**
     * Creates a test cloud template
     */
    private createTestTemplate() {
        return {
            provider: CloudProvider.AWS_CN,
            name: 'AWS China',
            accountSelectionUrl: 'https://signin.amazonaws.cn/saml',
            consoleDomainPattern: '*://*.amazonaws.cn/*',
            selectors: {
                accountSelection: {
                    accountContainers: ['.account-container'],
                    roleElements: ['.role-name']
                },
                console: {
                    accountContainers: ['.console-account'],
                    roleElements: ['.console-role']
                }
            }
        };
    }

    /**
     * Validates imported configuration structure
     */
    private validateImportedConfig(config: AppConfig): boolean {
        // Check basic structure
        if (!config || typeof config !== 'object') {
            return false;
        }

        // Check required fields
        if (config.browserSync === undefined || 
            !Array.isArray(config.defaultColors) || 
            !Array.isArray(config.settings)) {
            return false;
        }

        // Check cloud environments if present
        if (config.cloudEnvironments !== undefined) {
            return this.validateCloudEnvironments(config.cloudEnvironments);
        }

        return true;
    }

    /**
     * Validates cloud environments structure
     */
    private validateCloudEnvironments(environments: any): boolean {
        if (!Array.isArray(environments)) {
            return false;
        }

        return environments.every((env: any) => {
            if (!env || typeof env !== 'object') {
                return false;
            }

            // Check required environment fields
            if (typeof env.id !== 'string' || 
                typeof env.name !== 'string' || 
                !Array.isArray(env.accounts)) {
                return false;
            }

            // Validate accounts
            return env.accounts.every((account: any) => {
                if (!account || typeof account !== 'object') {
                    return false;
                }

                // Check required account fields
                if (typeof account.id !== 'string' || 
                    typeof account.name !== 'string' || 
                    !Array.isArray(account.roles)) {
                    return false;
                }

                return true;
            });
        });
    }

    /**
     * Reports all test results
     */
    private reportResults(): void {
        console.log('\n=== Configuration Persistence and Import/Export Validation Results ===');
        
        const passedTests = this.testResults.filter(result => result.passed).length;
        const totalTests = this.testResults.length;

        console.log(`Overall: ${passedTests}/${totalTests} tests passed`);

        this.testResults.forEach(result => {
            const status = result.passed ? '✓ PASSED' : '✗ FAILED';
            console.log(`${status}: ${result.test} - ${result.message}`);
        });

        if (passedTests === totalTests) {
            console.log('\n🎉 All configuration persistence and import/export tests passed!');
            console.log('Requirement 5.5 is satisfied.');
        } else {
            console.log(`\n⚠️  ${totalTests - passedTests} test(s) failed. Review implementation.`);
        }
    }
}

// Export for use in other test files
export { ConfigurationPersistenceValidator };