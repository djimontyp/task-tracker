import React, { useState, useEffect, useRef } from 'react';
import { ThemeProvider, ThemeToggle } from './components/ThemeProvider';
import { TabNavigation, MobileTabNavigation, Tab } from './components/TabNavigation';
import { MessageFilters, MessageFiltersState } from './components/MessageFilters';
import './theme.css';
import './components/ThemeProvider.css';
import './components/TabNavigation.css';
import './components/MessageFilters.css';
import './App.css';

interface Message {
  id: number;
  external_message_id: string;
  content: string;
  author: string;
  sent_at: string;
  source_name: string;
  analyzed: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'completed';
  created_at: string;
}

interface WebhookSettings {
  protocol: 'http' | 'https';
  host: string;
  webhookUrl: string;
  isActive: boolean;
}

interface WebhookOperationResult {
  success: boolean;
  message: string;
}

function AppContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [config, setConfig] = useState<{wsUrl: string, apiBaseUrl: string} | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{type: 'success' | 'error' | null; message: string}>({type: null, message: ''});
  const [messageFilters, setMessageFilters] = useState<MessageFiltersState>({
    author: '',
    source: '',
    dateFrom: '',
    dateTo: ''
  });
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    // Fetch client configuration from API
    const fetchConfig = async () => {
      try {
        const protocol = window.location.protocol;
        const apiHost = window.location.hostname + ':8000';
        const configUrl = `${protocol}//${apiHost}/api/config`;

        const response = await fetch(configUrl);
        const clientConfig = await response.json();
        setConfig(clientConfig);
      } catch (error) {
        console.error('Failed to fetch config, using defaults:', error);
        // Fallback to auto-detection - API is always on port 8000
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const apiProtocol = window.location.protocol;
        const apiHost = window.location.hostname + ':8000';
        setConfig({
          wsUrl: `${protocol}//${apiHost}/ws`,
          apiBaseUrl: `${apiProtocol}//${apiHost}`
        });
      }
    };

    fetchConfig();
  }, []);

  useEffect(() => {
    if (!config) return;

    // Load existing messages from API
    loadMessagesFromAPI();

    // WebSocket connection
    const connectWebSocket = () => {
      const wsUrl = config.wsUrl.replace('ws://', window.location.protocol === 'https:' ? 'wss://' : 'ws://');

      console.log('Connecting to WebSocket:', wsUrl);
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
      };

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);

        if (data.type === 'connection') {
          console.log('WebSocket connection confirmed:', data.data.message);
        } else if (data.type === 'message') {
          // Real-time messages only - no deduplication needed since no history
          const messageData = { ...data.data, analyzed: data.data.analyzed || false };

          // Always update the main messages state for real-time display
          setMessages(prev => {
            // Keep only the last 10 real-time messages for live display
            return [messageData, ...prev].slice(0, 10);
          });

          // Apply filters to the new message if filters are active
          const hasActiveFilters = Object.values(messageFilters).some(v => v !== '');
          if (hasActiveFilters && matchesFilters(messageData, messageFilters)) {
            setFilteredMessages(prev => [messageData, ...prev].slice(0, 50));
          } else if (!hasActiveFilters) {
            // If no filters are active, update filtered messages too
            setFilteredMessages(prev => [messageData, ...prev].slice(0, 50));
          }

          console.log('💬 New real-time message:', messageData);
        } else if (data.type === 'task_created') {
          // Handle new tasks created from analysis
          setTasks(prev => [data.data, ...prev]);
          console.log('✅ New task created:', data.data);
        }
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason);
        setConnectionStatus('disconnected');

        // Exponential backoff reconnection
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1})`);
          reconnectAttempts.current++;
          setTimeout(connectWebSocket, delay);
        } else {
          console.log('Max reconnection attempts reached');
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('disconnected');
      };
    };

    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [config]);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const handleAnalyzeDay = async () => {
    if (!config?.apiBaseUrl) {
      setAnalysisResult({type: 'error', message: 'API configuration not available'});
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult({type: null, message: ''});

    try {
      const response = await fetch(`${config.apiBaseUrl}/api/analyze-day`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setAnalysisResult({
          type: 'success',
          message: `Successfully analyzed ${result.messages_processed} messages and created ${result.tasks_created} task(s)`
        });

        // Refresh messages to show updated analyzed status
        await loadMessagesFromAPI();
      } else {
        setAnalysisResult({
          type: 'error',
          message: result.message || 'Analysis failed'
        });
      }
    } catch (error) {
      setAnalysisResult({
        type: 'error',
        message: 'Failed to connect to API for analysis'
      });
    }

    setIsAnalyzing(false);
    setTimeout(() => setAnalysisResult({type: null, message: ''}), 5000);
  };

  const loadMessagesFromAPI = async (filters?: MessageFiltersState) => {
    if (!config?.apiBaseUrl) return;

    try {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      queryParams.set('limit', '50'); // Increase limit when filtering

      const currentFilters = filters || messageFilters;
      if (currentFilters.author) queryParams.set('author', currentFilters.author);
      if (currentFilters.source) queryParams.set('source', currentFilters.source);
      if (currentFilters.dateFrom) queryParams.set('date_from', currentFilters.dateFrom);
      if (currentFilters.dateTo) queryParams.set('date_to', currentFilters.dateTo);

      const url = `${config.apiBaseUrl}/api/messages?${queryParams.toString()}`;
      const response = await fetch(url);

      if (response.ok) {
        const apiMessages = await response.json();
        setFilteredMessages(apiMessages);
        // Keep unfiltered messages for real-time updates
        if (!filters && Object.values(currentFilters).every(v => !v)) {
          setMessages(apiMessages);
        }
      }
    } catch (error) {
      console.error('Failed to load messages from API:', error);
    }
  };

  const handleFiltersChange = async (filters: MessageFiltersState) => {
    setMessageFilters(filters);
    await loadMessagesFromAPI(filters);
  };

  const matchesFilters = (message: Message, filters: MessageFiltersState): boolean => {
    // Author filter
    if (filters.author && !message.author.toLowerCase().includes(filters.author.toLowerCase())) {
      return false;
    }

    // Source filter
    if (filters.source && !message.source_name.toLowerCase().includes(filters.source.toLowerCase())) {
      return false;
    }

    // Date filters
    const messageDate = new Date(message.sent_at);
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      if (messageDate < fromDate) {
        return false;
      }
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // Include entire day
      if (messageDate > toDate) {
        return false;
      }
    }

    return true;
  };

  const getUnanalyzedCount = () => {
    return messages.filter(msg => !msg.analyzed).length;
  };

  // Dashboard Tab Content
  const DashboardContent = () => (
    <div className="dashboard-content animate-fade-in">
      <div className="dashboard-header">
        <h2 className="dashboard-title">📊 Dashboard</h2>
        <div className="dashboard-actions">
          <button
            className={`btn-primary analyze-btn ${isAnalyzing ? 'loading' : ''}`}
            onClick={handleAnalyzeDay}
            disabled={isAnalyzing || getUnanalyzedCount() === 0}
            title={getUnanalyzedCount() === 0 ? 'No unanalyzed messages' : `Analyze ${getUnanalyzedCount()} unanalyzed messages`}
          >
            {isAnalyzing ? '⏳ Analyzing...' : `🤖 Analyze Day (${getUnanalyzedCount()})`}
          </button>
        </div>
      </div>

      {analysisResult.type && (
        <div className={`analysis-status ${analysisResult.type}`}>
          {analysisResult.message}
        </div>
      )}

      <div className="dashboard-grid">
        <div className="stat-card bg-card shadow-md rounded-lg">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3 className="stat-title">Messages</h3>
            <p className="stat-value">{messages.length}</p>
            <p className="stat-label text-secondary">{getUnanalyzedCount()} unanalyzed</p>
          </div>
        </div>

        <div className="stat-card bg-card shadow-md rounded-lg">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3 className="stat-title">Tasks</h3>
            <p className="stat-value">{tasks.length}</p>
            <p className="stat-label text-secondary">Total tasks</p>
          </div>
        </div>

        <div className="stat-card bg-card shadow-md rounded-lg">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <h3 className="stat-title">Performance</h3>
            <p className="stat-value">98%</p>
            <p className="stat-label text-secondary">System uptime</p>
          </div>
        </div>
      </div>

      <div className="recent-activity bg-card shadow-md rounded-lg">
        <h3 className="activity-title">⚡ Recent Messages</h3>
        <div className="messages-container">
          {(filteredMessages.length > 0 ? filteredMessages : messages).length === 0 ? (
            <div className="tab-empty">
              <div className="tab-empty-icon">⚡</div>
              <p className="tab-empty-title">No messages found</p>
              <p className="tab-empty-description">Messages will appear here when received</p>
            </div>
          ) : (
            (filteredMessages.length > 0 ? filteredMessages : messages).slice(0, 5).map((message) => (
              <div key={message.id} className="message bg-secondary rounded-md">
                <div className="message-header">
                  <div className="message-status-icon" title={message.analyzed ? 'Analyzed' : 'Pending analysis'}>
                    {message.analyzed ? '✅' : '⏳'}
                  </div>
                  <span className="author accent-primary">{message.author}</span>
                  <span className="timestamp text-muted">{formatTimestamp(message.sent_at)}</span>
                  <span className="source text-muted">({message.source_name})</span>
                </div>
                <div className="message-content text-primary">{message.content}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  // Tasks Tab Content
  const TasksContent = () => (
    <div className="tasks-content animate-fade-in">
      <div className="tasks-header">
        <h2 className="tasks-title">📋 Task Management</h2>
        <button className="btn-primary">
          ➕ New Task
        </button>
      </div>

      <div className="task-filters">
        <div className="filter-group">
          <label className="filter-label text-secondary">Status:</label>
          <select className="filter-select">
            <option value="all">All Tasks</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label text-secondary">Priority:</label>
          <select className="filter-select">
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="tab-empty">
          <div className="tab-empty-icon">📋</div>
          <p className="tab-empty-title">No tasks yet</p>
          <p className="tab-empty-description">Create your first task to get started with task management</p>
        </div>
      ) : (
        <div className="tasks-list">
          {tasks.map((task) => (
            <div key={task.id} className="task-card bg-card shadow-sm rounded-md">
              <div className="task-header">
                <h4 className="task-title">{task.title}</h4>
                <span className={`task-priority priority-${task.priority}`}>
                  {task.priority}
                </span>
              </div>
              <p className="task-description text-secondary">{task.description}</p>
              <div className="task-meta">
                <span className={`task-status status-${task.status}`}>
                  {task.status.replace('_', ' ')}
                </span>
                <span className="task-date text-muted">
                  {formatTimestamp(task.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Analytics Tab Content
  const AnalyticsContent = () => (
    <div className="analytics-content animate-fade-in">
      <h2 className="analytics-title">📈 Analytics</h2>

      <div className="analytics-grid">
        <div className="analytics-card bg-card shadow-md rounded-lg">
          <h3 className="card-title">Task Distribution</h3>
          <div className="tab-empty">
            <div className="tab-empty-icon">📊</div>
            <p className="tab-empty-title">Analytics Coming Soon</p>
            <p className="tab-empty-description">Task analytics and visualizations will be available here</p>
          </div>
        </div>

        <div className="analytics-card bg-card shadow-md rounded-lg">
          <h3 className="card-title">Performance Metrics</h3>
          <div className="tab-empty">
            <div className="tab-empty-icon">⚡</div>
            <p className="tab-empty-title">Metrics Dashboard</p>
            <p className="tab-empty-description">System performance metrics will be displayed here</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Settings Tab Content
  const SettingsContent = () => {
    const [webhookSettings, setWebhookSettings] = useState<WebhookSettings>({
      protocol: 'https',
      host: '',
      webhookUrl: '',
      isActive: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [operationStatus, setOperationStatus] = useState<{type: 'success' | 'error' | null; message: string}>({type: null, message: ''});

    // Load webhook settings on component mount
    useEffect(() => {
      const loadWebhookSettings = async () => {
        if (!config?.apiBaseUrl) return;

        try {
          const response = await fetch(`${config.apiBaseUrl}/api/webhook-settings`);
          if (response.ok) {
            const result = await response.json();
            if (result.telegram) {
              setWebhookSettings({
                protocol: result.telegram.protocol || 'https',
                host: result.telegram.host || '',
                webhookUrl: result.telegram.webhook_url || '',
                isActive: result.telegram.is_active || false
              });
            }
          }
        } catch (error) {
          console.error('Failed to load webhook settings:', error);
        }
      };

      loadWebhookSettings();
    }, [config]);

    // Update webhook URL when protocol or host changes
    useEffect(() => {
      if (webhookSettings.host) {
        const url = `${webhookSettings.protocol}://${webhookSettings.host}/webhook/telegram`;
        setWebhookSettings(prev => ({ ...prev, webhookUrl: url }));
      } else {
        setWebhookSettings(prev => ({ ...prev, webhookUrl: '' }));
      }
    }, [webhookSettings.protocol, webhookSettings.host]);

    const handleSaveSettings = async () => {
      if (!config?.apiBaseUrl || !webhookSettings.host?.trim()) {
        setOperationStatus({type: 'error', message: 'Host is required'});
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`${config.apiBaseUrl}/api/webhook-settings`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            protocol: webhookSettings.protocol,
            host: webhookSettings.host
          })
        });

        const result = await response.json();
        setOperationStatus({
          type: result.success ? 'success' : 'error',
          message: result.message
        });
      } catch (error) {
        setOperationStatus({type: 'error', message: 'Failed to save settings'});
      }
      setIsLoading(false);
      setTimeout(() => setOperationStatus({type: null, message: ''}), 3000);
    };

    const handleSetWebhook = async () => {
      if (!config?.apiBaseUrl || !webhookSettings.webhookUrl) {
        setOperationStatus({type: 'error', message: 'Please configure webhook URL first'});
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`${config.apiBaseUrl}/api/webhook-settings/telegram/set`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            protocol: webhookSettings.protocol,
            host: webhookSettings.host
          })
        });

        const result = await response.json();
        setWebhookSettings(prev => ({ ...prev, isActive: result.success }));
        setOperationStatus({
          type: result.success ? 'success' : 'error',
          message: result.message
        });
      } catch (error) {
        setOperationStatus({type: 'error', message: 'Failed to set webhook'});
      }
      setIsLoading(false);
      setTimeout(() => setOperationStatus({type: null, message: ''}), 3000);
    };

    const handleDeleteWebhook = async () => {
      if (!config?.apiBaseUrl) return;

      setIsLoading(true);
      try {
        const response = await fetch(`${config.apiBaseUrl}/api/webhook-settings/telegram`, {
          method: 'DELETE'
        });

        const result = await response.json();
        setWebhookSettings(prev => ({ ...prev, isActive: false }));
        setOperationStatus({
          type: result.success ? 'success' : 'error',
          message: result.message
        });
      } catch (error) {
        setOperationStatus({type: 'error', message: 'Failed to delete webhook'});
      }
      setIsLoading(false);
      setTimeout(() => setOperationStatus({type: null, message: ''}), 3000);
    };

    return (
      <div className="settings-content animate-fade-in">
        <h2 className="settings-title">⚙️ Settings</h2>

        <div className="settings-sections">
          <div className="settings-section bg-card shadow-sm rounded-lg">
            <h3 className="section-title">Appearance</h3>
            <div className="setting-item">
              <label className="setting-label">Theme</label>
              <ThemeToggle />
            </div>
          </div>

          <div className="settings-section bg-card shadow-sm rounded-lg">
            <h3 className="section-title">Telegram Webhook Configuration</h3>

            <div className="webhook-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Protocol</label>
                  <select
                    className="form-select"
                    value={webhookSettings.protocol}
                    onChange={(e) => setWebhookSettings(prev => ({ ...prev, protocol: e.target.value as 'http' | 'https' }))}
                    disabled={isLoading}
                  >
                    <option value="https">HTTPS</option>
                    <option value="http">HTTP</option>
                  </select>
                </div>

                <div className="form-group flex-1">
                  <label className="form-label">Host</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="your-domain.ngrok-free.app"
                    value={webhookSettings.host}
                    onChange={(e) => setWebhookSettings(prev => ({ ...prev, host: e.target.value }))}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Generated Webhook URL</label>
                <div className="webhook-url-display">
                  {webhookSettings.webhookUrl || 'Enter host to generate URL'}
                </div>
              </div>

              <div className="webhook-status">
                <span className="setting-label">Webhook Status</span>
                <div className={`webhook-status-indicator ${webhookSettings.isActive ? 'active' : 'inactive'}`}>
                  {webhookSettings.isActive ? '✅ Active' : '❌ Inactive'}
                </div>
              </div>

              <div className="webhook-actions">
                <button
                  className="btn-secondary"
                  onClick={handleSaveSettings}
                  disabled={isLoading || !webhookSettings.host.trim()}
                >
                  {isLoading ? '⏳ Saving...' : '💾 Save Settings'}
                </button>

                <button
                  className="btn-primary"
                  onClick={handleSetWebhook}
                  disabled={isLoading || !webhookSettings.webhookUrl}
                >
                  {isLoading ? '⏳ Setting...' : '🔗 Set Webhook'}
                </button>

                <button
                  className="btn-danger"
                  onClick={handleDeleteWebhook}
                  disabled={isLoading || !webhookSettings.isActive}
                >
                  {isLoading ? '⏳ Deleting...' : '🗑️ Delete Webhook'}
                </button>
              </div>

              {operationStatus.type && (
                <div className={`operation-status ${operationStatus.type}`}>
                  {operationStatus.message}
                </div>
              )}
            </div>
          </div>

          <div className="settings-section bg-card shadow-sm rounded-lg">
            <h3 className="section-title">Notifications</h3>
            <div className="setting-item">
              <label className="setting-label">Real-time Updates</label>
              <div className={`toggle ${connectionStatus === 'connected' ? 'enabled' : 'disabled'}`}>
                {connectionStatus === 'connected' ? '✅' : '❌'}
              </div>
            </div>
          </div>

          <div className="settings-section bg-card shadow-sm rounded-lg">
            <h3 className="section-title">System Info</h3>
            <div className="setting-item">
              <span className="setting-label">API Status</span>
              <span className="setting-value text-secondary">Connected</span>
            </div>
            <div className="setting-item">
              <span className="setting-label">WebSocket</span>
              <span className="setting-value text-secondary">{config?.wsUrl || 'Loading...'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Messages Tab Content with Filters
  const MessagesContent = () => (
    <div className="messages-content animate-fade-in">
      <div className="messages-header">
        <h2 className="messages-title">💬 Messages</h2>
      </div>

      {config?.apiBaseUrl && (
        <MessageFilters
          onFiltersChange={handleFiltersChange}
          apiBaseUrl={config.apiBaseUrl}
          className="mb-4"
        />
      )}

      <div className="messages-list bg-card shadow-sm rounded-lg">
        <div className="messages-container">
          {(filteredMessages.length > 0 ? filteredMessages : messages).length === 0 ? (
            <div className="tab-empty">
              <div className="tab-empty-icon">💬</div>
              <p className="tab-empty-title">No messages found</p>
              <p className="tab-empty-description">
                {Object.values(messageFilters).some(v => v)
                  ? 'Try adjusting your filters to see more messages'
                  : 'Messages will appear here when received via Telegram'
                }
              </p>
            </div>
          ) : (
            (filteredMessages.length > 0 ? filteredMessages : messages).map((message) => (
              <div key={message.id} className="message bg-secondary rounded-md">
                <div className="message-header">
                  <div className="message-status-icon" title={message.analyzed ? 'Analyzed' : 'Pending analysis'}>
                    {message.analyzed ? '✅' : '⏳'}
                  </div>
                  <span className="author accent-primary">{message.author}</span>
                  <span className="timestamp text-muted">{formatTimestamp(message.sent_at)}</span>
                  <span className="source text-muted">({message.source_name})</span>
                </div>
                <div className="message-content text-primary">{message.content}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const tabs: Tab[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '🏠',
      content: <DashboardContent />
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: '💬',
      content: <MessagesContent />,
      badge: (filteredMessages.length > 0 ? filteredMessages : messages).length
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: '📋',
      content: <TasksContent />,
      badge: tasks.length
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: '📈',
      content: <AnalyticsContent />
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      content: <SettingsContent />
    }
  ];

  return (
    <div className="app">
      {/* Desktop Layout */}
      <div className="desktop-layout">
        <div className="app-header bg-secondary border-b border-primary">
          <div className="header-content">
            <div className="logo">
              <span className="logo-text">Task Tracker</span>
            </div>
            <div className="header-actions">
              <div className={`connection-status ${connectionStatus}`}>
                <span className="status-dot"></span>
                <span className="status-text">
                  {connectionStatus === 'connected' ? 'WebSocket Connected' :
                   connectionStatus === 'connecting' ? 'Connecting to API...' : 'API Disconnected'}
                </span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
        <TabNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          className="main-tabs"
        />
      </div>

      {/* Mobile Layout */}
      <div className="mobile-layout">
        <div className="mobile-header bg-secondary border-b border-primary">
          <div className="header-content">
            <div className="logo">
              <span className="logo-text">Task Tracker</span>
            </div>
            <div className="header-actions">
              <div className={`connection-status ${connectionStatus}`}>
                <span className="status-dot"></span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
        <MobileTabNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          className="main-mobile-tabs"
        />
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;