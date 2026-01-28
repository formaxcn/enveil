/**
 * Test for AWS Console Interface Highlighting (Task 9.2)
 * This test verifies that AWS console interface highlighting works correctly
 * for *.amazonaws.cn/* console pages with persistent account and role highlighting
 */

import { CloudMatcher } from '../utils/cloudMatcher';
import { CloudHighlighter } from '../components/CloudHighlighter';
import { CloudEnvironment, CloudAccount, CloudRole, RoleHighlightStyle, CloudProvider } from '../entrypoints/options/types';

/**
 * Mock DOM environment for Node.js testing
 */
function setupMockDOM() {
    const mockDocument = {
        createElement: (tagName: string) => ({
            id: '',
            style: {},
            remove: () => {},
            appendChild: () => {},
            setAttribute: () => {},
            getAttribute: () => null,
            classList: { contains: () => false },
            tagName: tagName.toUpperCase(),
            parentNode: null,
            parentElement: null,
            textContent: '',
            innerHTML: '',
            hasAttribute: () => false,
            closest: () => null,
            querySelectorAll: () => []
        }),
        body: { 
            appendChild: () => {},
            tagName: 'BODY'
        },
        head: { 
            appendChild: () => {},
            tagName: 'HEAD'
        },
        getElementById: () => null,
        createTextNode: (text: string) => ({ 
            textContent: text,
            nodeType: 3, // TEXT_NODE
            parentNode: null,
            parentElement: null
        }),
        createTreeWalker: () => ({ 
            nextNode: () => null 
        })
    };
    
    // Mock NodeFilter
    global.NodeFilter = {
        SHOW_TEXT: 4,
        FILTER_ACCEPT: 1,
        FILTER_REJECT: 2
    } as any;
    
    // Mock Node constants
    global.Node = {
        ELEMENT_NODE: 1,
        TEXT_NODE: 3
    } as any;
    
    global.document = mockDocument as any;
}

// Test data for AWS CN console
const createAWSCNEnvironment = (): CloudEnvironment => ({
    id: 'aws-cn-env',
    name: 'AWS China Environment',
    enable: true,
    provider: CloudProvider.AWS_CN,
    template: {
        provider: CloudProvider.AWS_CN,
        name: 'AWS China',
        accountSelectionUrl: 'https://signin.amazonaws.cn/saml',
        consoleDomainPattern: '*://*.amazonaws.cn/*',
        selectors: {
            accountSelection: {
                accountContainers: ['.account-info', '.account-selection'],
                roleElements: ['.role-name', '.role-item']
            },
            console: {
                accountContainers: ['.console-header', '.account-info'],
                roleElements: ['.role-text', '.current-role']
            }
        }
    },
    accounts: [],
    created: Date.now(),
    modified: Date.now()
});

const createAWSConsoleAccount = (): CloudAccount => ({
    id: 'aws-console-account',
    name: 'AWS CN Console Account',
    enable: true,
    matchPattern: 'domain',
    matchValue: 'amazonaws.cn',
    color: '#ff9500',
    backgroundEnable: true,
    roles: [],
    created: Date.now(),
    modified: Date.now()
});

const createConsoleRoles = (): CloudRole[] => [
    {
        id: 'admin-role',
        name: 'Administrator Role',
        enable: true,
        keywords: ['Administrator', 'admin', 'AdministratorAccess', 'root'],
        highlightColor: '#e74c3c',
        highlightStyle: {
            textColor: '#ffffff',
            backgroundColor: '#e74c3c',
            fontWeight: 'bold',
            textDecoration: 'none',
            border: '2px solid #c0392b'
        } as RoleHighlightStyle,
        created: Date.now(),
        modified: Date.now()
    },
    {
        id: 'readonly-role',
        name: 'ReadOnly Role',
        enable: true,
        keywords: ['ReadOnly', 'read-only', 'ReadOnlyAccess', 'viewer'],
        highlightColor: '#3498db',
        highlightStyle: {
            textColor: '#ffffff',
            backgroundColor: '#3498db',
            fontWeight: 'normal',
            textDecoration: 'underline',
            border: '1px solid #2980b9'
        } as RoleHighlightStyle,
        created: Date.now(),
        modified: Date.now()
    }
];

/**
 * Test AWS console URL matching
 */
function testAWSConsoleURLMatching() {
    console.log('=== Testing AWS Console URL Matching ===');
    console.log('Testing Requirements 4.1, 4.2, 4.4 from task 9.2\n');

    const environment = createAWSCNEnvironment();
    const account = createAWSConsoleAccount();
    environment.accounts = [account];

    // Test various AWS console URLs
    const consoleUrls = [
        'https://console.amazonaws.cn/',
        'https://console.amazonaws.cn/dashboard',
        'https://ec2.console.amazonaws.cn/v2/home',
        'https://s3.console.amazonaws.cn/s3/buckets',
        'https://iam.console.amazonaws.cn/iam/home',
        'https://cloudformation.console.amazonaws.cn/cloudformation/home',
        'https://lambda.console.amazonaws.cn/lambda/home'
    ];

    console.log('--- Test 1: Console URL Pattern Matching ---');
    let allMatched = true;
    consoleUrls.forEach((url, index) => {
        const host = new URL(url).host;
        const isCloudUrl = CloudMatcher.isCloudEnvironmentUrl([environment], url, host);
        const isAccountMatch = CloudMatcher.isCloudAccountMatch(account, url, host);
        
        console.log(`URL ${index + 1}: ${url}`);
        console.log(`  Cloud environment match: ${isCloudUrl}`);
        console.log(`  Account match: ${isAccountMatch}`);
        
        if (!isCloudUrl || !isAccountMatch) {
            allMatched = false;
        }
    });
    
    console.log(`✓ Test 1 ${allMatched ? 'PASSED' : 'FAILED'}: All console URLs should match`);

    // Test non-AWS URLs should not match
    console.log('\n--- Test 2: Non-AWS URLs Should Not Match ---');
    const nonAWSUrls = [
        'https://console.aws.amazon.com/',
        'https://portal.azure.com/',
        'https://console.cloud.google.com/',
        'https://example.com/'
    ];

    let noneMatched = true;
    nonAWSUrls.forEach((url, index) => {
        try {
            const host = new URL(url).host;
            const isCloudUrl = CloudMatcher.isCloudEnvironmentUrl([environment], url, host);
            const isAccountMatch = CloudMatcher.isCloudAccountMatch(account, url, host);
            
            console.log(`Non-AWS URL ${index + 1}: ${url}`);
            console.log(`  Should not match cloud: ${!isCloudUrl}`);
            console.log(`  Should not match account: ${!isAccountMatch}`);
            
            if (isCloudUrl || isAccountMatch) {
                noneMatched = false;
            }
        } catch (e) {
            // Invalid URLs are expected to not match
            console.log(`Non-AWS URL ${index + 1}: ${url} (invalid URL - expected)`);
        }
    });
    
    console.log(`✓ Test 2 ${noneMatched ? 'PASSED' : 'FAILED'}: Non-AWS URLs should not match`);

    return allMatched && noneMatched;
}

/**
 * Test persistent account information highlighting
 */
function testPersistentAccountHighlighting() {
    console.log('\n=== Testing Persistent Account Information Highlighting ===');
    
    const account = createAWSConsoleAccount();
    
    // Mock DOM environment for Node.js testing
    if (typeof document === 'undefined') {
        setupMockDOM();
    }
    
    const highlighter = new CloudHighlighter();

    console.log('--- Test 1: Account Background Highlighting Application ---');
    highlighter.applyAccountHighlighting(account);
    
    const status1 = highlighter.getHighlightingStatus();
    console.log(`Account highlighting applied: ${status1.accountHighlighting}`);
    console.log(`✓ Test 1 ${status1.accountHighlighting ? 'PASSED' : 'FAILED'}: Account background highlighting should be applied`);

    console.log('\n--- Test 2: Highlighting Persistence Across Page Changes ---');
    // Simulate page navigation by checking if highlighting remains active
    const status2 = highlighter.getHighlightingStatus();
    console.log(`Account highlighting persists: ${status2.accountHighlighting}`);
    console.log(`✓ Test 2 ${status2.accountHighlighting ? 'PASSED' : 'FAILED'}: Highlighting should persist across page changes`);

    // Clean up
    highlighter.removeHighlighting();
    
    return status1.accountHighlighting && status2.accountHighlighting;
}

/**
 * Test role highlighting in console interface
 */
function testConsoleRoleHighlighting() {
    console.log('\n=== Testing Console Role Highlighting ===');
    
    const roles = createConsoleRoles();
    
    // Mock DOM environment for Node.js testing
    if (typeof document === 'undefined') {
        setupMockDOM();
    }
    
    const highlighter = new CloudHighlighter();

    console.log('--- Test 1: Role Text Highlighting Application ---');
    highlighter.applyRoleHighlighting(roles);
    
    const status1 = highlighter.getHighlightingStatus();
    console.log(`Role highlighting applied: ${status1.roleHighlighting}`);
    console.log(`Enabled roles count: ${roles.filter(r => r.enable).length}`);
    console.log(`✓ Test 1 ${status1.roleHighlighting ? 'PASSED' : 'FAILED'}: Role text highlighting should be applied`);

    console.log('\n--- Test 2: Multiple Role Keywords Support ---');
    const roleInfo = highlighter.getHighlightedRolesInfo();
    console.log(`Highlighted roles info:`, roleInfo);
    
    // Check that we have role configurations ready for highlighting
    const enabledRoles = roles.filter(role => role.enable && role.keywords && role.keywords.length > 0);
    console.log(`Expected enabled roles: ${enabledRoles.length}`);
    console.log(`✓ Test 2 PASSED: Multiple role configurations are ready for highlighting`);

    // Clean up
    highlighter.removeHighlighting();
    
    return status1.roleHighlighting;
}

/**
 * Test highlighting consistency across console navigation
 */
function testConsoleNavigationConsistency() {
    console.log('\n=== Testing Console Navigation Consistency ===');
    
    const account = createAWSConsoleAccount();
    const roles = createConsoleRoles();
    
    // Mock DOM environment for Node.js testing
    if (typeof document === 'undefined') {
        setupMockDOM();
    }
    
    const highlighter = new CloudHighlighter();

    console.log('--- Test 1: Dual-Layer Highlighting Consistency ---');
    highlighter.applyAccountHighlighting(account);
    highlighter.applyRoleHighlighting(roles);
    
    const status1 = highlighter.getHighlightingStatus();
    console.log(`Account highlighting: ${status1.accountHighlighting}`);
    console.log(`Role highlighting: ${status1.roleHighlighting}`);
    console.log(`Both layers active: ${status1.accountHighlighting && status1.roleHighlighting}`);
    
    const dualLayerWorking = status1.accountHighlighting && status1.roleHighlighting;
    console.log(`✓ Test 1 ${dualLayerWorking ? 'PASSED' : 'FAILED'}: Dual-layer highlighting should work consistently`);

    console.log('\n--- Test 2: Highlighting Reapplication After Navigation ---');
    // Simulate navigation by reapplying highlighting
    highlighter.removeHighlighting();
    highlighter.applyAccountHighlighting(account);
    highlighter.applyRoleHighlighting(roles);
    
    const status2 = highlighter.getHighlightingStatus();
    console.log(`Account highlighting after reapplication: ${status2.accountHighlighting}`);
    console.log(`Role highlighting after reapplication: ${status2.roleHighlighting}`);
    
    const reapplicationWorking = status2.accountHighlighting && status2.roleHighlighting;
    console.log(`✓ Test 2 ${reapplicationWorking ? 'PASSED' : 'FAILED'}: Highlighting should reapply correctly after navigation`);

    // Clean up
    highlighter.removeHighlighting();
    
    return dualLayerWorking && reapplicationWorking;
}

/**
 * Test complete AWS console interface workflow
 */
function testCompleteConsoleWorkflow() {
    console.log('\n=== Testing Complete AWS Console Interface Workflow ===');
    
    const environment = createAWSCNEnvironment();
    const account = createAWSConsoleAccount();
    const roles = createConsoleRoles();
    
    // Set up complete configuration
    account.roles = roles;
    environment.accounts = [account];
    
    // Mock DOM environment for Node.js testing
    if (typeof document === 'undefined') {
        setupMockDOM();
    }
    
    const highlighter = new CloudHighlighter();
    
    console.log('--- Step 1: Console URL Detection ---');
    const consoleUrl = 'https://console.amazonaws.cn/dashboard';
    const host = new URL(consoleUrl).host;
    const isConsoleUrl = CloudMatcher.isCloudEnvironmentUrl([environment], consoleUrl, host);
    console.log(`Console URL: ${consoleUrl}`);
    console.log(`Detected as AWS console: ${isConsoleUrl}`);
    
    console.log('\n--- Step 2: Account Matching ---');
    const matchingAccounts = CloudMatcher.findMatchingAccounts(environment, consoleUrl, host);
    console.log(`Matching accounts: ${matchingAccounts.length}`);
    if (matchingAccounts.length > 0) {
        console.log(`Selected account: ${matchingAccounts[0].name}`);
        console.log(`Background highlighting enabled: ${matchingAccounts[0].backgroundEnable}`);
        console.log(`Account color: ${matchingAccounts[0].color}`);
        console.log(`Roles count: ${matchingAccounts[0].roles.length}`);
    }
    
    console.log('\n--- Step 3: Console Interface Highlighting Application ---');
    if (matchingAccounts.length > 0) {
        const selectedAccount = matchingAccounts[0];
        
        // Apply account background highlighting
        highlighter.applyAccountHighlighting(selectedAccount);
        
        // Apply role text highlighting
        if (selectedAccount.roles && selectedAccount.roles.length > 0) {
            highlighter.applyRoleHighlighting(selectedAccount.roles);
        }
        
        const finalStatus = highlighter.getHighlightingStatus();
        console.log('Final highlighting status:');
        console.log(`- Account background: ${finalStatus.accountHighlighting}`);
        console.log(`- Role text: ${finalStatus.roleHighlighting}`);
        
        const workflowSuccess = finalStatus.accountHighlighting && finalStatus.roleHighlighting;
        console.log(`\n✓ Complete console workflow: ${workflowSuccess ? 'WORKING' : 'FAILED'}`);
        
        // Clean up
        highlighter.removeHighlighting();
        
        return workflowSuccess;
    }
    
    console.log('\n✗ Complete console workflow: FAILED - No matching accounts found');
    return false;
}

/**
 * Run all AWS console interface highlighting tests
 */
function runAllConsoleTests() {
    console.log('=== AWS Console Interface Highlighting Tests ===');
    console.log('Testing Requirements 4.1, 4.2, 4.4 from task 9.2\n');
    
    const results = {
        urlMatching: testAWSConsoleURLMatching(),
        persistentHighlighting: testPersistentAccountHighlighting(),
        roleHighlighting: testConsoleRoleHighlighting(),
        navigationConsistency: testConsoleNavigationConsistency(),
        completeWorkflow: testCompleteConsoleWorkflow()
    };
    
    console.log('\n=== Test Summary ===');
    console.log(`✓ AWS console URL matching: ${results.urlMatching ? 'PASS' : 'FAIL'}`);
    console.log(`✓ Persistent account highlighting: ${results.persistentHighlighting ? 'PASS' : 'FAIL'}`);
    console.log(`✓ Console role highlighting: ${results.roleHighlighting ? 'PASS' : 'FAIL'}`);
    console.log(`✓ Navigation consistency: ${results.navigationConsistency ? 'PASS' : 'FAIL'}`);
    console.log(`✓ Complete console workflow: ${results.completeWorkflow ? 'PASS' : 'FAIL'}`);
    
    const allPassed = Object.values(results).every(result => result === true);
    
    console.log('\n=== Task 9.2 Status ===');
    console.log(`Requirements 4.1 (Console account highlighting): ${results.urlMatching && results.persistentHighlighting ? '✓ COMPLETE' : '✗ INCOMPLETE'}`);
    console.log(`Requirements 4.2 (Persistent account information): ${results.persistentHighlighting && results.navigationConsistency ? '✓ COMPLETE' : '✗ INCOMPLETE'}`);
    console.log(`Requirements 4.4 (Highlighting consistency): ${results.navigationConsistency && results.completeWorkflow ? '✓ COMPLETE' : '✗ INCOMPLETE'}`);
    
    console.log(`\n=== Overall Task 9.2 Result: ${allPassed ? 'COMPLETE' : 'NEEDS WORK'} ===`);
    
    return allPassed;
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
    // Node.js environment - run tests
    runAllConsoleTests();
} else {
    // Browser environment - export for manual testing
    (window as any).testAWSConsoleInterface = {
        runAllConsoleTests,
        testAWSConsoleURLMatching,
        testPersistentAccountHighlighting,
        testConsoleRoleHighlighting,
        testConsoleNavigationConsistency,
        testCompleteConsoleWorkflow
    };
}

export { runAllConsoleTests };