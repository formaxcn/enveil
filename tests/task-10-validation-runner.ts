/**
 * Task 10 Validation Runner
 * Runs all validation tests for Task 10: Final integration and consistency checks
 * 
 * Task 10.1: Ensure dual-layer highlighting coordination (Requirements 8.3, 8.4, 8.5)
 * Task 10.2: Validate configuration persistence and import/export (Requirement 5.5)
 */

import { DualLayerHighlightingValidator } from './dual-layer-highlighting-validation';
import { ConfigurationPersistenceValidator } from './config-persistence-test';

/**
 * Main validation runner for Task 10
 */
class Task10ValidationRunner {
    private dualLayerValidator: DualLayerHighlightingValidator;
    private configPersistenceValidator: ConfigurationPersistenceValidator;

    constructor() {
        this.dualLayerValidator = new DualLayerHighlightingValidator();
        this.configPersistenceValidator = new ConfigurationPersistenceValidator();
    }

    /**
     * Runs all Task 10 validation tests
     */
    public async runAllValidations(): Promise<boolean> {
        console.log('🚀 Starting Task 10 Validation Suite');
        console.log('=====================================');
        console.log('Task 10: Final integration and consistency checks');
        console.log('- 10.1: Ensure dual-layer highlighting coordination');
        console.log('- 10.2: Validate configuration persistence and import/export');
        console.log('');

        let allTestsPassed = true;

        // Run Task 10.1 validation
        console.log('📋 Running Task 10.1 Validation: Dual-Layer Highlighting Coordination');
        console.log('Requirements: 8.3, 8.4, 8.5');
        console.log('─'.repeat(80));

        try {
            const dualLayerPassed = await this.dualLayerValidator.runAllValidationTests();
            if (!dualLayerPassed) {
                allTestsPassed = false;
            }
        } catch (error: any) {
            console.log(`❌ Task 10.1 validation failed with error: ${error?.message || 'Unknown error'}`);
            allTestsPassed = false;
        } finally {
            // Cleanup highlighting after tests
            this.dualLayerValidator.cleanup();
        }

        console.log('\n' + '─'.repeat(80));

        // Run Task 10.2 validation
        console.log('📋 Running Task 10.2 Validation: Configuration Persistence and Import/Export');
        console.log('Requirements: 5.5');
        console.log('─'.repeat(80));

        try {
            const configPersistencePassed = await this.configPersistenceValidator.runAllValidationTests();
            if (!configPersistencePassed) {
                allTestsPassed = false;
            }
        } catch (error: any) {
            console.log(`❌ Task 10.2 validation failed with error: ${error?.message || 'Unknown error'}`);
            allTestsPassed = false;
        }

        // Final results
        console.log('\n' + '='.repeat(80));
        console.log('📊 Task 10 Validation Results');
        console.log('='.repeat(80));

        if (allTestsPassed) {
            console.log('🎉 ALL TASK 10 VALIDATIONS PASSED!');
            console.log('');
            console.log('✅ Task 10.1: Dual-layer highlighting coordination is working correctly');
            console.log('   - Requirements 8.3, 8.4, 8.5 are satisfied');
            console.log('   - Account background and role text highlighting coordinate properly');
            console.log('   - Visual distinction and hierarchy are maintained');
            console.log('');
            console.log('✅ Task 10.2: Configuration persistence and import/export is working correctly');
            console.log('   - Requirement 5.5 is satisfied');
            console.log('   - Cloud configurations are properly saved, loaded, and transferred');
            console.log('   - Import/export includes cloud environments with validation');
            console.log('');
            console.log('🏆 Task 10: Final integration and consistency checks - COMPLETED');
        } else {
            console.log('❌ SOME TASK 10 VALIDATIONS FAILED');
            console.log('');
            console.log('Please review the detailed test results above and address any issues.');
            console.log('Task 10 cannot be considered complete until all validations pass.');
        }

        console.log('='.repeat(80));

        return allTestsPassed;
    }

    /**
     * Runs validation for a specific subtask
     */
    public async runSubtaskValidation(subtask: '10.1' | '10.2'): Promise<boolean> {
        console.log(`🎯 Running Task ${subtask} Validation`);

        if (subtask === '10.1') {
            console.log('Dual-Layer Highlighting Coordination (Requirements 8.3, 8.4, 8.5)');
            try {
                const result = await this.dualLayerValidator.runAllValidationTests();
                this.dualLayerValidator.cleanup();
                return result;
            } catch (error: any) {
                console.log(`❌ Task 10.1 validation failed: ${error?.message || 'Unknown error'}`);
                return false;
            }
        } else if (subtask === '10.2') {
            console.log('Configuration Persistence and Import/Export (Requirement 5.5)');
            try {
                return await this.configPersistenceValidator.runAllValidationTests();
            } catch (error: any) {
                console.log(`❌ Task 10.2 validation failed: ${error?.message || 'Unknown error'}`);
                return false;
            }
        }

        return false;
    }
}

// Export for use in other files
export { Task10ValidationRunner };

// If running directly (for manual testing)
if (typeof window === 'undefined' && typeof process !== 'undefined') {
    // Node.js environment - can run tests directly
    const runner = new Task10ValidationRunner();
    
    // Check command line arguments
    const args = process.argv.slice(2);
    if (args.length > 0 && (args[0] === '10.1' || args[0] === '10.2')) {
        runner.runSubtaskValidation(args[0] as '10.1' | '10.2').then(result => {
            process.exit(result ? 0 : 1);
        });
    } else {
        runner.runAllValidations().then(result => {
            process.exit(result ? 0 : 1);
        });
    }
} else if (typeof window !== 'undefined') {
    // Browser environment - export for manual testing
    (window as any).Task10ValidationRunner = Task10ValidationRunner;
}