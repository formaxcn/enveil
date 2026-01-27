import { AppController } from '../managers/AppController';
import { ConfigImportExportManager } from '../managers/ConfigImportExportManager';
import { SiteEditorManager } from '../managers/SiteEditorManager';
import { AppConfig } from '../types';

// 模拟浏览器环境
declare const global: any;
global.chrome = {
  storage: {
    sync: {
      get: (keys: any, callback: Function) => callback({}),
      set: (items: any, callback: Function) => callback()
    }
  }
};

// 简单的测试用例集合
class TestRunner {
  private tests: { [key: string]: Function } = {};
  private results: { [key: string]: boolean } = {};

  addTest(name: string, testFn: Function): void {
    this.tests[name] = testFn;
  }

  async runAll(): Promise<void> {
    console.log('开始测试重构后的代码...');
    
    for (const [name, testFn] of Object.entries(this.tests)) {
      try {
        console.log(`执行测试: ${name}`);
        await testFn();
        this.results[name] = true;
        console.log(`✅ 测试通过: ${name}`);
      } catch (error) {
        this.results[name] = false;
        console.error(`❌ 测试失败: ${name}`, error);
      }
    }

    this.printSummary();
  }

  private printSummary(): void {
    console.log('\n=== 测试结果摘要 ===');
    let passed = 0;
    let total = Object.keys(this.results).length;
    
    for (const [name, result] of Object.entries(this.results)) {
      if (result) passed++;
    }
    
    console.log(`${passed}/${total} 测试通过`);
    
    if (passed === total) {
      console.log('🎉 所有测试通过！');
    } else {
      console.log('❌ 部分测试失败，请检查错误信息。');
    }
  }
}

// 创建测试运行器
const testRunner = new TestRunner();

// 测试类型导入是否正常
testRunner.addTest('测试类型导入', () => {
  const mockConfig: AppConfig = {
    browserSync: true,
    defaultColors: ['#4a9eff', '#4CAF50'],
    settings: []
  };
  
  if (!mockConfig) {
    throw new Error('类型导入或创建失败');
  }
});



// 测试ConfigImportExportManager初始化
testRunner.addTest('测试ConfigImportExportManager初始化', () => {
  const mockConfig: AppConfig = {
    browserSync: true,
    defaultColors: ['#4a9eff', '#4CAF50'],
    settings: []
  };
  
  // 模拟DOM元素
  document.body.innerHTML = `
    <button id="export-btn"></button>
    <input id="import-btn" type="file">
    <button id="backup-btn"></button>
    <button id="restore-btn"></button>
  `;
  
  const importExportManager = new ConfigImportExportManager(
    mockConfig,
    () => {},
    () => {},
    () => {}
  );
  if (!importExportManager) {
    throw new Error('ConfigImportExportManager初始化失败');
  }
});

// 测试SiteEditorManager初始化
testRunner.addTest('测试SiteEditorManager初始化', () => {
  const mockConfig: AppConfig = {
    browserSync: true,
    defaultColors: ['#4a9eff', '#4CAF50'],
    settings: []
  };
  
  // 模拟DOM元素
  document.body.innerHTML = `
    <div id="browser-sync-option"></div>
    <div id="groups-list-container"></div>
    <div id="config-groups-container"></div>
    <button id="add-config-group"></button>
  `;
  
  const siteEditorManager = new SiteEditorManager(
    mockConfig,
    () => {},
    () => {}
  );
  if (!siteEditorManager) {
    throw new Error('SiteEditorManager初始化失败');
  }
});

// 测试AppController初始化
testRunner.addTest('测试AppController初始化', async () => {
  // 模拟必要的DOM元素
  document.body.innerHTML = `
    <div id="browser-sync-option"></div>
    <div id="groups-list-container"></div>
    <div id="config-groups-container"></div>
    <button id="add-config-group"></button>
    <button id="export-btn"></button>
    <input id="import-btn" type="file">
    <button id="backup-btn"></button>
    <button id="restore-btn"></button>
  `;
  
  const appController = new AppController();
  // 模拟异步初始化
  await Promise.resolve(appController);
  
  if (!appController) {
    throw new Error('AppController初始化失败');
  }
});

// 导出测试运行器，方便在浏览器控制台手动执行
global.runTests = () => testRunner.runAll();

// 如果直接运行此文件，则自动执行测试
if (require.main === module) {
  testRunner.runAll().catch(console.error);
}

console.log('测试脚本加载完成，可通过 global.runTests() 运行测试');