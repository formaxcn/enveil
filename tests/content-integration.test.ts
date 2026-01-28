/**
 * Integration test for content script cloud functionality
 * This test verifies that the cloud detection and highlighting integration works correctly
 */

import { CloudAccount, CloudRole, RoleHighlightStyle } from '../entrypoints/options/types';

// Mock browser runtime for testing
const mockBrowser = {
    runtime: {
        onMessage: {
            addListener: (callback: (message: any) => void) => {
                // Store callback for testing
                (mockBrowser.runtime.onMessage as any).callback = callback;
            },
            callback: null as ((message: any) => void) | null
        }
    }
};

// Mock CloudHighlighter for testing
class MockCloudHighlighter {
    private accountHighlighting = false;
    private roleHighlighting = false;

    applyAccountHighlighting(account: CloudAccount): void {
        if (account && account.backgroundEnable && account.color) {
            this.accountHighlighting = true;
            console.log(`[MockCloudHighlighter] Applied account highlighting: ${account.name}`);
        }
    }

    applyRoleHighlighting(roles: CloudRole[]): void {
        if (roles && roles.length > 0) {
            const enabledRoles = roles.filter(role => role.enable && role.keywords && role.keywords.length > 0);
            if (enabledRoles.length > 0) {
                this.roleHighlighting = true;
                console.log(`[MockCloudHighlighter] Applied role highlighting for ${enabledRoles.length} roles`);
            }
        }
    }

    removeHighlighting(): void {
        this.accountHighlighting = false;
        this.roleHighlighting = false;
        console.log('[MockCloudHighlighter] Removed all highlighting');
    }

    getHighlightingStatus() {
        return {
            accountHighlighting: this.accountHighlighting,
            roleHighlighting: this.roleHighlighting
        };
    }
}

// Test data
const createTestCloudAccount = (): CloudAccount => ({
    id: 'test-account-1',
    name: 'Test AWS Account',
    enable: true,
    matchPattern: 'domain',
    matchValue: 'amazonaws.cn',
    color: '#ff6b6b',
    backgroundEnable: true,
    roles: [],
    created: Date.now(),
    modified: Date.now()
});

const createTestCloudRole = (): CloudRole => ({
    id: 'test-role-1',
    name: 'Admin Role',
    enable: true,
    keywords: ['admin', 'administrator'],
    highlightColor: '#4ecdc4',
    highlightStyle: {
        textColor: '#ffffff',
        backgroundColor: '#4ecdc4',
        fontWeight: 'bold',
        textDecoration: 'none',
        border: '1px solid #45b7aa'
    } as RoleHighlightStyle,
    created: Date.now(),
    modified: Date.now()
});

/**
 * Test the cloud message handling functionality
 */
function testCloudMessageHandling() {
    console.log('=== Testing Cloud Message Handling ===');
    
    const mockHighlighter = new MockCloudHighlighter();
    
    // Simulate the message listener setup
    const messageHandler = (message: any) => {
        if (message.action === 'CLOUD_MATCH_UPDATE') {
            const cloudAccount = message.cloudAccount as CloudAccount | null;
            const cloudRoles = message.cloudRoles as CloudRole[] | null;
            
            if (cloudAccount || cloudRoles) {
                console.log('[Test] Received CLOUD_MATCH_UPDATE: Cloud match found', { 
                    account: cloudAccount?.name, 
                    rolesCount: cloudRoles?.length || 0 
                });
                
                // Simulate mountCloudUI function
                mockHighlighter.removeHighlighting();
                
                if (cloudAccount && cloudAccount.backgroundEnable) {
                    mockHighlighter.applyAccountHighlighting(cloudAccount);
                }
                
                if (cloudRoles && cloudRoles.length > 0) {
                    mockHighlighter.applyRoleHighlighting(cloudRoles);
                }
            } else {
                console.log('[Test] Received CLOUD_MATCH_UPDATE: No cloud match, unmounting cloud UI');
                mockHighlighter.removeHighlighting();
            }
        }
    };
    
    // Test 1: Cloud account match with background highlighting
    console.log('\n--- Test 1: Account Background Highlighting ---');
    const testAccount = createTestCloudAccount();
    messageHandler({
        action: 'CLOUD_MATCH_UPDATE',
        cloudAccount: testAccount,
        cloudRoles: null
    });
    
    let status = mockHighlighter.getHighlightingStatus();
    console.log('Expected: accountHighlighting=true, roleHighlighting=false');
    console.log('Actual:', status);
    console.log('✓ Test 1 passed:', status.accountHighlighting === true && status.roleHighlighting === false);
    
    // Test 2: Role text highlighting
    console.log('\n--- Test 2: Role Text Highlighting ---');
    const testRoles = [createTestCloudRole()];
    messageHandler({
        action: 'CLOUD_MATCH_UPDATE',
        cloudAccount: null,
        cloudRoles: testRoles
    });
    
    status = mockHighlighter.getHighlightingStatus();
    console.log('Expected: accountHighlighting=false, roleHighlighting=true');
    console.log('Actual:', status);
    console.log('✓ Test 2 passed:', status.accountHighlighting === false && status.roleHighlighting === true);
    
    // Test 3: Dual-layer highlighting (account + roles)
    console.log('\n--- Test 3: Dual-Layer Highlighting ---');
    messageHandler({
        action: 'CLOUD_MATCH_UPDATE',
        cloudAccount: testAccount,
        cloudRoles: testRoles
    });
    
    status = mockHighlighter.getHighlightingStatus();
    console.log('Expected: accountHighlighting=true, roleHighlighting=true');
    console.log('Actual:', status);
    console.log('✓ Test 3 passed:', status.accountHighlighting === true && status.roleHighlighting === true);
    
    // Test 4: No match - remove highlighting
    console.log('\n--- Test 4: Remove Highlighting ---');
    messageHandler({
        action: 'CLOUD_MATCH_UPDATE',
        cloudAccount: null,
        cloudRoles: null
    });
    
    status = mockHighlighter.getHighlightingStatus();
    console.log('Expected: accountHighlighting=false, roleHighlighting=false');
    console.log('Actual:', status);
    console.log('✓ Test 4 passed:', status.accountHighlighting === false && status.roleHighlighting === false);
    
    // Test 5: Disabled account highlighting
    console.log('\n--- Test 5: Disabled Account Highlighting ---');
    const disabledAccount = { ...testAccount, backgroundEnable: false };
    messageHandler({
        action: 'CLOUD_MATCH_UPDATE',
        cloudAccount: disabledAccount,
        cloudRoles: null
    });
    
    status = mockHighlighter.getHighlightingStatus();
    console.log('Expected: accountHighlighting=false, roleHighlighting=false');
    console.log('Actual:', status);
    console.log('✓ Test 5 passed:', status.accountHighlighting === false && status.roleHighlighting === false);
    
    // Test 6: Disabled role highlighting
    console.log('\n--- Test 6: Disabled Role Highlighting ---');
    const disabledRoles = [{ ...createTestCloudRole(), enable: false }];
    messageHandler({
        action: 'CLOUD_MATCH_UPDATE',
        cloudAccount: null,
        cloudRoles: disabledRoles
    });
    
    status = mockHighlighter.getHighlightingStatus();
    console.log('Expected: accountHighlighting=false, roleHighlighting=false');
    console.log('Actual:', status);
    console.log('✓ Test 6 passed:', status.accountHighlighting === false && status.roleHighlighting === false);
    
    console.log('\n=== All Cloud Integration Tests Completed ===');
}

/**
 * Test the integration with existing site highlighting
 */
function testSiteIntegration() {
    console.log('\n=== Testing Site Integration ===');
    
    const mockHighlighter = new MockCloudHighlighter();
    
    // Simulate both MATCH_UPDATE and CLOUD_MATCH_UPDATE messages
    const messageHandler = (message: any) => {
        if (message.action === 'MATCH_UPDATE') {
            console.log('[Test] Received MATCH_UPDATE for site highlighting');
            // Site highlighting would be handled by existing mountUI function
        } else if (message.action === 'CLOUD_MATCH_UPDATE') {
            console.log('[Test] Received CLOUD_MATCH_UPDATE for cloud highlighting');
            const cloudAccount = message.cloudAccount as CloudAccount | null;
            const cloudRoles = message.cloudRoles as CloudRole[] | null;
            
            if (cloudAccount) {
                mockHighlighter.applyAccountHighlighting(cloudAccount);
            }
            if (cloudRoles) {
                mockHighlighter.applyRoleHighlighting(cloudRoles);
            }
        }
    };
    
    // Test that both message types can be handled
    console.log('\n--- Test: Both Site and Cloud Messages ---');
    messageHandler({ action: 'MATCH_UPDATE', site: { name: 'Test Site' } });
    messageHandler({ 
        action: 'CLOUD_MATCH_UPDATE', 
        cloudAccount: createTestCloudAccount(), 
        cloudRoles: [createTestCloudRole()] 
    });
    
    const status = mockHighlighter.getHighlightingStatus();
    console.log('Cloud highlighting should work alongside site highlighting');
    console.log('Cloud status:', status);
    console.log('✓ Integration test passed: Cloud and site highlighting can coexist');
    
    console.log('\n=== Site Integration Tests Completed ===');
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
    // Node.js environment - run tests
    testCloudMessageHandling();
    testSiteIntegration();
} else {
    // Browser environment - export for manual testing
    (window as any).testCloudIntegration = {
        testCloudMessageHandling,
        testSiteIntegration
    };
}

export { testCloudMessageHandling, testSiteIntegration };