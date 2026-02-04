// 定义配置结构类型
export interface SiteConfig {
  enable: boolean;
  matchPattern: string;
  matchValue: string;
  envName: string;
  color: string;
  backgroudEnable: boolean;
  Position: string;
  flagEnable: boolean;
}

// 定义组默认配置结构
export interface GroupDefaults {
  envName: string;
  backgroundEnable: boolean;
  flagEnable: boolean;
  color: string;
}

export interface Setting {
  name: string;
  enable: boolean;
  sites: SiteConfig[];
  defaults?: GroupDefaults; // 添加组默认配置
}

export interface AppConfig {
  browserSync: boolean;
  defaultColors: string[];
  settings: Setting[];
  cloudEnvironments?: CloudEnvironment[]; // New cloud-specific structure
}

// 云端同步数据结构
export interface CloudSyncData {
  configs: Setting[];
  defaultColors: string[];
  cloudEnvironments?: CloudEnvironment[]; // Include cloud environments in sync data
  lastModified: number;
  version: string;
}

// 同步冲突解决策略
export type ConflictResolutionStrategy = 'local' | 'remote' | 'merge' | 'ask';

// 通知类型
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

// Cloud Role System Types

export enum CloudProvider {
  AWS_CN = 'aws-cn',
  AWS_GLOBAL = 'aws-global',
  CUSTOM = 'custom'
}

export interface CloudTemplate {
  provider: CloudProvider;
  name: string;
  accountSelectionUrl: string;
  consoleDomainPattern: string;
  samlUrl?: string;
  enableAutoRelogin?: boolean; // Auto re-login when session expires
  // DOM selectors for highlighting
  selectors: {
    // Account selection page selectors
    accountSelection: {
      // Container elements for account highlighting (background)
      accountContainers: string[];
      // Text elements for role highlighting
      roleElements: string[];
    };
    // Console page selectors
    console: {
      // Container elements for account highlighting (background)
      accountContainers: string[];
      // Text elements for role highlighting
      roleElements: string[];
    };
  };
}

export interface RoleHighlightStyle {
  textColor: string;
  backgroundColor: string;
  fontWeight: 'normal' | 'bold';
  textDecoration: 'none' | 'underline';
  border: string;
}

export interface CloudRole {
  id: string;
  enable: boolean;
  matchPattern: string;
  matchValue: string;
  created: number;
  modified: number;
}

export interface CloudAccount {
  id: string;
  name: string;
  enable: boolean;
  backgroundEnable: boolean;
  backgroundColor: string;
  highlightEnable: boolean;
  highlightColor: string;
  accountPatterns: CloudAccountPattern[];
  roles: CloudRole[];
  created: number;
  modified: number;
}

export interface CloudEnvironment {
  id: string;
  name: string;
  enable: boolean;
  provider: CloudProvider;
  template: CloudTemplate;
  accounts: CloudAccount[];
  created: number;
  modified: number;
}

export interface CloudAccountPattern {
  id: string;
  enable: boolean;
  matchPattern: string;
  matchValue: string;
  created: number;
  modified: number;
}