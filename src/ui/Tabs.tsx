/**
 * Tabs component for multi-panel UIs
 */

import { useId, useState, type KeyboardEvent, type ReactNode } from 'react';

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
  fill?: boolean;
  keepMounted?: boolean;
}

export function Tabs({
  tabs,
  defaultTab,
  onChange,
  className = '',
  fill = true,
  keepMounted = false
}: TabsProps) {
  const instanceId = useId();
  const [selectedTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id ?? '');

  const activeTab = tabs.some((tab) => tab.id === selectedTab) ? selectedTab : (tabs[0]?.id ?? '');

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const focusTab = (tabId: string): void => {
    window.requestAnimationFrame(() => {
      document.getElementById(`${instanceId}-tab-${tabId}`)?.focus();
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

  return (
    <div className={`d2-tabs-view ${fill ? 'd2-tabs-fill' : ''} w-full ${className}`}>
      {/* Tab headers */}
      <div className="d2-tabs flex flex-wrap shrink-0" role="tablist">
        {tabs.map((tab, index) => (
          <button
            id={`${instanceId}-tab-${tab.id}`}
            key={tab.id}
            onClick={() => {
              handleTabChange(tab.id);
            }}
            onKeyDown={(event) => {
              handleTabKeyDown(event, index);
            }}
            className={`
              d2-tab min-h-[44px] min-w-[5rem] flex-1 break-words px-2 py-1 font-serif transition-colors
              ${activeTab === tab.id ? 'text-d2-gold' : 'text-d2-white/70 hover:text-d2-white'}
            `}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${instanceId}-tabpanel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {(keepMounted ? tabs : tabs.filter((tab) => tab.id === activeTab)).map((tab) => (
        <div
          key={tab.id}
          className="d2-tab-content"
          role="tabpanel"
          hidden={tab.id !== activeTab}
          id={`${instanceId}-tabpanel-${tab.id}`}
          aria-labelledby={`${instanceId}-tab-${tab.id}`}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
