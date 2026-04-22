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

// 组件分组配置
export const ComponentGroups = [
  {
    label: 'Scripts',
    components: [
      Component.OPTIONS_PAGE,
      Component.CONTENT_SCRIPT,
      Component.BACKGROUND_SCRIPT
    ]
  },
  {
    label: 'Core Components',
    components: [
      Component.CLOUD_HIGHLIGHTER,
      Component.ACCOUNT_SELECTION_HIGHLIGHTER,
      Component.MAGIC_RELOGIN_HANDLER
    ]
  },
  {
    label: 'Utilities',
    components: [
      Component.MATCHER,
      Component.CLOUD_MATCHER,
      Component.CLOUD_TEMPLATES
    ]
  },
  {
    label: 'Account Selection',
    components: [
      Component.AWS_ACCOUNT_SELECTION,
      Component.ALIYUN_ACCOUNT_SELECTION,
      Component.HUAWEI_ACCOUNT_SELECTION,
      Component.VOLCENGINE_ACCOUNT_SELECTION,
      Component.GENERIC_ACCOUNT_SELECTION
    ]
  },
  {
    label: 'Other',
    components: [
      Component.UNKNOWN
    ]
  }
];

// 消息类型
type LogMessage = { action: 'log-add'; entry: LogEntry } | 
                  { action: 'log-clear' } | 
                  { action: 'log-get-all' } | 
                  { action: 'log-get-all-response'; entries: LogEntry[] };

// 日志管理器类
class LoggerManager {
  private static instance: LoggerManager;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private listeners: ((logs: LogEntry[]) => void)[] = [];
  private originalConsole: { [key in LogLevel]?: (...args: any[]) => void } = {};
  private consoleOverridden = false;
  private initialized = false;

  private constructor() {}

  static getInstance(): LoggerManager {
    if (!LoggerManager.instance) {
      LoggerManager.instance = new LoggerManager();
    }
    return LoggerManager.instance;
  }

  // 初始化 - 区分是否在 background 脚本中
  initialize(isBackground: boolean = false, defaultComponent: Component = Component.UNKNOWN): void {
    if (this.initialized) return;
    this.initialized = true;

    // 覆盖 console 方法
    this.overrideConsole(defaultComponent);

    if (isBackground) {
      // 在 background 脚本中，设置消息监听器
      this.setupBackgroundListener();
    }
  }

  // 覆盖 console 方法
  overrideConsole(defaultComponent: Component = Component.UNKNOWN): void {
    if (this.consoleOverridden) return;

    const methods: LogLevel[] = ['log', 'warn', 'error', 'debug', 'info'];
    
    methods.forEach(method => {
      this.originalConsole[method] = console[method];
      
      console[method] = (...args: any[]) => {
        // 只记录日志，不输出到 console
        this.addLog(method, this.extractComponent(args, defaultComponent), args);
      };
    });

    this.consoleOverridden = true;
  }

  // 从消息中提取组件名称
  private extractComponent(args: any[], defaultComponent: Component): Component {
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
    return defaultComponent;
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

    // 先添加到本地
    this.logs.unshift(entry);

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // 发送到 background（如果不在 background 中）
    this.sendToBackground(entry);

    // 通知监听器
    this.notifyListeners();
  }

  // 发送日志到 background
  private sendToBackground(entry: LogEntry): void {
    try {
      // 检查是否在扩展环境中
      if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.sendMessage) {
        // 发送消息，忽略 response
        browser.runtime.sendMessage({
          action: 'log-add',
          entry
        }).catch(() => {
          // 忽略错误，可能是 message port 关闭了
        });
      }
    } catch {
      // 忽略错误
    }
  }

  // 设置 background 监听器
  private setupBackgroundListener(): void {
    try {
      if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.onMessage) {
        browser.runtime.onMessage.addListener((message: LogMessage, sender, sendResponse) => {
          if (message.action === 'log-add') {
            // 添加接收到的日志
            this.logs.unshift(message.entry);
            
            // 限制日志数量
            if (this.logs.length > this.maxLogs) {
              this.logs.pop();
            }
            
            this.notifyListeners();
          } else if (message.action === 'log-clear') {
            this.logs = [];
            this.notifyListeners();
          } else if (message.action === 'log-get-all') {
            sendResponse({
              action: 'log-get-all-response',
              entries: [...this.logs]
            });
            return true; // 表示我们会异步回复
          }
          return false;
        });
      }
    } catch {
      // 忽略错误
    }
  }

  // 从 background 获取所有日志
  async fetchLogsFromBackground(): Promise<LogEntry[]> {
    try {
      if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.sendMessage) {
        const response = await browser.runtime.sendMessage({
          action: 'log-get-all'
        });
        if (response && response.action === 'log-get-all-response') {
          return response.entries;
        }
      }
    } catch {
      // 如果失败，返回本地日志
    }
    return [...this.logs];
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
    
    // 告诉 background 也清除
    try {
      if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.sendMessage) {
        browser.runtime.sendMessage({
          action: 'log-clear'
        }).catch(() => {
          // 忽略错误
        });
      }
    } catch {
      // 忽略错误
    }
    
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
