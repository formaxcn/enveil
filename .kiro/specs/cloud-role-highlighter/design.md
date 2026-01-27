# Design Document

## Overview

The Cloud Role Highlighter extends the existing Enveil Chrome extension with cloud platform role highlighting capabilities. The design integrates seamlessly with the current three-tier architecture (Groups > Sites > Configuration) by introducing a parallel cloud-specific structure (Cloud Environments > Cloud Accounts > Cloud Roles).

The system provides dual-layer highlighting: account-level background highlighting (similar to existing site highlighting) and role-level keyword-based text highlighting. This approach maintains consistency with existing Enveil patterns while adding cloud-specific functionality.

## Architecture

### High-Level Architecture

The Cloud Role Highlighter follows the existing Enveil architecture pattern:

```
Background Service Worker
├── Configuration Management (Extended)
├── Tab Monitoring (Enhanced)
└── Message Passing (Extended)

Content Scripts
├── Existing Site Highlighting
├── Cloud Account Highlighting (New)
└── Cloud Role Text Highlighting (New)

Options Page
├── Existing "Configs" Tab (Group/Site Management)
├── New "Cloud Roles" Tab (Environment/Account/Role Management) (New)
└── Existing Settings and Import/Export
```

### Integration Points

1. **Storage Extension**: Extends existing `AppConfig` structure with cloud-specific configurations
2. **UI Extension**: Adds cloud environment options to existing group/site management interface
3. **Content Script Enhancement**: Adds cloud-specific highlighting alongside existing functionality
4. **Background Service Enhancement**: Extends existing tab monitoring for cloud-specific matching

## Components and Interfaces

### Core Components

#### CloudRoleSystem
Central coordinator for cloud role highlighting functionality.

```typescript
class CloudRoleSystem {
  private config: AppConfig;
  private highlighter: CloudHighlighter;
  private matcher: CloudMatcher;
  
  public async initialize(): Promise<void>
  public async processTab(tabId: number, url: string): Promise<void>
  public isCloudEnvironment(url: string): boolean
}
```

#### CloudHighlighter
Handles the visual highlighting of cloud accounts and roles.

```typescript
class CloudHighlighter {
  public applyAccountHighlighting(account: CloudAccount): void
  public applyRoleHighlighting(roles: CloudRole[]): void
  public removeHighlighting(): void
  private createAccountOverlay(color: string): HTMLElement
  private highlightRoleText(keywords: string[], color: string): void
}
```

#### CloudMatcher
Extends existing Matcher utility for cloud-specific pattern matching.

```typescript
class CloudMatcher extends Matcher {
  public static isCloudAccountMatch(account: CloudAccount, url: string): boolean
  public static findMatchingRoles(roles: CloudRole[], pageContent: string): CloudRole[]
  public static extractRoleKeywords(content: string): string[]
}
```

#### CloudConfigurationManager
Manages single cloud roles tab with two-level modal structure.

```typescript
class CloudConfigurationManager {
  public initializeCloudRolesTab(): void
  public renderEnvironmentList(): void
  public renderAccountsForEnvironment(envId: string): void
  private createEnvironmentListItem(env: CloudEnvironment): HTMLElement
  private createAccountListItem(account: CloudAccount): HTMLElement
  private showEnvironmentModal(env?: CloudEnvironment): void
  private showAccountModal(envId: string, account?: CloudAccount): void
}
```

### UI Components

#### CloudRolesTab
Single tab for all cloud role management with two-level modal structure.

```typescript
class CloudRolesTab {
  public initializeCloudTab(): void
  public renderCloudEnvironments(): void
  public renderAccountsForEnvironment(envId: string): void
  private createEnvironmentElement(env: CloudEnvironment): HTMLElement
  private createAccountElement(account: CloudAccount): HTMLElement
  private openEnvironmentModal(env?: CloudEnvironment): void
  private openAccountModal(envId: string, account?: CloudAccount): void
}
```

#### AddCloudEnvironmentModal
Modal for cloud environment creation with hardcoded templates.

```typescript
class AddCloudEnvironmentModal {
  public open(onSave: (env: CloudEnvironment) => void): void
  private renderProviderSelection(): void
  private applyHardcodedTemplate(provider: CloudProvider): void
}
```

#### AddCloudAccountModal
Modal for cloud account configuration with integrated role management table.

```typescript
class AddCloudAccountModal {
  public open(environment: CloudEnvironment, account?: CloudAccount): void
  private renderAccountConfiguration(): void
  private renderRoleManagementTable(): void
  private addRoleToTable(): void
  private editRoleInTable(roleIndex: number): void
  private deleteRoleFromTable(roleIndex: number): void
  private validateAccountConfig(): boolean
}
```

## Data Models

### Extended Configuration Structure

```typescript
// Extends existing AppConfig
interface AppConfig {
  browserSync: boolean;
  defaultColors: string[];
  settings: Setting[];
  cloudEnvironments?: CloudEnvironment[]; // New cloud-specific structure
}

// New cloud-specific data structures
interface CloudEnvironment {
  id: string;
  name: string;
  enable: boolean;
  provider: CloudProvider;
  template: CloudTemplate;
  accounts: CloudAccount[];
  created: number;
  modified: number;
}

interface CloudAccount {
  id: string;
  name: string;
  enable: boolean;
  matchPattern: string;
  matchValue: string;
  color: string;
  backgroundEnable: boolean;
  roles: CloudRole[];
  created: number;
  modified: number;
}

interface CloudRole {
  id: string;
  name: string;
  enable: boolean;
  keywords: string[];
  highlightColor: string;
  highlightStyle: RoleHighlightStyle;
  created: number;
  modified: number;
}

interface CloudTemplate {
  provider: CloudProvider;
  name: string;
  accountSelectionUrl: string;
  consoleDomainPattern: string;
  samlUrl?: string; // For future auto-relogin functionality
}

interface RoleHighlightStyle {
  textColor: string;
  backgroundColor: string;
  fontWeight: 'normal' | 'bold';
  textDecoration: 'none' | 'underline';
  border: string;
}

enum CloudProvider {
  AWS_CN = 'aws-cn',
  AWS_GLOBAL = 'aws-global',
  AZURE = 'azure',
  GCP = 'gcp',
  CUSTOM = 'custom'
}
```

### Template Definitions

```typescript
// Hardcoded templates in the application
const HARDCODED_CLOUD_TEMPLATES: Record<CloudProvider, CloudTemplate> = {
  [CloudProvider.AWS_CN]: {
    provider: CloudProvider.AWS_CN,
    name: 'AWS China',
    accountSelectionUrl: 'https://signin.amazonaws.cn/saml',
    consoleDomainPattern: '*://*.amazonaws.cn/*'
  }
  // Additional templates can be added directly in code
};
```

### Storage Schema

The cloud configuration extends the existing storage schema:

```typescript
// Chrome Storage Structure
{
  appConfig: {
    // Existing fields
    browserSync: boolean,
    defaultColors: string[],
    settings: Setting[],
    
    // New cloud-specific fields
    cloudEnvironments: CloudEnvironment[]
  }
}
```

## Error Handling

### Configuration Validation

```typescript
class CloudConfigValidator {
  public static validateEnvironment(env: CloudEnvironment): ValidationResult
  public static validateAccount(account: CloudAccount): ValidationResult
  public static validateRole(role: CloudRole): ValidationResult
  public static validateTemplate(template: CloudTemplate): ValidationResult
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
```

### Error Recovery

1. **Invalid Configuration**: Gracefully disable invalid cloud environments while maintaining existing functionality
2. **Template Loading Failure**: Fall back to manual configuration if templates fail to load
3. **Highlighting Conflicts**: Prioritize account-level highlighting over role-level when conflicts occur
4. **Storage Corruption**: Maintain backward compatibility with existing configurations

### Logging Strategy

```typescript
class CloudLogger {
  public static logEnvironmentMatch(env: CloudEnvironment, url: string): void
  public static logAccountMatch(account: CloudAccount, url: string): void
  public static logRoleHighlight(role: CloudRole, matches: string[]): void
  public static logError(component: string, error: Error): void
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Three-Tier Configuration Structure
*For any* cloud configuration operation, the system should maintain the hierarchical structure where Cloud_Environments contain Cloud_Accounts, and Cloud_Accounts contain arrays of Cloud_Roles, with all relationships preserved after any configuration changes.
**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Account Background Highlighting Application
*For any* URL that matches a Cloud_Account configuration, the Role_Highlighter should apply background highlighting using the account's configured color across all matching page types (SAML login pages, AWS console, account selection pages).
**Validates: Requirements 2.1, 2.3, 4.2, 7.1**

### Property 3: Role Keyword Text Highlighting
*For any* page content containing keywords that match configured Cloud_Role keywords, the Role_Highlighter should apply text highlighting with the role's configured style to all matching text elements (role names, descriptions, and other relevant text).
**Validates: Requirements 3.1, 3.5, 4.3, 7.2**

### Property 4: Dual-Layer Highlighting Coordination
*For any* page where both account and role highlighting apply, the Role_Highlighter should apply account background highlighting as the base layer and role text highlighting as the overlay layer, ensuring visual distinction between the two layers and maintaining clear hierarchy.
**Validates: Requirements 3.3, 7.3, 8.1, 8.2, 8.4, 8.5**

### Property 5: Multiple Role Support Per Account
*For any* Cloud_Account with multiple Cloud_Role configurations, each role's keyword matching and text highlighting should work independently, allowing multiple different role highlights to appear simultaneously on the same page.
**Validates: Requirements 3.2, 3.4**

### Property 6: Highlighting Consistency Across Pages
*For any* Cloud_Account or Cloud_Role configuration, the same highlighting (colors, styles, patterns) should be applied consistently across all pages that match the configuration, regardless of page layout or structure.
**Validates: Requirements 2.4, 4.4, 7.5**

### Property 7: Configuration UI Integration
*For any* cloud configuration operation (create environment, add account, manage roles), the system should extend existing UI patterns (Add Group, Add Site modals) while maintaining integration with existing features (import/export, browser sync).
**Validates: Requirements 5.1, 5.2, 5.3, 5.5**

### Property 8: Template Pre-filling Functionality
*For any* cloud template selection, the system should pre-fill all template-defined values (URLs, domain patterns) into the configuration form, requiring user input only for template-undefined fields.
**Validates: Requirements 6.3, 6.5**

### Property 9: Color Distinction Enforcement
*For any* Cloud_Account and its associated Cloud_Roles, the role text highlighting colors should be visually distinct from the account background color to ensure clear visual separation between highlighting layers.
**Validates: Requirements 8.3**

### Property 10: Configuration Persistence and Retrieval
*For any* cloud configuration (environment, account, role), after saving the configuration should be retrievable with all properties intact and should be included in import/export operations.
**Validates: Requirements 1.4, 1.5**

## Testing Strategy

### Manual Testing Approach

Since automated testing is not required, the testing strategy focuses on comprehensive manual testing scenarios:

#### Configuration Testing
1. **Environment Creation**: Test AWS CN template application and custom environment creation
2. **Account Configuration**: Verify account-level background highlighting configuration
3. **Role Management**: Test keyword-based role configuration and highlighting options
4. **Import/Export**: Ensure cloud configurations are included in existing import/export functionality

#### Highlighting Testing
1. **Account Selection Pages**: Verify background highlighting on `https://signin.amazonaws.cn/saml`
2. **Console Interface**: Test account information highlighting on `*.amazonaws.cn` domains
3. **Role Text Highlighting**: Verify keyword matching and text highlighting overlay
4. **Dual-Layer Highlighting**: Ensure account background and role text highlighting work together

#### Integration Testing
1. **Existing Functionality**: Verify existing site highlighting continues to work
2. **Configuration UI**: Test integration with existing group/site management interface
3. **Browser Sync**: Ensure cloud configurations sync across browser instances
4. **Performance**: Verify no performance degradation on non-cloud sites

#### Edge Case Testing
1. **Multiple Matches**: Test behavior when multiple cloud accounts match the same URL
2. **Conflicting Highlights**: Verify handling of overlapping highlighting areas
3. **Invalid Configurations**: Test graceful handling of malformed cloud configurations
4. **Template Updates**: Test behavior when templates are modified or unavailable

### Testing Checklist

- [ ] AWS CN template pre-fills correct URLs
- [ ] Account background highlighting applies correctly
- [ ] Role keyword matching works across different page layouts
- [ ] Dual-layer highlighting maintains visual hierarchy
- [ ] Existing site highlighting remains functional
- [ ] Configuration import/export includes cloud settings
- [ ] Browser sync propagates cloud configurations
- [ ] Invalid configurations are handled gracefully
- [ ] Performance remains acceptable on high-traffic sites
- [ ] UI integration follows existing design patterns