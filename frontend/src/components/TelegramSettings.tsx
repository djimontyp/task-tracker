import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/ui';

interface TelegramSettings {
  bot_token: string;
  webhook_base_url: string;
}

interface TelegramSettingsResponse {
  telegram: {
    bot_token: string; // Truncated version from API
    webhook_base_url: string;
  };
}

interface TelegramSettingsFormProps {
  config: {
    wsUrl: string;
    apiBaseUrl: string;
  } | null;
}

export function TelegramSettingsForm({ config }: TelegramSettingsFormProps) {
  // Debug: Force re-render with updated copy functionality
  const [botToken, setBotToken] = useState('');
  const [webhookBaseUrl, setWebhookBaseUrl] = useState('');
  const [copyMessage, setCopyMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [defaultWebhookUrl, setDefaultWebhookUrl] = useState('');

  // Store the full non-truncated token for copying
  const [fullBotToken, setFullBotToken] = useState('');

  // Load initial settings and config
  useEffect(() => {
    const loadSettings = async () => {
      if (!config) return;

      setIsLoading(true);
      try {
        // Add cache-busting timestamp to prevent Edge caching issues
        const timestamp = Date.now();

        // Get default webhook URL from config
        const configResponse = await fetch(`${config.apiBaseUrl}/api/config?_t=${timestamp}`);
        const configData = await configResponse.json();
        setDefaultWebhookUrl(configData.webhookBaseUrl || '');

        // Load current settings
        const settingsResponse = await fetch(`${config.apiBaseUrl}/api/settings?_t=${timestamp}`);
        if (settingsResponse.ok) {
          const settingsData: TelegramSettingsResponse = await settingsResponse.json();
          const tokenFromAPI = settingsData.telegram.bot_token || '';
          setBotToken(tokenFromAPI);
          // Store the full token for copying - if it's truncated, we'll need to handle this differently
          setFullBotToken(tokenFromAPI);
          setWebhookBaseUrl(settingsData.telegram.webhook_base_url || '');
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        setMessage({
          type: 'error',
          text: 'Failed to load current settings. Please try again.'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [config]);

  const handleSave = async () => {
    if (!config || !botToken.trim()) {
      setMessage({
        type: 'error',
        text: 'Bot token is required'
      });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      // Add cache-busting timestamp to prevent caching issues
      const timestamp = Date.now();
      const response = await fetch(`${config.apiBaseUrl}/api/settings?_t=${timestamp}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify({
          telegram: {
            bot_token: botToken.trim(),
            webhook_base_url: webhookBaseUrl.trim() || defaultWebhookUrl,
          }
        })
      });

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Settings saved successfully! Webhook configured.'
        });

        // Update the full token for copying
        setFullBotToken(botToken.trim());

        // Auto-hide success message after 5 seconds
        setTimeout(() => setMessage(null), 5000);
      } else {
        const errorData = await response.json();
        setMessage({
          type: 'error',
          text: errorData.detail || 'Failed to save settings. Please check your bot token and try again.'
        });
      }
    } catch (error) {
      console.error('Save error:', error);
      setMessage({
        type: 'error',
        text: 'Network error. Please check your connection and try again.'
      });
    } finally {
      setIsSaving(false);

      // Auto-hide error messages after 8 seconds
      setTimeout(() => {
        setMessage(prev => prev?.type === 'error' ? null : prev);
      }, 8000);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !isSaving) {
      handleSave();
    }
  };

  // Handle copy token to clipboard
  const handleCopyToken = async () => {
    const tokenToCopy = fullBotToken || botToken;
    if (!tokenToCopy.trim()) {
      setCopyMessage({
        type: 'error',
        text: 'No token to copy'
      });
      setTimeout(() => setCopyMessage(null), 3000);
      return;
    }

    try {
      // Check if clipboard API is available
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(tokenToCopy.trim());
        setCopyMessage({
          type: 'success',
          text: 'Token copied to clipboard!'
        });
      } else {
        // Fallback for older browsers or non-HTTPS
        const textArea = document.createElement('textarea');
        textArea.value = tokenToCopy.trim();
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        textArea.style.top = '0';
        textArea.style.left = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand('copy');
          setCopyMessage({
            type: 'success',
            text: 'Token copied to clipboard!'
          });
        } catch (fallbackError) {
          console.error('Fallback copy failed:', fallbackError);
          setCopyMessage({
            type: 'error',
            text: 'Failed to copy token. Please copy manually.'
          });
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error) {
      console.error('Copy failed:', error);
      setCopyMessage({
        type: 'error',
        text: 'Failed to copy token. Please try again.'
      });
    }

    // Auto-hide copy message after 3 seconds
    setTimeout(() => setCopyMessage(null), 3000);
  };

  const getFinalWebhookUrl = () => {
    const baseUrl = webhookBaseUrl.trim() || defaultWebhookUrl;
    return baseUrl ? `${baseUrl}/webhook/telegram` : 'Not configured';
  };

  if (isLoading) {
    return (
      <div className="telegram-settings-loading">
        <div className="loading-spinner"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="telegram-settings-form">
      <h3 className="telegram-settings-title">🤖 Telegram Bot Configuration</h3>

      {message && (
        <div className={`settings-message ${message.type}`}>
          <span className="message-icon">
            {message.type === 'success' ? '✅' : '❌'}
          </span>
          <span className="message-text">{message.text}</span>
        </div>
      )}

      {copyMessage && (
        <div className={`settings-message copy-message ${copyMessage.type}`}>
          <span className="message-icon">
            {copyMessage.type === 'success' ? '📋' : '❌'}
          </span>
          <span className="message-text">{copyMessage.text}</span>
        </div>
      )}

      <div className="settings-field-group">
        <div className="settings-field">
          <label htmlFor="bot-token" className="field-label">
            Bot Token <span className="field-required">*</span>
          </label>
          <div className="input-with-controls">
            <input
              id="bot-token"
              type="password"
              className="field-input pr-16"
              placeholder="Enter your Telegram bot token"
              value={botToken}
              onChange={(e) => {
                setBotToken(e.target.value);
                // Update full token when typing
                setFullBotToken(e.target.value);
              }}
              onKeyPress={handleKeyPress}
              disabled={isSaving}
            />
            {botToken && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-12 top-1/2 -translate-y-1/2 h-9 w-9 p-0"
                onClick={handleCopyToken}
                disabled={isSaving}
                aria-label="Copy token to clipboard"
                title="Copy token to clipboard"
              >
                📋
              </Button>
            )}
            {botToken && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 p-0"
                onClick={() => {
                  setBotToken('');
                  setFullBotToken('');
                }}
                disabled={isSaving}
                aria-label="Clear token"
                title="Clear token"
              >
                ✕
              </Button>
            )}
          </div>
          <p className="field-help">
            Get your bot token from <a href="https://t.me/botfather" target="_blank" rel="noopener noreferrer">@BotFather</a> on Telegram
          </p>
        </div>

        <div className="settings-field">
          <label htmlFor="webhook-url" className="field-label">
            Webhook Base URL
          </label>
          <div className="input-with-controls">
            <input
              id="webhook-url"
              type="text"
              className="field-input pr-12"
              placeholder={defaultWebhookUrl || 'Enter your webhook base URL'}
              value={webhookBaseUrl}
              onChange={(e) => setWebhookBaseUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSaving}
            />
            {webhookBaseUrl && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 p-0"
                onClick={() => setWebhookBaseUrl('')}
                disabled={isSaving}
                aria-label="Clear webhook URL"
                title="Clear webhook URL"
              >
                ✕
              </Button>
            )}
          </div>
          <div className="webhook-url-display">
            <span className="webhook-label">Final webhook URL:</span>
            <code className="webhook-url">{getFinalWebhookUrl()}</code>
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !botToken.trim()}
          loading={isSaving}
          className="w-full sm:w-auto"
        >
          Save Settings
        </Button>
      </div>
    </div>
  );
}