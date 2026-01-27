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
}

// 通知类型
export type NotificationType = 'success' | 'error' | 'warning' | 'info';