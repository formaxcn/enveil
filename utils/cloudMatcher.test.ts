import { CloudMatcher } from './cloudMatcher';
import { CloudAccount, CloudRole, CloudEnvironment, CloudProvider, CloudTemplate, RoleHighlightStyle } from '../entrypoints/options/types';

// Test data setup
const mockRoleHighlightStyle: RoleHighlightStyle = {
    textColor: '#ff0000',
    backgroundColor: '#ffff00',
    fontWeight: 'bold',
    textDecoration: 'underline',
    border: '1px solid #000'
};

const mockCloudRole: CloudRole = {
    id: 'role-1',
    name: 'Admin Role',
    enable: true,
    keywords: ['admin', 'administrator', 'root'],
    highlightColor: '#ff0000',
    highlightStyle: mockRoleHighlightStyle,
    created: Date.now(),
    modified: Date.now()
};

const mockCloudAccount: CloudAccount = {
    id: 'account-1',
    name: 'Production Account',
    enable: true,
    matchPattern: 'domain',
    matchValue: 'amazonaws.cn',
    color: '#ff0000',
    backgroundEnable: true,
    roles: [mockCloudRole],
    created: Date.now(),
    modified: Date.now()
};

const mockCloudTemplate: CloudTemplate = {
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

const mockCloudEnvironment: CloudEnvironment = {
    id: 'env-1',
    name: 'AWS Production',
    enable: true,
    provider: CloudProvider.AWS_CN,
    template: mockCloudTemplate,
    accounts: [mockCloudAccount],
    created: Date.now(),
    modified: Date.now()
};

// Test functions
function testCloudAccountMatching() {
    console.log('Testing CloudMatcher.isCloudAccountMatch...');
    
    // Test domain matching
    const result1 = CloudMatcher.isCloudAccountMatch(
        mockCloudAccount,
        'https://console.amazonaws.cn/dashboard',
        'console.amazonaws.cn'
    );
    console.log('Domain match test:', result1 ? 'PASS' : 'FAIL');
    
    // Test non-matching domain
    const result2 = CloudMatcher.isCloudAccountMatch(
        mockCloudAccount,
        'https://google.com',
        'google.com'
    );
    console.log('Non-matching domain test:', !result2 ? 'PASS' : 'FAIL');
    
    // Test disabled account
    const disabledAccount = { ...mockCloudAccount, enable: false };
    const result3 = CloudMatcher.isCloudAccountMatch(
        disabledAccount,
        'https://console.amazonaws.cn/dashboard',
        'console.amazonaws.cn'
    );
    console.log('Disabled account test:', !result3 ? 'PASS' : 'FAIL');
}

function testRoleKeywordMatching() {
    console.log('\nTesting CloudMatcher.findMatchingRoles...');
    
    const pageContent = 'Welcome Administrator! You have admin privileges.';
    const roles = [mockCloudRole];
    
    const matchingRoles = CloudMatcher.findMatchingRoles(roles, pageContent);
    console.log('Keyword matching test:', matchingRoles.length === 1 ? 'PASS' : 'FAIL');
    
    // Test with no matching keywords
    const noMatchContent = 'Welcome user! You have basic privileges.';
    const noMatchingRoles = CloudMatcher.findMatchingRoles(roles, noMatchContent);
    console.log('No keyword match test:', noMatchingRoles.length === 0 ? 'PASS' : 'FAIL');
    
    // Test with disabled role
    const disabledRole = { ...mockCloudRole, enable: false };
    const disabledRoleResult = CloudMatcher.findMatchingRoles([disabledRole], pageContent);
    console.log('Disabled role test:', disabledRoleResult.length === 0 ? 'PASS' : 'FAIL');
}

function testKeywordExtraction() {
    console.log('\nTesting CloudMatcher.extractRoleKeywords...');
    
    const content = 'The administrator has admin access to the system.';
    const roles = [mockCloudRole];
    
    const keywords = CloudMatcher.extractRoleKeywords(content, roles);
    console.log('Keyword extraction test:', keywords.length >= 2 ? 'PASS' : 'FAIL');
    console.log('Extracted keywords:', keywords);
}

function testEnvironmentMatching() {
    console.log('\nTesting CloudMatcher.findMatchingEnvironments...');
    
    const environments = [mockCloudEnvironment];
    const matchingEnvs = CloudMatcher.findMatchingEnvironments(
        environments,
        'https://console.amazonaws.cn/dashboard',
        'console.amazonaws.cn'
    );
    
    console.log('Environment matching test:', matchingEnvs.length === 1 ? 'PASS' : 'FAIL');
}

function testCloudEnvironmentUrl() {
    console.log('\nTesting CloudMatcher.isCloudEnvironmentUrl...');
    
    const environments = [mockCloudEnvironment];
    
    // Test account selection URL
    const result1 = CloudMatcher.isCloudEnvironmentUrl(
        environments,
        'https://signin.amazonaws.cn/saml',
        'signin.amazonaws.cn'
    );
    console.log('Account selection URL test:', result1 ? 'PASS' : 'FAIL');
    
    // Test console domain pattern
    const testUrl = 'https://console.amazonaws.cn/dashboard';
    const testHost = 'console.amazonaws.cn';
    console.log('Testing URL:', testUrl);
    console.log('Template pattern:', mockCloudTemplate.consoleDomainPattern);
    
    const result2 = CloudMatcher.isCloudEnvironmentUrl(
        environments,
        testUrl,
        testHost
    );
    console.log('Console domain pattern test:', result2 ? 'PASS' : 'FAIL');
    
    // Test non-cloud URL
    const result3 = CloudMatcher.isCloudEnvironmentUrl(
        environments,
        'https://google.com',
        'google.com'
    );
    console.log('Non-cloud URL test:', !result3 ? 'PASS' : 'FAIL');
}

// Run all tests
console.log('=== CloudMatcher Unit Tests ===');
testCloudAccountMatching();
testRoleKeywordMatching();
testKeywordExtraction();
testEnvironmentMatching();
testCloudEnvironmentUrl();
console.log('\n=== Tests Complete ===');