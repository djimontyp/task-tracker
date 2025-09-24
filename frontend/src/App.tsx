import React, { useState, useEffect, useRef } from 'react';
import './App.css';

interface Message {
  id: string;
  content: string;
  author: string;
  timestamp: string;
  chat_id: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [config, setConfig] = useState<{wsUrl: string, apiBaseUrl: string} | null>(null);
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

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎯 Task Tracker Dashboard</h1>
        <p>AI-powered task management system</p>

        <div className="connection-status">
          Status: <span className={`status ${connectionStatus}`}>
            {connectionStatus === 'connected' ? '🟢 Connected' :
             connectionStatus === 'connecting' ? '🟡 Connecting...' : '🔴 Disconnected'}
          </span>
        </div>

        <div className="dashboard-grid">
          <div className="card">
            <h3>📊 Statistics</h3>
            <p>Messages: {messages.length}</p>
            <p>Task analytics and metrics</p>
          </div>

          <div className="card messages-card">
            <h3>💬 Real-time Messages</h3>
            <div className="messages-container">
              {messages.length === 0 ? (
                <p className="no-messages">No messages yet...</p>
              ) : (
                messages.slice().reverse().map((message) => (
                  <div key={message.id} className="message">
                    <div className="message-header">
                      <span className="author">{message.author}</span>
                      <span className="timestamp">{formatTimestamp(message.timestamp)}</span>
                    </div>
                    <div className="message-content">{message.content}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card">
            <h3>⚙️ Settings</h3>
            <p>System configuration</p>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;