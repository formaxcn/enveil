# Enveil Roadmap

## Version 2.0 - Cloud Role Highlighter

### Overview
Extend Enveil with cloud platform role highlighting capabilities to improve user experience when working with multiple cloud environments and accounts.

### Core Features

#### 1. Cloud Role Highlighting System
- **Multi-cloud Support**: Extensible architecture supporting AWS, Azure, GCP, and other cloud providers
- **Account Selection Enhancement**: Visual highlighting of accounts and roles during login/selection process
- **Console Integration**: Persistent role/environment indicators within cloud consoles
- **Configurable Rules**: User-defined highlighting rules based on keywords and patterns

#### 2. AWS Implementation (Phase 1)
- **SAML Login Page Enhancement**
  - Environment-based background highlighting (dev, staging, prod)
  - Role-based text marking and emphasis
  - Configurable keyword matching
  
- **Console Account Information**
  - Persistent account/role highlighting in console header
  - Environment indicators across console pages
  - Real-time updates on role/account changes

- **Auto-Relogin Functionality**
  - Session expiration detection
  - Automated redirect to SAML authentication
  - Context preservation and restoration
  - User-configurable SAML endpoints

#### 3. Configuration Interface
- **Tab-based UI**: New "Cloud Roles" tab alongside existing "Configs" tab
- **Template Management**: Pre-built templates for major cloud providers
- **Rule Editor**: Visual interface for creating and managing highlighting rules
- **Domain Configuration**: Flexible domain matching for different cloud regions
- **Import/Export**: Share configurations across teams and environments

### Technical Architecture

#### Data Structure
```
CloudRoleConfig:
  - enabled: boolean
  - provider: string (aws, azure, gcp, custom)
  - domains: string[]
  - highlightRules: HighlightRule[]
  - autoRelogin: ReloginConfig
```

#### Implementation Phases
1. **Foundation**: Core architecture and AWS basic highlighting
2. **Enhancement**: Auto-relogin and advanced rule matching
3. **Extension**: Additional cloud provider templates
4. **Polish**: UI improvements and user experience refinements

### Future Considerations
- **Enterprise Features**: Team-wide configuration sharing
- **Advanced Matching**: Regular expression support for complex patterns
- **Integration**: API for external configuration management
- **Analytics**: Usage tracking and optimization suggestions

### Development Timeline
- **Q2 2024**: Foundation and AWS basic implementation
- **Q3 2024**: Auto-relogin and advanced features
- **Q4 2024**: Additional cloud providers and UI polish

---

*This roadmap is subject to change based on user feedback and technical requirements.*