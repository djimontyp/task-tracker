import React, { ReactNode } from 'react';

export interface Tab {
  id: string;
  label: string;
  icon?: string;
  content: ReactNode;
  badge?: number;
  disabled?: boolean;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function TabNavigation({ tabs, activeTab, onTabChange, className = '' }: TabNavigationProps) {
  return (
    <div className={`tab-navigation ${className}`}>
      {/* Tab Headers */}
      <div className="tab-headers" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            disabled={tab.disabled}
            className={`tab-header focus-ring ${activeTab === tab.id ? 'active' : ''} ${
              tab.disabled ? 'disabled' : ''
            }`}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
          >
            {tab.icon && <span className="tab-icon">{tab.icon}</span>}
            <span className="tab-label">{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="tab-badge">{tab.badge > 99 ? '99+' : tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content-container">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            id={`tabpanel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.id}`}
            className={`tab-content animate-fade-in ${activeTab === tab.id ? 'active' : 'hidden'}`}
          >
            {activeTab === tab.id && tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}

// Mobile tab navigation (bottom tabs for mobile)
export function MobileTabNavigation({ tabs, activeTab, onTabChange, className = '' }: TabNavigationProps) {
  return (
    <div className={`mobile-tab-navigation ${className}`}>
      {/* Content Area */}
      <div className="mobile-tab-content-container">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            id={`mobile-tabpanel-${tab.id}`}
            role="tabpanel"
            className={`mobile-tab-content ${activeTab === tab.id ? 'active' : 'hidden'}`}
          >
            {activeTab === tab.id && tab.content}
          </div>
        ))}
      </div>

      {/* Bottom Tab Bar */}
      <div className="mobile-tab-bar" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            disabled={tab.disabled}
            className={`mobile-tab-button focus-ring ${activeTab === tab.id ? 'active' : ''} ${
              tab.disabled ? 'disabled' : ''
            }`}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
          >
            {tab.icon && <span className="mobile-tab-icon">{tab.icon}</span>}
            <span className="mobile-tab-label">{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="mobile-tab-badge">{tab.badge > 99 ? '99+' : tab.badge}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}