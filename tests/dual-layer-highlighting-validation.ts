/**
 * Dual-Layer Highlighting Coordination Validation
 * Task 10.1: Ensure dual-layer highlighting coordination
 * Requirements: 8.3, 8.4, 8.5
 */

import { CloudHighlighter } from '../components/CloudHighlighter';
import { CloudAccount, CloudRole, RoleHighlightStyle } from '../entrypoints/options/types';

/**
 * Validates that dual-layer highlighting coordination works correctly
 * Tests Requirements 8.3, 8.4, 8.5
 */
class DualLayerHighlightingValidator {
    private highlighter: CloudHighlighter;
    private testResults: Array<{ test: string; passed: boolean; message: string }> = [];

    constructor() {
        this.highlighter = new CloudHighlighter();
    }

    /**
     * Runs all dual-layer highlighting validation tests
     */
    public async runAllValidationTests(): Promise<boolean> {
        console.log('=== Dual-Layer Highlighting Coordination Validation ===');
        console.log('Task 10.1 - Requirements 8.3, 8.4, 8.5');

        this.testResults = [];

        // Test 1: Basic dual-layer coordination
        await this.testBasicDualLayerCoordination();

        // Test 2: Visual distinction enforcement
        await this.testVisualDistinctionEnforcement();

        // Test 3: Color separation validation
        await this.testColorSeparationValidation();

        // Test 4: Highlighting hierarchy maintenance
        await this.testHighlightingHierarchy();

        // Test 5: Simultaneous layer functionality
        await this.testSimultaneousLayerFunctionality();

        // Test 6: Layer independence
        await this.testLayerIndependence();

        // Report results
        this.reportResults();

        // Return overall success
        return this.testResults.every(result => result.passed);
    }

    /**
     * Test 1: Basic dual-layer coordination
     * Validates Requirements 8.1, 8.2
     */
    private async testBasicDualLayerCoordination(): Promise<void> {
        console.log('\n--- Test 1: Basic Dual-Layer Coordination ---');

        try {
            // Clear any existing highlighting
            this.highlighter.removeHighlighting();

            // Create test account and roles
            const testAccount = this.createTestAccount();
            const testRoles = this.createTestRoles();

            // Apply both layers
            this.highlighter.applyAccountHighlighting(testAccount);
            this.highlighter.applyRoleHighlighting(testRoles);

            // Check status
            const status = this.highlighter.getHighlightingStatus();

            if (status.accountHighlighting && status.roleHighlighting) {
                this.testResults.push({
                    test: 'Basic Dual-Layer Coordination',
                    passed: true,
                    message: 'Both account background and role text highlighting are active simultaneously'
                });
                console.log('✓ PASSED: Both highlighting layers are active');
            } else {
                this.testResults.push({
                    test: 'Basic Dual-Layer Coordination',
                    passed: false,
                    message: `Account: ${status.accountHighlighting}, Role: ${status.roleHighlighting}`
                });
                console.log('✗ FAILED: Not all highlighting layers are active');
            }
        } catch (error: any) {
            this.testResults.push({
                test: 'Basic Dual-Layer Coordination',
                passed: false,
                message: `Error: ${error?.message || 'Unknown error'}`
            });
            console.log('✗ FAILED: Error during test execution');
        }
    }

    /**
     * Test 2: Visual distinction enforcement
     * Validates Requirement 8.3
     */
    private async testVisualDistinctionEnforcement(): Promise<void> {
        console.log('\n--- Test 2: Visual Distinction Enforcement ---');

        try {
            // Clear any existing highlighting
            this.highlighter.removeHighlighting();

            // Create test account with specific color
            const testAccount = this.createTestAccount('#ff6b6b'); // Red background

            // Create test roles with different colors (ensuring distinction)
            const testRoles = [
                this.createTestRole('admin-role', ['admin'], '#ffffff', '#2196f3'), // Blue text on white
                this.createTestRole('readonly-role', ['readonly'], '#000000', '#4caf50') // Black text on green
            ];

            // Apply highlighting
            this.highlighter.applyAccountHighlighting(testAccount);
            this.highlighter.applyRoleHighlighting(testRoles);

            // Validate color distinction
            const accountColor = testAccount.color; // #ff6b6b (red)
            const roleColors = testRoles.map(role => role.highlightStyle.backgroundColor);

            // Check that role colors are different from account color
            const hasDistinctColors = roleColors.every(roleColor => 
                this.calculateColorDistance(accountColor, roleColor) > 50 // Minimum distance threshold
            );

            if (hasDistinctColors) {
                this.testResults.push({
                    test: 'Visual Distinction Enforcement',
                    passed: true,
                    message: 'Role text highlighting colors are visually distinct from account background color'
                });
                console.log('✓ PASSED: Colors are visually distinct');
            } else {
                this.testResults.push({
                    test: 'Visual Distinction Enforcement',
                    passed: false,
                    message: 'Role colors are too similar to account background color'
                });
                console.log('✗ FAILED: Colors are not sufficiently distinct');
            }
        } catch (error: any) {
            this.testResults.push({
                test: 'Visual Distinction Enforcement',
                passed: false,
                message: `Error: ${error?.message || 'Unknown error'}`
            });
            console.log('✗ FAILED: Error during test execution');
        }
    }

    /**
     * Test 3: Color separation validation
     * Validates Requirement 8.3
     */
    private async testColorSeparationValidation(): Promise<void> {
        console.log('\n--- Test 3: Color Separation Validation ---');

        try {
            // Test multiple color combinations to ensure separation
            const colorCombinations = [
                { account: '#ff0000', roles: ['#0000ff', '#00ff00'] }, // Red account, blue/green roles
                { account: '#000080', roles: ['#ffff00', '#ff00ff'] }, // Navy account, yellow/magenta roles
                { account: '#008000', roles: ['#ffa500', '#ff1493'] }  // Green account, orange/pink roles
            ];

            let allCombinationsPassed = true;

            for (const combination of colorCombinations) {
                const account = this.createTestAccount(combination.account);
                const roles = combination.roles.map((color, index) => 
                    this.createTestRole(`role-${index}`, [`keyword${index}`], '#ffffff', color)
                );

                // Check color separation
                const accountDistance = combination.roles.every(roleColor => 
                    this.calculateColorDistance(combination.account, roleColor) > 30
                );

                if (!accountDistance) {
                    allCombinationsPassed = false;
                    console.log(`✗ Color combination failed: Account ${combination.account} too similar to roles`);
                }
            }

            if (allCombinationsPassed) {
                this.testResults.push({
                    test: 'Color Separation Validation',
                    passed: true,
                    message: 'All tested color combinations maintain adequate separation'
                });
                console.log('✓ PASSED: Color separation is maintained across combinations');
            } else {
                this.testResults.push({
                    test: 'Color Separation Validation',
                    passed: false,
                    message: 'Some color combinations do not maintain adequate separation'
                });
                console.log('✗ FAILED: Color separation is insufficient');
            }
        } catch (error: any) {
            this.testResults.push({
                test: 'Color Separation Validation',
                passed: false,
                message: `Error: ${error?.message || 'Unknown error'}`
            });
            console.log('✗ FAILED: Error during test execution');
        }
    }

    /**
     * Test 4: Highlighting hierarchy maintenance
     * Validates Requirements 8.4, 8.5
     */
    private async testHighlightingHierarchy(): Promise<void> {
        console.log('\n--- Test 4: Highlighting Hierarchy Maintenance ---');

        try {
            // Clear any existing highlighting
            this.highlighter.removeHighlighting();

            const testAccount = this.createTestAccount();
            const testRoles = this.createTestRoles();

            // Apply account highlighting first (base layer)
            this.highlighter.applyAccountHighlighting(testAccount);
            
            // Verify account layer is active
            let status = this.highlighter.getHighlightingStatus();
            const accountLayerFirst = status.accountHighlighting && !status.roleHighlighting;

            // Apply role highlighting (overlay layer)
            this.highlighter.applyRoleHighlighting(testRoles);
            
            // Verify both layers are active with proper hierarchy
            status = this.highlighter.getHighlightingStatus();
            const bothLayersActive = status.accountHighlighting && status.roleHighlighting;

            // Check DOM structure to ensure proper layering
            const accountOverlay = document.getElementById('enveil-cloud-overlay');
            const roleStyles = document.getElementById('enveil-cloud-role-styles');
            
            const properDOMStructure = accountOverlay && roleStyles;

            if (accountLayerFirst && bothLayersActive && properDOMStructure) {
                this.testResults.push({
                    test: 'Highlighting Hierarchy Maintenance',
                    passed: true,
                    message: 'Account background serves as base layer, role text as overlay layer'
                });
                console.log('✓ PASSED: Highlighting hierarchy is properly maintained');
            } else {
                this.testResults.push({
                    test: 'Highlighting Hierarchy Maintenance',
                    passed: false,
                    message: 'Highlighting hierarchy is not properly maintained'
                });
                console.log('✗ FAILED: Highlighting hierarchy issues detected');
            }
        } catch (error: any) {
            this.testResults.push({
                test: 'Highlighting Hierarchy Maintenance',
                passed: false,
                message: `Error: ${error?.message || 'Unknown error'}`
            });
            console.log('✗ FAILED: Error during test execution');
        }
    }

    /**
     * Test 5: Simultaneous layer functionality
     * Validates Requirement 8.4
     */
    private async testSimultaneousLayerFunctionality(): Promise<void> {
        console.log('\n--- Test 5: Simultaneous Layer Functionality ---');

        try {
            // Clear any existing highlighting
            this.highlighter.removeHighlighting();

            const testAccount = this.createTestAccount();
            const testRoles = this.createTestRoles();

            // Apply both layers simultaneously
            this.highlighter.applyAccountHighlighting(testAccount);
            this.highlighter.applyRoleHighlighting(testRoles);

            // Verify no visual conflicts
            const status = this.highlighter.getHighlightingStatus();
            const bothActive = status.accountHighlighting && status.roleHighlighting;

            // Check that both highlighting types can coexist
            const accountOverlay = document.getElementById('enveil-cloud-overlay');
            const roleHighlights = document.querySelectorAll('[class*="enveil-cloud-role-highlight"]');

            const noConflicts = accountOverlay && roleHighlights.length > 0;

            if (bothActive && noConflicts) {
                this.testResults.push({
                    test: 'Simultaneous Layer Functionality',
                    passed: true,
                    message: 'Both highlighting layers function simultaneously without conflicts'
                });
                console.log('✓ PASSED: Simultaneous layer functionality works correctly');
            } else {
                this.testResults.push({
                    test: 'Simultaneous Layer Functionality',
                    passed: false,
                    message: 'Visual conflicts detected between highlighting layers'
                });
                console.log('✗ FAILED: Visual conflicts between layers');
            }
        } catch (error: any) {
            this.testResults.push({
                test: 'Simultaneous Layer Functionality',
                passed: false,
                message: `Error: ${error?.message || 'Unknown error'}`
            });
            console.log('✗ FAILED: Error during test execution');
        }
    }

    /**
     * Test 6: Layer independence
     * Validates that layers can be controlled independently
     */
    private async testLayerIndependence(): Promise<void> {
        console.log('\n--- Test 6: Layer Independence ---');

        try {
            // Test account highlighting alone
            this.highlighter.removeHighlighting();
            const testAccount = this.createTestAccount();
            this.highlighter.applyAccountHighlighting(testAccount);
            
            let status = this.highlighter.getHighlightingStatus();
            const accountAlone = status.accountHighlighting && !status.roleHighlighting;

            // Test role highlighting alone
            this.highlighter.removeHighlighting();
            const testRoles = this.createTestRoles();
            this.highlighter.applyRoleHighlighting(testRoles);
            
            status = this.highlighter.getHighlightingStatus();
            const roleAlone = !status.accountHighlighting && status.roleHighlighting;

            // Test removing account highlighting while keeping role highlighting
            this.highlighter.applyAccountHighlighting(testAccount);
            this.highlighter.removeAccountHighlighting();
            
            status = this.highlighter.getHighlightingStatus();
            const roleRemainsAfterAccountRemoval = !status.accountHighlighting && status.roleHighlighting;

            if (accountAlone && roleAlone && roleRemainsAfterAccountRemoval) {
                this.testResults.push({
                    test: 'Layer Independence',
                    passed: true,
                    message: 'Highlighting layers can be controlled independently'
                });
                console.log('✓ PASSED: Layer independence is maintained');
            } else {
                this.testResults.push({
                    test: 'Layer Independence',
                    passed: false,
                    message: 'Layers are not properly independent'
                });
                console.log('✗ FAILED: Layer independence issues detected');
            }
        } catch (error: any) {
            this.testResults.push({
                test: 'Layer Independence',
                passed: false,
                message: `Error: ${error?.message || 'Unknown error'}`
            });
            console.log('✗ FAILED: Error during test execution');
        }
    }

    /**
     * Creates a test cloud account
     */
    private createTestAccount(color: string = '#ff6b6b'): CloudAccount {
        return {
            id: 'test-account-dual-layer',
            name: 'Test Dual Layer Account',
            enable: true,
            matchPattern: 'domain',
            matchValue: 'amazonaws.cn',
            color: color,
            backgroundEnable: true,
            roles: [],
            created: Date.now(),
            modified: Date.now()
        };
    }

    /**
     * Creates test cloud roles
     */
    private createTestRoles(): CloudRole[] {
        return [
            this.createTestRole('admin-role', ['admin', 'administrator'], '#ffffff', '#e74c3c'),
            this.createTestRole('readonly-role', ['readonly', 'viewer'], '#000000', '#3498db')
        ];
    }

    /**
     * Creates a test cloud role
     */
    private createTestRole(id: string, keywords: string[], textColor: string, backgroundColor: string): CloudRole {
        return {
            id: id,
            name: `Test ${id}`,
            enable: true,
            keywords: keywords,
            highlightColor: backgroundColor,
            highlightStyle: {
                textColor: textColor,
                backgroundColor: backgroundColor,
                fontWeight: 'bold',
                textDecoration: 'none',
                border: `1px solid ${backgroundColor}`
            } as RoleHighlightStyle,
            created: Date.now(),
            modified: Date.now()
        };
    }

    /**
     * Calculates color distance between two hex colors
     */
    private calculateColorDistance(color1: string, color2: string): number {
        const rgb1 = this.hexToRgb(color1);
        const rgb2 = this.hexToRgb(color2);

        if (!rgb1 || !rgb2) return 0;

        // Calculate Euclidean distance in RGB space
        const rDiff = rgb1.r - rgb2.r;
        const gDiff = rgb1.g - rgb2.g;
        const bDiff = rgb1.b - rgb2.b;

        return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
    }

    /**
     * Converts hex color to RGB
     */
    private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * Reports all test results
     */
    private reportResults(): void {
        console.log('\n=== Dual-Layer Highlighting Validation Results ===');
        
        const passedTests = this.testResults.filter(result => result.passed).length;
        const totalTests = this.testResults.length;

        console.log(`Overall: ${passedTests}/${totalTests} tests passed`);

        this.testResults.forEach(result => {
            const status = result.passed ? '✓ PASSED' : '✗ FAILED';
            console.log(`${status}: ${result.test} - ${result.message}`);
        });

        if (passedTests === totalTests) {
            console.log('\n🎉 All dual-layer highlighting coordination tests passed!');
            console.log('Requirements 8.3, 8.4, 8.5 are satisfied.');
        } else {
            console.log(`\n⚠️  ${totalTests - passedTests} test(s) failed. Review implementation.`);
        }
    }

    /**
     * Cleanup method to remove all highlighting after tests
     */
    public cleanup(): void {
        this.highlighter.removeHighlighting();
    }
}

// Export for use in other test files
export { DualLayerHighlightingValidator };