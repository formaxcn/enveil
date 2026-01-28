---
layout: default
title: User Guide
nav_order: 3
has_children: true
---

# User Guide

This comprehensive user guide covers all aspects of using Enveil, from basic configuration to advanced features and cloud environment management.

## What You'll Learn

### [📝 Basic Configuration](./basic-configuration.html)
- Understanding configuration groups and site rules
- Setting up environment matching patterns
- Configuring visual indicators (banners and overlays)
- Managing colors and positions

### [🚀 Advanced Features](./advanced-features.html)
- Regular expression matching patterns
- Import/export functionality
- Browser synchronization
- Bulk operations and management

### [☁️ Cloud Environments](./cloud-environments.html)
- Setting up cloud platform identification
- AWS, Azure, GCP configuration
- Account background highlighting
- Role keyword highlighting

### [🔧 Troubleshooting](./troubleshooting.html)
- Common issues and solutions
- Performance optimization
- Debugging configuration problems
- Browser compatibility

## Quick Reference

### Common Matching Patterns

| Pattern Type | Use Case | Example |
|--------------|----------|---------|
| `domain` | Match entire domains and subdomains | `example.com` matches `app.example.com` |
| `urlPrefix` | Match specific paths or API endpoints | `https://api.example.com/v1` |
| `url` | Match exact URLs | `http://localhost:8080/admin` |
| `regex` | Complex pattern matching | `^https?:\/\/.*\.test\.com` |
| `everything` | Auto-detection with fallback strategies | `*`, `localhost`, `/pattern/` |

### Visual Indicator Options

| Feature | Description | Best For |
|---------|-------------|----------|
| **Corner Banners** | Rotated ribbons in page corners | All environments |
| **Background Overlays** | Subtle full-page color tinting | Production warnings |
| **Cloud Highlighting** | Account and role identification | Cloud platforms |

### Configuration Management

| Action | Description | Location |
|--------|-------------|----------|
| **Groups** | Organize rules by project/team | Main configuration area |
| **Import/Export** | Backup and share configurations | Left sidebar |
| **Browser Sync** | Cross-device synchronization | Left sidebar |
| **Default Colors** | Customize color palette | Left sidebar |

## Best Practices

### Environment Organization
1. **Use Descriptive Names**: Clear environment labels like "DEV", "STAGING", "PROD"
2. **Consistent Colors**: Same colors for similar environments across projects
3. **Group Logically**: Separate groups for different projects or teams
4. **Order by Risk**: Most critical environments (production) with strongest visual cues

### Performance Optimization
1. **Specific Patterns**: Use domain matching over regex when possible
2. **Rule Ordering**: Place frequently matched rules first
3. **Disable Unused**: Turn off rules and groups you don't need
4. **Regular Cleanup**: Remove obsolete configurations

### Security Considerations
1. **Production Warnings**: Always use background overlays for production environments
2. **Clear Labeling**: Make environment names immediately recognizable
3. **Team Standards**: Establish consistent configuration patterns across your team
4. **Regular Backups**: Export configurations regularly

## Getting Help

- **Issues**: Check the [Troubleshooting](./troubleshooting.html) section
- **Features**: Review [Advanced Features](./advanced-features.html) for detailed capabilities
- **Cloud Setup**: See [Cloud Environments](./cloud-environments.html) for platform-specific guidance
- **Community**: Visit our [GitHub repository](https://github.com/formaxcn/enveil) for support

---

Ready to dive deeper? Start with [Basic Configuration](./basic-configuration.html) or jump to the section that interests you most.