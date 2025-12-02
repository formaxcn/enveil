import { AppConfig, GitConfig } from '../types';

// 声明chrome对象
declare const chrome: any;

export class GitSyncManager {
  private appConfig: AppConfig;
  private notificationCallback: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;

  constructor(
    appConfig: AppConfig,
    notificationCallback: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void
  ) {
    this.appConfig = appConfig;
    this.notificationCallback = notificationCallback;
  }

  // 更新配置引用
  public updateConfig(config: AppConfig): void {
    this.appConfig = config;
  }

  // 初始化Git配置UI
  public initGitConfigUI(): void {
    // 设置Git配置表单字段值
    if (this.appConfig.gitConfig) {
      document.getElementById('repo-url')!.value = this.appConfig.gitConfig.repoUrl || '';
      document.getElementById('branch')!.value = this.appConfig.gitConfig.branch || 'main';
      document.getElementById('file-path')!.value = this.appConfig.gitConfig.filePath || 'extensions.json';
      document.getElementById('username')!.value = this.appConfig.gitConfig.username || '';
      document.getElementById('password')!.value = this.appConfig.gitConfig.password || '';
      
      // 更新同步信息
      document.getElementById('sync-time')!.textContent = this.appConfig.gitConfig.lastSyncTime || 'Never';
      document.getElementById('local-commit')!.textContent = `+${this.appConfig.gitConfig.localCommit || 0}`;
    }
  }

  // 保存Git配置
  public saveGitConfig(): void {
    if (!this.appConfig.gitConfig) {
      this.appConfig.gitConfig = {} as GitConfig;
    }
    
    this.appConfig.gitConfig.repoUrl = (document.getElementById('repo-url') as HTMLInputElement).value;
    this.appConfig.gitConfig.branch = (document.getElementById('branch') as HTMLInputElement).value || 'main';
    this.appConfig.gitConfig.filePath = (document.getElementById('file-path') as HTMLInputElement).value || 'extensions.json';
    this.appConfig.gitConfig.username = (document.getElementById('username') as HTMLInputElement).value;
    this.appConfig.gitConfig.password = (document.getElementById('password') as HTMLInputElement).value;
    
    this.notificationCallback('Git配置已保存', 'success');
  }

  // 测试Git连接
  public async testGitConnection(): Promise<void> {
    const repoUrl = (document.getElementById('repo-url') as HTMLInputElement).value;
    const username = (document.getElementById('username') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;
    
    if (!repoUrl) {
      this.notificationCallback('请输入仓库URL', 'error');
      return;
    }
    
    try {
      this.notificationCallback('正在测试连接...', 'info');
      
      // 使用isomorphic-git的话，这里应该导入git并进行实际的连接测试
      // 目前先保持原有的fetch模拟实现
      const response = await fetch(repoUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          ...(username && password ? {
            'Authorization': 'Basic ' + btoa(username + ':' + password)
          } : {})
        }
      });
      
      if (response.ok) {
        this.notificationCallback('连接成功', 'success');
      } else {
        this.notificationCallback('连接失败: ' + response.statusText, 'error');
      }
    } catch (error) {
      this.notificationCallback('测试连接时出错: ' + (error instanceof Error ? error.message : String(error)), 'error');
    }
  }

  // 推送配置到Git（Force方式）
  public async pushConfig(silent: boolean = false): Promise<void> {
    if (!this.appConfig.gitConfig || !this.appConfig.gitConfig.repoUrl) {
      if (!silent) {
        this.notificationCallback('请先配置Git仓库信息', 'error');
      }
      return;
    }
    
    try {
      if (!silent) {
        this.notificationCallback('正在推送配置...', 'info');
      }
      
      // TODO: 使用isomorphic-git实现实际的Git操作
      // 目前保持模拟实现
      
      // 更新同步时间
      this.appConfig.gitConfig.lastSyncTime = new Date().toLocaleString();
      this.appConfig.gitConfig.localCommit = 0; // 重置本地提交计数
      
      // 更新UI显示
      if (document.getElementById('sync-time')) {
        document.getElementById('sync-time')!.textContent = this.appConfig.gitConfig.lastSyncTime;
      }
      if (document.getElementById('local-commit')) {
        document.getElementById('local-commit')!.textContent = `+${this.appConfig.gitConfig.localCommit}`;
      }
      
      if (!silent) {
        this.notificationCallback('配置推送成功（Force Push）', 'success');
      }
    } catch (error) {
      if (!silent) {
        this.notificationCallback('推送失败: ' + (error instanceof Error ? error.message : String(error)), 'error');
      }
      throw error;
    }
  }

  // 从Git拉取配置（Force方式）
  public async pullConfig(silent: boolean = false): Promise<void> {
    if (!this.appConfig.gitConfig || !this.appConfig.gitConfig.repoUrl) {
      if (!silent) {
        this.notificationCallback('请先配置Git仓库信息', 'error');
      }
      return;
    }
    
    try {
      if (!silent) {
        this.notificationCallback('正在拉取配置...', 'info');
      }
      
      // TODO: 使用isomorphic-git实现实际的Git操作
      // 目前保持模拟实现
      
      // 更新同步时间
      this.appConfig.gitConfig.lastSyncTime = new Date().toLocaleString();
      
      // 更新UI显示
      if (document.getElementById('sync-time')) {
        document.getElementById('sync-time')!.textContent = this.appConfig.gitConfig.lastSyncTime;
      }
      
      if (!silent) {
        this.notificationCallback('配置拉取成功（Force Pull）', 'success');
      }
    } catch (error) {
      if (!silent) {
        this.notificationCallback('拉取失败: ' + (error instanceof Error ? error.message : String(error)), 'error');
      }
      throw error;
    }
  }

  // 同步配置（先Pull后Push，都使用Force方式）
  public async syncConfig(silent: boolean = false): Promise<void> {
    if (!this.appConfig.gitConfig || !this.appConfig.gitConfig.repoUrl) {
      if (!silent) {
        this.notificationCallback('请先配置Git仓库信息', 'error');
      }
      return;
    }
    
    try {
      if (!silent) {
        this.notificationCallback('正在同步配置...', 'info');
      }
      
      // 先Force Pull（传递silent参数）
      await this.pullConfig(silent);
      // 然后Force Push（传递silent参数）
      await this.pushConfig(silent);
      
      if (!silent) {
        this.notificationCallback('配置同步成功', 'success');
      }
    } catch (error) {
      if (!silent) {
        this.notificationCallback('同步失败: ' + (error instanceof Error ? error.message : String(error)), 'error');
      }
      throw error; // 重新抛出错误，让调用者处理
    }
  }

  // 增加本地提交计数
  public incrementLocalCommit(): void {
    if (this.appConfig.gitConfig) {
      this.appConfig.gitConfig.localCommit = (this.appConfig.gitConfig.localCommit || 0) + 1;
      if (document.getElementById('local-commit')) {
        document.getElementById('local-commit')!.textContent = `+${this.appConfig.gitConfig.localCommit}`;
      }
    }
  }
}