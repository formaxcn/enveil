import { CloudHighlighter } from './CloudHighlighter';
import { CloudAccount, CloudRole, RoleHighlightStyle, CloudProvider } from '../entrypoints/options/types';

// Mock DOM environment for testing
const mockDocument = {
    createElement: (tagName: string) => ({
        tagName: tagName.toUpperCase(),
        id: '',
        style: {},
        classList: {
            contains: () => false,
            add: () => {},
            remove: () => {}
        },
        setAttribute: () => {},
        getAttribute: () => null,
        appendChild: () => {},
        remove: () => {},
        parentNode: null,
        textContent: '',
        innerHTML: ''
    }),
    createTextNode: (text: string) => ({ textContent: text }),
    getElementById: () => null,
    head: { appendChild: () => {} },
    body: { appendChild: () => {} },
    createTreeWalker: () => ({ nextNode: () => null })
};

// Mock NodeFilter for testing environment
const mockNodeFilter = {
    SHOW_TEXT: 4,
    FILTER_ACCEPT: 1,
    FILTER_REJECT: 2
};

// Test data
const createTestAccount = (): CloudAccount => ({
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

const createTestRole = (): CloudRole => ({
    id: 'test-role-1',
    enable: true,
    matchPattern: 'keyword',
    matchValue: 'admin',
    highlightColor: '#4ecdc4',
    highlightStyle: {
        textColor: '#ffffff',
        backgroundColor: '#4ecdc4',
        fontWeight: 'bold',
        textDecoration: 'none',
        border: '1px solid #45b7aa'
    },
    created: Date.now(),
    modified: Date.now()
});

const createTestRoleWithStyle = (style: Partial<RoleHighlightStyle>): CloudRole => {
    const role = createTestRole();
    role.highlightStyle = { ...role.highlightStyle, ...style };
    return role;
};

describe('CloudHighlighter', () => {
    let highlighter: CloudHighlighter;

    beforeEach(() => {
        highlighter = new CloudHighlighter();
        // Reset DOM mocks
        global.document = mockDocument as any;
        global.NodeFilter = mockNodeFilter as any;
    });

    describe('Account Highlighting', () => {
        test('should apply account background highlighting when enabled', () => {
            const account = createTestAccount();
            
            highlighter.applyAccountHighlighting(account);
            
            const status = highlighter.getHighlightingStatus();
            expect(status.accountHighlighting).toBe(true);
        });

        test('should not apply account highlighting when backgroundEnable is false', () => {
            const account = createTestAccount();
            account.backgroundEnable = false;
            
            highlighter.applyAccountHighlighting(account);
            
            const status = highlighter.getHighlightingStatus();
            expect(status.accountHighlighting).toBe(false);
        });

        test('should not apply account highlighting when color is empty', () => {
            const account = createTestAccount();
            account.color = '';
            
            highlighter.applyAccountHighlighting(account);
            
            const status = highlighter.getHighlightingStatus();
            expect(status.accountHighlighting).toBe(false);
        });

        test('should remove existing account highlighting when applying new one', () => {
            const account1 = createTestAccount();
            const account2 = { ...createTestAccount(), id: 'test-account-2', color: '#45b7aa' };
            
            highlighter.applyAccountHighlighting(account1);
            highlighter.applyAccountHighlighting(account2);
            
            const status = highlighter.getHighlightingStatus();
            expect(status.accountHighlighting).toBe(true);
        });
    });

    describe('Role Highlighting', () => {
        test('should apply role text highlighting for enabled roles', () => {
            const roles = [createTestRole()];
            
            highlighter.applyRoleHighlighting(roles);
            
            const status = highlighter.getHighlightingStatus();
            expect(status.roleHighlighting).toBe(true);
        });

        test('should not apply highlighting for disabled roles', () => {
            const role = createTestRole();
            role.enable = false;
            
            highlighter.applyRoleHighlighting([role]);
            
            const status = highlighter.getHighlightingStatus();
            expect(status.roleHighlighting).toBe(false);
        });

        test('should not apply highlighting for roles without match value', () => {
            const role = createTestRole();
            role.matchValue = '';
            
            highlighter.applyRoleHighlighting([role]);
            
            const status = highlighter.getHighlightingStatus();
            expect(status.roleHighlighting).toBe(false);
        });

        test('should handle multiple roles with different patterns', () => {
            const role1 = createTestRole();
            const role2 = { ...createTestRole(), id: 'test-role-2', matchPattern: 'regex', matchValue: 'dev|developer' };
            
            highlighter.applyRoleHighlighting([role1, role2]);
            
            const status = highlighter.getHighlightingStatus();
            expect(status.roleHighlighting).toBe(true);
        });

        test('should handle empty roles array', () => {
            highlighter.applyRoleHighlighting([]);
            
            const status = highlighter.getHighlightingStatus();
            expect(status.roleHighlighting).toBe(false);
        });
    });

    describe('Dual-Layer Highlighting', () => {
        test('should support both account and role highlighting simultaneously', () => {
            const account = createTestAccount();
            const roles = [createTestRole()];
            
            highlighter.applyAccountHighlighting(account);
            highlighter.applyRoleHighlighting(roles);
            
            const status = highlighter.getHighlightingStatus();
            expect(status.accountHighlighting).toBe(true);
            expect(status.roleHighlighting).toBe(true);
        });

        test('should maintain account highlighting when role highlighting is updated', () => {
            const account = createTestAccount();
            const roles1 = [createTestRole()];
            const roles2 = [{ ...createTestRole(), id: 'test-role-2', matchValue: 'manager' }];
            
            highlighter.applyAccountHighlighting(account);
            highlighter.applyRoleHighlighting(roles1);
            highlighter.updateRoleHighlighting(roles2);
            
            const status = highlighter.getHighlightingStatus();
            expect(status.accountHighlighting).toBe(true);
            expect(status.roleHighlighting).toBe(true);
        });
    });

    describe('Highlighting Removal', () => {
        test('should remove all highlighting', () => {
            const account = createTestAccount();
            const roles = [createTestRole()];
            
            highlighter.applyAccountHighlighting(account);
            highlighter.applyRoleHighlighting(roles);
            highlighter.removeHighlighting();
            
            const status = highlighter.getHighlightingStatus();
            expect(status.accountHighlighting).toBe(false);
            expect(status.roleHighlighting).toBe(false);
        });

        test('should remove only account highlighting', () => {
            const account = createTestAccount();
            const roles = [createTestRole()];
            
            highlighter.applyAccountHighlighting(account);
            highlighter.applyRoleHighlighting(roles);
            highlighter.removeAccountHighlighting();
            
            const status = highlighter.getHighlightingStatus();
            expect(status.accountHighlighting).toBe(false);
            expect(status.roleHighlighting).toBe(true);
        });

        test('should remove only role highlighting', () => {
            const account = createTestAccount();
            const roles = [createTestRole()];
            
            highlighter.applyAccountHighlighting(account);
            highlighter.applyRoleHighlighting(roles);
            highlighter.removeRoleHighlighting();
            
            const status = highlighter.getHighlightingStatus();
            expect(status.accountHighlighting).toBe(true);
            expect(status.roleHighlighting).toBe(false);
        });
    });

    describe('Role Highlighting Styles', () => {
        test('should handle different text colors', () => {
            const role = createTestRoleWithStyle({ textColor: '#ff0000' });
            
            highlighter.applyRoleHighlighting([role]);
            
            const status = highlighter.getHighlightingStatus();
            expect(status.roleHighlighting).toBe(true);
        });

        test('should handle different background colors', () => {
            const role = createTestRoleWithStyle({ backgroundColor: '#00ff00' });
            
            highlighter.applyRoleHighlighting([role]);
            
            const status = highlighter.getHighlightingStatus();
            expect(status.roleHighlighting).toBe(true);
        });

        test('should handle different font weights', () => {
            const role = createTestRoleWithStyle({ fontWeight: 'normal' });
            
            highlighter.applyRoleHighlighting([role]);
            
            const status = highlighter.getHighlightingStatus();
            expect(status.roleHighlighting).toBe(true);
        });

        test('should handle different text decorations', () => {
            const role = createTestRoleWithStyle({ textDecoration: 'underline' });
            
            highlighter.applyRoleHighlighting([role]);
            
            const status = highlighter.getHighlightingStatus();
            expect(status.roleHighlighting).toBe(true);
        });

        test('should handle different border styles', () => {
            const role = createTestRoleWithStyle({ border: '2px dashed #ff0000' });
            
            highlighter.applyRoleHighlighting([role]);
            
            const status = highlighter.getHighlightingStatus();
            expect(status.roleHighlighting).toBe(true);
        });
    });

    describe('Keyword Matching', () => {
        test('should handle case-insensitive keyword matching', () => {
            const role = createTestRole();
            role.keywords = ['Admin', 'ADMINISTRATOR'];
            
            highlighter.applyRoleHighlighting([role]);
            
            const status = highlighter.getHighlightingStatus();
            expect(status.roleHighlighting).toBe(true);
        });

        test('should handle special characters in keywords', () => {
            const role = createTestRole();
            role.keywords = ['admin-role', 'user.admin', 'admin@company'];
            
            highlighter.applyRoleHighlighting([role]);
            
            const status = highlighter.getHighlightingStatus();
            expect(status.roleHighlighting).toBe(true);
        });

        test('should handle empty keywords gracefully', () => {
            const role = createTestRole();
            role.keywords = ['', '  ', 'valid-keyword'];
            
            highlighter.applyRoleHighlighting([role]);
            
            const status = highlighter.getHighlightingStatus();
            expect(status.roleHighlighting).toBe(true);
        });
    });

    describe('Status and Information', () => {
        test('should return correct highlighting status', () => {
            const account = createTestAccount();
            const roles = [createTestRole()];
            
            let status = highlighter.getHighlightingStatus();
            expect(status.accountHighlighting).toBe(false);
            expect(status.roleHighlighting).toBe(false);
            
            highlighter.applyAccountHighlighting(account);
            status = highlighter.getHighlightingStatus();
            expect(status.accountHighlighting).toBe(true);
            expect(status.roleHighlighting).toBe(false);
            
            highlighter.applyRoleHighlighting(roles);
            status = highlighter.getHighlightingStatus();
            expect(status.accountHighlighting).toBe(true);
            expect(status.roleHighlighting).toBe(true);
        });

        test('should return highlighted roles information', () => {
            const roles = [createTestRole()];
            
            highlighter.applyRoleHighlighting(roles);
            const info = highlighter.getHighlightedRolesInfo();
            
            expect(Array.isArray(info)).toBe(true);
        });
    });

    describe('Edge Cases', () => {
        test('should handle null/undefined inputs gracefully', () => {
            expect(() => {
                highlighter.applyAccountHighlighting(null as any);
            }).not.toThrow();
            
            expect(() => {
                highlighter.applyRoleHighlighting(null as any);
            }).not.toThrow();
            
            expect(() => {
                highlighter.applyRoleHighlighting(undefined as any);
            }).not.toThrow();
        });

        test('should handle account with null color', () => {
            const account = createTestAccount();
            account.color = null as any;
            
            expect(() => {
                highlighter.applyAccountHighlighting(account);
            }).not.toThrow();
            
            const status = highlighter.getHighlightingStatus();
            expect(status.accountHighlighting).toBe(false);
        });

        test('should handle role with null keywords', () => {
            const role = createTestRole();
            role.keywords = null as any;
            
            expect(() => {
                highlighter.applyRoleHighlighting([role]);
            }).not.toThrow();
            
            const status = highlighter.getHighlightingStatus();
            expect(status.roleHighlighting).toBe(false);
        });
    });
});