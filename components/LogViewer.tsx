import React, { useState, useEffect, useMemo, Fragment } from 'react';
import { X, Trash2, Download, Search, Filter, ChevronDown, ChevronUp, FileText, Check, ChevronRight } from 'lucide-react';
import { Listbox, Transition } from '@headlessui/react';
import { logger, LogEntry, LogLevel, Component, ComponentGroups } from '../utils/logger';

interface LogViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogViewer: React.FC<LogViewerProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<LogLevel | 'all'>('all');
  const [selectedComponent, setSelectedComponent] = useState<string>('all');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (isOpen) {
      logger.fetchLogsFromBackground().then(fetchedLogs => {
        setLogs(fetchedLogs);
      });
      
      setLogs(logger.getLogs());
      
      const listener = (newLogs: LogEntry[]) => {
        setLogs(newLogs);
      };
      logger.addListener(listener);
      
      return () => {
        logger.removeListener(listener);
      };
    }
  }, [isOpen]);

  const availableComponents = useMemo(() => {
    return logger.getComponents();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (selectedLevel !== 'all' && log.level !== selectedLevel) {
        return false;
      }
      
      if (selectedComponent !== 'all' && log.component !== selectedComponent) {
        return false;
      }
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          log.message.toLowerCase().includes(query) ||
          log.component.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  }, [logs, selectedLevel, selectedComponent, searchQuery]);

  useEffect(() => {
    if (autoScroll && isOpen && filteredLogs.length > 0) {
      const container = document.getElementById('log-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [filteredLogs, autoScroll, isOpen]);

  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const clearLogs = () => {
    if (confirm('Are you sure you want to clear all logs?')) {
      logger.clearLogs();
    }
  };

  const exportLogs = () => {
    const data = logger.exportLogs();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enveil-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const getLevelColor = (level: LogLevel): string => {
    switch (level) {
      case 'error':
        return 'text-red-500 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800';
      case 'warn':
        return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800';
      case 'info':
        return 'text-blue-500 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800';
      case 'debug':
        return 'text-purple-500 bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700';
    }
  };

  const getLevelBadge = (level: LogLevel): React.ReactNode => {
    const colors: Record<LogLevel, string> = {
      log: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      warn: 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      error: 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200',
      debug: 'bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      info: 'bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    };

    return (
      <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded ${colors[level]}`}>
        {level}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative ml-auto w-full max-w-4xl h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Log Viewer</h2>
            <span className="text-xs text-gray-500 dark:text-slate-400">
              {filteredLogs.length} logs
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={exportLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Export logs"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={clearLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              title="Clear logs"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 border-b dark:border-slate-700 bg-white dark:bg-slate-900 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Level:</span>
              
              <Listbox value={selectedLevel} onChange={setSelectedLevel}>
                <div className="relative">
                  <Listbox.Button className="px-3 py-1.5 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-w-[100px] text-left">
                    <div className="flex items-center justify-between">
                      <span>
                        {selectedLevel === 'all' ? 'All' : selectedLevel.charAt(0).toUpperCase() + selectedLevel.slice(1)}
                      </span>
                      <ChevronRight className="w-4 h-4 transform rotate-90" />
                    </div>
                  </Listbox.Button>
                  <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-20 mt-1 w-full bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {[
                        { value: 'all', label: 'All' },
                        { value: 'log', label: 'Log' },
                        { value: 'info', label: 'Info' },
                        { value: 'warn', label: 'Warn' },
                        { value: 'error', label: 'Error' },
                        { value: 'debug', label: 'Debug' }
                      ].map((option) => (
                        <Listbox.Option
                          key={option.value}
                          className={({ active }) =>
                            `${active ? 'bg-gray-100 dark:bg-slate-700' : ''} cursor-default select-none relative py-2 pl-10 pr-4 text-sm text-gray-900 dark:text-white`
                          }
                          value={option.value}
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                {option.label}
                              </span>
                              {selected ? (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-500">
                                  <Check className="w-4 h-4" />
                                </span>
                              ) : null}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">Component:</span>
              
              <Listbox value={selectedComponent} onChange={setSelectedComponent}>
                <div className="relative">
                  <Listbox.Button className="px-3 py-1.5 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-w-[160px] text-left">
                    <div className="flex items-center justify-between">
                      <span className="truncate">
                        {selectedComponent === 'all' ? 'All' : selectedComponent}
                      </span>
                      <ChevronRight className="w-4 h-4 transform rotate-90 flex-shrink-0 ml-2" />
                    </div>
                  </Listbox.Button>
                  <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-20 mt-1 w-full bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-lg max-h-80 overflow-auto">
                      <Listbox.Option
                        className={({ active }) =>
                          `${active ? 'bg-gray-100 dark:bg-slate-700' : ''} cursor-default select-none relative py-2 pl-10 pr-4 text-sm text-gray-900 dark:text-white`
                        }
                        value="all"
                      >
                        {({ selected }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                              All
                            </span>
                            {selected ? (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-500">
                                <Check className="w-4 h-4" />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Listbox.Option>

                      {ComponentGroups.map((group, groupIndex) => (
                        <Fragment key={group.label}>
                          {groupIndex > 0 && (
                            <div className="border-t border-gray-200 dark:border-slate-700 my-1" />
                          )}
                          <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/50 sticky top-0">
                            {group.label}
                          </div>
                          {group.components.map((component) => {
                            const hasLogs = availableComponents.includes(component);
                            return (
                              <Listbox.Option
                                key={component}
                                className={({ active }) =>
                                  `${active ? 'bg-gray-100 dark:bg-slate-700' : ''} ${!hasLogs ? 'text-gray-400 dark:text-gray-600' : ''} cursor-default select-none relative py-2 pl-10 pr-4 text-sm text-gray-900 dark:text-white`
                                }
                                value={component}
                                disabled={!hasLogs}
                              >
                                {({ selected }) => (
                                  <>
                                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                      {component}
                                      {!hasLogs && ' (0)'}
                                    </span>
                                    {selected ? (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-500">
                                        <Check className="w-4 h-4" />
                                      </span>
                                    ) : null}
                                  </>
                                )}
                              </Listbox.Option>
                            );
                          })}
                        </Fragment>
                      ))}

                      {availableComponents.some(c => !ComponentGroups.flatMap(g => g.components).includes(c as Component)) && (
                        <>
                          <div className="border-t border-gray-200 dark:border-slate-700 my-1" />
                          <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/50">
                            Other
                          </div>
                          {availableComponents
                            .filter(c => !ComponentGroups.flatMap(g => g.components).includes(c as Component))
                            .map((component) => (
                              <Listbox.Option
                                key={component}
                                className={({ active }) =>
                                  `${active ? 'bg-gray-100 dark:bg-slate-700' : ''} cursor-default select-none relative py-2 pl-10 pr-4 text-sm text-gray-900 dark:text-white`
                                }
                                value={component}
                              >
                                {({ selected }) => (
                                  <>
                                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                      {component}
                                    </span>
                                    {selected ? (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-500">
                                        <Check className="w-4 h-4" />
                                      </span>
                                    ) : null}
                                  </>
                                )}
                              </Listbox.Option>
                            ))}
                        </>
                      )}
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Auto scroll
              </label>
            </div>
          </div>
        </div>

        <div 
          id="log-container"
          className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900 p-4 space-y-2"
        >
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center py-12">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-lg">No logs yet</p>
                <p className="text-sm">Logs will be recorded automatically when the app runs</p>
              </div>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isExpanded = expandedLogs.has(log.id);
              const hasData = log.data && log.data.length > 0;
              
              return (
                <div 
                  key={log.id}
                  className={`border rounded-lg overflow-hidden transition-all ${getLevelColor(log.level)}`}
                >
                  <div 
                    className={`flex items-start gap-3 p-3 cursor-pointer hover:brightness-95 transition-all ${hasData ? 'hover:brightness-95' : ''}`}
                    onClick={() => hasData && toggleLogExpansion(log.id)}
                  >
                    <div className="flex-shrink-0">
                      {getLevelBadge(log.level)}
                    </div>
                    
                    <div className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {formatTimestamp(log.timestamp)}
                    </div>
                    
                    <div className="flex-shrink-0">
                      <span className="px-2 py-0.5 text-xs font-semibold bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded">
                        {log.component}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white break-words">
                        {log.message}
                      </p>
                    </div>
                    
                    {hasData && (
                      <div className="flex-shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        )}
                      </div>
                    )}
                  </div>
                  
                  {isExpanded && hasData && (
                    <div className="border-t border-inherit bg-gray-50 dark:bg-slate-800/50 p-3">
                      <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
