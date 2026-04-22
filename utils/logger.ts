// 日志类型定义
export type LogLevel = 'log' | 'warn' | 'error' | 'debug' | 'info';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  component: string;
  message: string;
  data?: any;
}

// 组件名称枚举
export enum Component {
  // 核心组件
  CLOUD_HIGHLIGHTER = 'CloudHighlighter',
  ACCOUNT_SELECTION_HIGHLIGHTER = 'AccountSelectionHighlighter',
  MAGIC_RELOGIN_HANDLER = 'MagicReloginHandler',
  
  // 工具类
  MATCHER = 'Matcher',
  CLOUD_MATCHER = 'CloudMatcher',
  CLOUD_TEMPLATES = 'CloudTemplates',
  
  // 脚本
  CONTENT_SCRIPT = 'ContentScript',
  BACKGROUND_SCRIPT = 'BackgroundScript',
  OPTIONS_PAGE = 'OptionsPage',
  
  // 账户选择处理器
  AWS_ACCOUNT_SELECTION = 'AWSAccountSelection',
  ALIYUN_ACCOUNT_SELECTION = 'AliyunAccountSelection',
  HUAWEI_ACCOUNT_SELECTION = 'HuaweiAccountSelection',
  VOLCENGINE_ACCOUNT_SELECTION = 'VolcengineAccountSelection',
  GENERIC_ACCOUNT_SELECTION = 'GenericAccountSelection',
  
  // 其他
  UNKNOWN = 'Unknown'
}

// 日志管理器类
class LoggerManager {
  private static instance: LoggerManager;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private listeners: ((logs: LogEntry[]) => void)[] = [];
  private originalConsole: { [key in LogLevel]?: (...args: any[]) => void } = {};
  private consoleOverridden = false;

  private constructor() {}

  static getInstance(): LoggerManager {
    if (!LoggerManager.instance) {
      LoggerManager.instance = new LoggerManager();
    }
    return LoggerManager.instance;
  }

  // 覆盖 console 方法
  overrideConsole(defaultComponent: Component = Component.UNKNOWN): void {
    if (this.consoleOverridden) return;

    const methods: LogLevel[] = ['log', 'warn', 'error', 'debug', 'info'];
    
    methods.forEach(method => {
      this.originalConsole[method] = console[method];
      
      console[method] = (...args: any[]) => {
        // 先调用原始 console 方法
        this.originalConsole[method]?.apply(console, args);
        
        // 然后记录日志
        this.addLog(method, this.extractComponent(args), args);
      };
    });

    this.consoleOverridden = true;
  }

  // 从消息中提取组件名称
  private extractComponent(args: any[]): Component {
    // 检查第一个参数是否是字符串且包含 [ComponentName] 格式
    if (args.length > 0 && typeof args[0] === 'string') {
      const firstArg = args[0] as string;
      const match = firstArg.match(/^\[([^\]]+)\]/);
      if (match) {
        const componentName = match[1];
        // 查找匹配的组件
        for (const [key, value] of Object.entries(Component)) {
          if (value === componentName || value.includes(componentName)) {
            return value as Component;
          }
        }
        // 如果没有匹配，就用提取的名称
        return componentName as Component;
      }
    }
    return Component.UNKNOWN;
  }

  // 添加日志
  addLog(level: LogLevel, component: string | Component, message: any[]): void {
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      level,
      component: typeof component === 'string' ? component : component,
      message: this.formatMessage(message),
      data: message.length > 1 ? message.slice(1) : undefined
    };

    this.logs.unshift(entry);

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // 通知监听器
    this.notifyListeners();
  }

  // 格式化消息
  private formatMessage(args: any[]): string {
    return args.map(arg => {
      if (typeof arg === 'string') return arg;
      if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);
      if (arg === null || arg === undefined) return String(arg);
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    }).join(' ');
  }

  // 生成唯一 ID
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // 获取所有日志
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // 获取所有组件
  getComponents(): string[] {
    // 返回所有可能的组件
    const allComponents = Object.values(Component);
    // 也包括日志中实际出现的组件
    const logComponents = new Set<string>();
    this.logs.forEach(log => logComponents.add(log.component));
    
    // 合并并去重
    const combinedComponents = new Set<string>([...allComponents, ...logComponents]);
    return Array.from(combinedComponents).sort();
  }

  // 清除日志
  clearLogs(): void {
    this.logs = [];
    this.notifyListeners();
  }

  // 添加监听器
  addListener(listener: (logs: LogEntry[]) => void): void {
    this.listeners.push(listener);
  }

  // 移除监听器
  removeListener(listener: (logs: LogEntry[]) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  // 通知所有监听器
  private notifyListeners(): void {
    const logs = [...this.logs];
    this.listeners.forEach(listener => {
      try {
        listener(logs);
      } catch (error) {
        console.error('Logger listener error:', error);
      }
    });
  }

  // 导出日志
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// 导出单例实例
export const logger = LoggerManager.getInstance();

// 便捷的日志方法
export function log(component: Component, ...args: any[]): void {
  logger.addLog('log', component, args);
}

export function warn(component: Component, ...args: any[]): void {
  logger.addLog('warn', component, args);
}

export function error(component: Component, ...args: any[]): void {
  logger.addLog('error', component, args);
}

export function debug(component: Component, ...args: any[]): void {
  logger.addLog('debug', component, args);
}

export function info(component: Component, ...args: any[]): void {
  logger.addLog('info', component, args);
}
