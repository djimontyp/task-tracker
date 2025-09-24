import React, { useState, useEffect, useRef } from 'react';
import { ThemeProvider, ThemeToggle } from './components/ThemeProvider';
import { TabNavigation, MobileTabNavigation, Tab } from './components/TabNavigation';
import './theme.css';
import './components/ThemeProvider.css';
import './components/TabNavigation.css';
import './App.css';

interface Message {
  id: string;
  content: string;
  author: string;
  timestamp: string;
  chat_id: string;
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

function AppContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [config, setConfig] = useState<{wsUrl: string, apiBaseUrl: string} | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Fetch client configuration from API
    const fetchConfig = async () => {
      try {
        const protocol = window.location.protocol;
        const host = window.location.host;
        const configUrl = `${protocol}//${host}/api/config`;

        const response = await fetch(configUrl);
        const clientConfig = await response.json();
        setConfig(clientConfig);
      } catch (error) {
        console.error('Failed to fetch config, using defaults:', error);
        // Fallback to auto-detection
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const apiProtocol = window.location.protocol;
        setConfig({
          wsUrl: `${protocol}//${window.location.host}/ws`,
          apiBaseUrl: `${apiProtocol}//${window.location.host}`
        });
      }
    };

    fetchConfig();
  }, []);

  useEffect(() => {
    if (!config) return;

    // WebSocket connection
    const connectWebSocket = () => {
      const wsUrl = config.wsUrl.replace('ws://', window.location.protocol === 'https:' ? 'wss://' : 'ws://');

      console.log('Connecting to WebSocket:', wsUrl);
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
      };

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'message') {
          setMessages(prev => {
            // Prevent duplicates
            if (prev.some(msg => msg.id === data.data.id)) {
              return prev;
            }
            return [...prev, data.data].slice(-50); // Keep last 50 messages
          });
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionStatus('disconnected');
        // Reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
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

  // Dashboard Tab Content
  const DashboardContent = () => (
    <div className="dashboard-content animate-fade-in">
      <div className="dashboard-header">
        <h1 className="dashboard-title">🎯 Task Tracker Dashboard</h1>
        <p className="dashboard-subtitle text-secondary">AI-powered task management system</p>

        <div className="connection-status">
          <span className="status-label text-secondary">Status:</span>
          <span className={`status ${connectionStatus}`}>
            {connectionStatus === 'connected' ? '🟢 Connected' :
             connectionStatus === 'connecting' ? '🟡 Connecting...' : '🔴 Disconnected'}
          </span>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card bg-card shadow-md rounded-lg">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3 className="stat-title">Statistics</h3>
            <p className="stat-value">{messages.length}</p>
            <p className="stat-label text-secondary">Messages received</p>
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
        <h3 className="activity-title">💬 Recent Messages</h3>
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="tab-empty">
              <div className="tab-empty-icon">💬</div>
              <p className="tab-empty-title">No messages yet</p>
              <p className="tab-empty-description">Messages will appear here when received via Telegram</p>
            </div>
          ) : (
            messages.slice(-5).reverse().map((message) => (
              <div key={message.id} className="message bg-secondary rounded-md">
                <div className="message-header">
                  <span className="author accent-primary">{message.author}</span>
                  <span className="timestamp text-muted">{formatTimestamp(message.timestamp)}</span>
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
  const SettingsContent = () => (
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

  const tabs: Tab[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '🏠',
      content: <DashboardContent />
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
              <span className="logo-icon">🎯</span>
              <span className="logo-text">Task Tracker</span>
            </div>
            <div className="header-actions">
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
              <span className="logo-icon">🎯</span>
              <span className="logo-text">Task Tracker</span>
            </div>
            <ThemeToggle />
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