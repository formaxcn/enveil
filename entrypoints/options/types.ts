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

export interface Setting {
  name: string;
  enable: boolean;
  sites: SiteConfig[];
}

export interface GitConfig {
  repoUrl: string;
  branch: string;
  filePath: string;
  username: string;
  password: string;
  lastSyncTime: string;
  localCommit: number;
}

export interface AppConfig {
  browserSync: boolean;
  settings: Setting[];
  gitConfig?: GitConfig;
}

// 通知类型
export type NotificationType = 'success' | 'error' | 'warning' | 'info';