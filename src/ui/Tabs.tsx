/**
 * Tabs component for multi-panel UIs
 */

import { useState, type KeyboardEvent, type ReactNode } from 'react';

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

  const focusTab = (tabId: string): void => {
    window.requestAnimationFrame(() => {
      document.getElementById(`tab-${tabId}`)?.focus();
    });
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number): void => {
    if (tabs.length === 0) return;
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabs.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    const nextTab = tabs[nextIndex];
    if (!nextTab) return;
    handleTabChange(nextTab.id);
    focusTab(nextTab.id);
  };

  const activeTabContent = tabs.find((t) => t.id === activeTab)?.content;

  return (
    <div className={`w-full ${className}`}>
      {/* Tab headers */}
      <div className="flex border-b-2 border-d2-border overflow-x-auto scrollbar-d2" role="tablist">
        {tabs.map((tab, index) => (
          <button
            id={`tab-${tab.id}`}
            key={tab.id}
            onClick={() => { handleTabChange(tab.id); }}
            onKeyDown={(event) => { handleTabKeyDown(event, index); }}
            className={`
              min-h-[44px] px-4 py-2 font-serif font-bold transition-all whitespace-nowrap
              ${
                activeTab === tab.id
                  ? 'text-d2-gold border-b-2 border-d2-gold -mb-0.5'
                  : 'text-d2-border hover:text-d2-white'
              }
            `}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
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
