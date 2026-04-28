/**
 * Tabs component for multi-panel UIs
 */

import { useState, type ReactNode } from 'react';

export interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, defaultTab, onChange, className = '' }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id ?? '');

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const activeTabContent = tabs.find((t) => t.id === activeTab)?.content;

  return (
    <div className={`w-full ${className}`}>
      {/* Tab headers */}
      <div className="flex border-b-2 border-d2-border overflow-x-auto scrollbar-d2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { handleTabChange(tab.id); }}
            className={`
              px-4 py-2 font-serif font-bold transition-all whitespace-nowrap
              ${
                activeTab === tab.id
                  ? 'text-d2-gold border-b-2 border-d2-gold -mb-0.5'
                  : 'text-d2-border hover:text-d2-white'
              }
            `}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div
        className="mt-4"
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        {activeTabContent}
      </div>
    </div>
  );
}
