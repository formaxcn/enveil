export type LogLevel = 'log' | 'warn' | 'error' | 'debug' | 'info';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  component: string;
  message: string;
  data?: any;
}

export enum Component {
  CLOUD_HIGHLIGHTER = 'CloudHighlighter',
  ACCOUNT_SELECTION_HIGHLIGHTER = 'AccountSelectionHighlighter',
  MAGIC_RELOGIN_HANDLER = 'MagicReloginHandler',
  MATCHER = 'Matcher',
  CLOUD_MATCHER = 'CloudMatcher',
  CLOUD_TEMPLATES = 'CloudTemplates',
  CONTENT_SCRIPT = 'ContentScript',
  BACKGROUND_SCRIPT = 'BackgroundScript',
  OPTIONS_PAGE = 'OptionsPage',
  AWS_ACCOUNT_SELECTION = 'AWSAccountSelection',
  ALIYUN_ACCOUNT_SELECTION = 'AliyunAccountSelection',
  HUAWEI_ACCOUNT_SELECTION = 'HuaweiAccountSelection',
  VOLCENGINE_ACCOUNT_SELECTION = 'VolcengineAccountSelection',
  GENERIC_ACCOUNT_SELECTION = 'GenericAccountSelection',
  UNKNOWN = 'Unknown'
}

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

type LogMessage = { action: 'log-add'; entry: LogEntry } | 
                  { action: 'log-clear' } | 
                  { action: 'log-get-all' } | 
                  { action: 'log-get-all-response'; entries: LogEntry[] };

class LoggerManager {
  private static instance: LoggerManager;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private listeners: ((logs: LogEntry[]) => void)[] = [];
  private initialized = false;
  private consoleMethods: { [key in LogLevel]?: (...args: any[]) => void } = {};

  private constructor() {
    this.consoleMethods = {
      log: (...args: any[]) => this.addLog('log', this.extractComponent(args), args),
      warn: (...args: any[]) => this.addLog('warn', this.extractComponent(args), args),
      error: (...args: any[]) => this.addLog('error', this.extractComponent(args), args),
      debug: (...args: any[]) => this.addLog('debug', this.extractComponent(args), args),
      info: (...args: any[]) => this.addLog('info', this.extractComponent(args), args),
    };
  }

  static getInstance(): LoggerManager {
    if (!LoggerManager.instance) {
      LoggerManager.instance = new LoggerManager();
    }
    return LoggerManager.instance;
  }

  initialize(isBackground: boolean = false, defaultComponent: Component = Component.UNKNOWN): void {
    if (this.initialized) return;
    this.initialized = true;

    if (isBackground) {
      this.setupBackgroundListener();
    }
  }

  getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    return this.consoleMethods[level] || (() => {});
  }

  private extractComponent(args: any[], defaultComponent?: Component): string {
    if (args.length > 0 && typeof args[0] === 'string') {
      const firstArg = args[0] as string;
      const match = firstArg.match(/^\[([^\]]+)\]/);
      if (match) {
        const componentName = match[1];
        for (const [key, value] of Object.entries(Component)) {
          if (value === componentName || value.includes(componentName)) {
            return value as string;
          }
        }
        return componentName;
      }
    }
    return defaultComponent ? String(defaultComponent) : 'Unknown';
  }

  addLog(level: LogLevel, component: string, message: any[]): void {
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      level,
      component,
      message: this.formatMessage(message),
      data: message.length > 1 ? message.slice(1) : undefined
    };

    this.logs.unshift(entry);

    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    this.sendToBackground(entry);
    this.notifyListeners();
  }

  private sendToBackground(entry: LogEntry): void {
    try {
      if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.sendMessage) {
        browser.runtime.sendMessage({
          action: 'log-add',
          entry
        }).catch(() => {});
      }
    } catch {}
  }

  private setupBackgroundListener(): void {
    try {
      if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.onMessage) {
        browser.runtime.onMessage.addListener((message: LogMessage, sender, sendResponse) => {
          if (message.action === 'log-add') {
            this.logs.unshift(message.entry);
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
            return true;
          }
          return false;
        });
      }
    } catch {}
  }

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
    } catch {}
    return [...this.logs];
  }

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

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  getComponents(): string[] {
    const allComponents = Object.values(Component);
    const logComponents = new Set<string>();
    this.logs.forEach(log => logComponents.add(log.component));
    const combinedComponents = new Set<string>([...allComponents, ...logComponents]);
    return Array.from(combinedComponents).sort();
  }

  clearLogs(): void {
    this.logs = [];
    try {
      if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.sendMessage) {
        browser.runtime.sendMessage({
          action: 'log-clear'
        }).catch(() => {});
      }
    } catch {}
    this.notifyListeners();
  }

  addListener(listener: (logs: LogEntry[]) => void): void {
    this.listeners.push(listener);
  }

  removeListener(listener: (logs: LogEntry[]) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

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

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = LoggerManager.getInstance();

export function log(component: Component | string, ...args: any[]): void {
  const comp = typeof component === 'string' ? component : String(component);
  logger.addLog('log', comp, args);
}

export function warn(component: Component | string, ...args: any[]): void {
  const comp = typeof component === 'string' ? component : String(component);
  logger.addLog('warn', comp, args);
}

export function error(component: Component | string, ...args: any[]): void {
  const comp = typeof component === 'string' ? component : String(component);
  logger.addLog('error', comp, args);
}

export function debug(component: Component | string, ...args: any[]): void {
  const comp = typeof component === 'string' ? component : String(component);
  logger.addLog('debug', comp, args);
}

export function info(component: Component | string, ...args: any[]): void {
  const comp = typeof component === 'string' ? component : String(component);
  logger.addLog('info', comp, args);
}
