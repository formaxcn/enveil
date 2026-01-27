# Implementation Plan: Cloud Role Highlighter

## Overview

This implementation plan converts the cloud role highlighting design into discrete coding tasks that build incrementally. The approach extends the existing Enveil architecture with cloud-specific functionality while maintaining consistency with current patterns.

## Tasks

- [x] 1. Set up cloud role data structures and core interfaces
  - Create CloudEnvironment, CloudAccount, and CloudRole TypeScript interfaces
  - Extend existing AppConfig interface to include cloudEnvironments array
  - Define CloudProvider enum and hardcoded template constants
  - Create CloudTemplate interface for AWS CN template
  - _Requirements: 1.1, 1.2, 1.3, 6.1, 6.2_

- [x] 2. Implement cloud configuration storage and management
  - [x] 2.1 Extend storage schema to support cloud configurations
    - Update AppConfig type definition with cloudEnvironments field
    - Implement backward compatibility for existing configurations
    - Add cloud configuration validation functions
    - _Requirements: 1.4, 1.5_
  
  - [x] 2.2 Create CloudConfigurationManager class
    - Implement cloud configuration CRUD operations
    - Add cloud configuration to existing import/export functionality
    - Integrate with existing browser sync system
    - _Requirements: 5.5_

- [x] 3. Build cloud roles tab UI infrastructure
  - [x] 3.1 Create CloudRolesTab component
    - Add new "Cloud Roles" tab to existing options page
    - Implement environment list rendering with expand/collapse
    - Create account list rendering within environments
    - _Requirements: 5.1, 5.2_
  
  - [x] 3.2 Implement AddCloudEnvironmentModal
    - Create modal for cloud environment creation/editing
    - Add provider selection with hardcoded AWS CN template
    - Integrate with existing modal styling and patterns
    - _Requirements: 6.3, 6.5_

- [x] 4. Implement cloud account management with role table
  - [x] 4.1 Create AddCloudAccountModal with account configuration
    - Build modal for cloud account creation/editing
    - Add URL pattern matching fields (similar to existing site modal)
    - Implement color selection using existing color picker components
    - _Requirements: 5.2, 1.4_
  
  - [x] 4.2 Add role management table within account modal
    - Create inline role management table with add/edit/delete functionality
    - Implement keyword input fields for role matching
    - Add role highlighting color and style selection
    - _Requirements: 1.5, 5.3_

- [x] 5. Checkpoint - Ensure configuration UI is functional
  - Ensure all tests pass, ask the user if questions arise.

- [-] 6. Implement cloud highlighting engine
  - [-] 6.1 Create CloudMatcher utility class
    - Extend existing Matcher class for cloud-specific URL matching
    - Implement cloud account URL pattern matching
    - Add role keyword matching functionality
    - _Requirements: 2.1, 3.1_
  
  - [~] 6.2 Build CloudHighlighter component
    - Implement account-level background highlighting
    - Create role-level keyword text highlighting
    - Ensure dual-layer highlighting coordination
    - _Requirements: 2.3, 3.3, 8.1, 8.2_

- [~] 7. Integrate cloud highlighting with content script
  - [~] 7.1 Extend existing content script for cloud detection
    - Add cloud environment detection to existing content script
    - Implement cloud account matching alongside existing site matching
    - Apply account background highlighting using existing overlay system
    - _Requirements: 2.1, 4.2, 7.1_
  
  - [~] 7.2 Add role text highlighting to content script
    - Implement keyword scanning and text highlighting
    - Ensure role highlighting works with account background highlighting
    - Apply highlighting to role names, descriptions, and relevant text
    - _Requirements: 3.1, 3.5, 4.3, 7.2_

- [~] 8. Enhance background service worker for cloud support
  - [~] 8.1 Extend tab monitoring for cloud environments
    - Add cloud configuration loading to existing background script
    - Implement cloud account matching in tab update handler
    - Send cloud highlighting messages to content scripts
    - _Requirements: 2.4, 4.4_
  
  - [~] 8.2 Update icon management for cloud accounts
    - Extend existing icon update logic for cloud account matches
    - Ensure cloud highlighting works alongside existing site highlighting
    - Maintain existing icon behavior for non-cloud sites
    - _Requirements: 2.1, 4.1_

- [~] 9. Implement AWS-specific highlighting features
  - [~] 9.1 Add AWS account selection page highlighting
    - Implement specific highlighting for https://signin.amazonaws.cn/saml
    - Apply account background highlighting on SAML login pages
    - Add role keyword text highlighting on account selection pages
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [~] 9.2 Add AWS console interface highlighting
    - Implement highlighting for *.amazonaws.cn/* console pages
    - Apply persistent account information highlighting in console
    - Ensure highlighting consistency across console page navigation
    - _Requirements: 4.1, 4.2, 4.4_

- [~] 10. Final integration and consistency checks
  - [~] 10.1 Ensure dual-layer highlighting coordination
    - Verify account background and role text highlighting work together
    - Implement visual distinction between highlighting layers
    - Test highlighting hierarchy and color separation
    - _Requirements: 8.3, 8.4, 8.5_
  
  - [~] 10.2 Validate configuration persistence and import/export
    - Test cloud configuration saving and loading
    - Verify cloud configurations are included in import/export
    - Ensure browser sync includes cloud configurations
    - _Requirements: 5.5_

- [~] 11. Final checkpoint - Ensure all functionality works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Each task builds incrementally on previous tasks
- Cloud functionality integrates with existing Enveil patterns
- AWS CN template is hardcoded in the application
- Role management is implemented as a table within account modal
- Dual-layer highlighting provides account background + role text emphasis
- All tasks reference specific requirements for traceability