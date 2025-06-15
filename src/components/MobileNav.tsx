import React, { useState, useEffect, useCallback } from 'react';
import type { SidebarItem } from '@/src/libs/sidebar';

interface Category {
  label: string;
  link: string;
  isCurrent: boolean;
}

interface MobileNavProps {
  categories: Category[];
  sidebar?: SidebarItem[];
  currentPath: string;
}

export default function MobileNav({ categories, sidebar, currentPath }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [collapsedStates, setCollapsedStates] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    const processItems = (items: SidebarItem[], depth = 0) => {
      items.forEach((item) => {
        const key = item.link || item.label || `item-${depth}`;
        if (item.collapsed !== undefined) {
          initialState[key] = item.collapsed;
        }
        if (item.items?.length) {
          processItems(item.items, depth + 1);
        }
      });
    };
    if (sidebar) {
      processItems(sidebar);
    }
    return initialState;
  });

  const toggleCollapsed = useCallback((key: string) => {
    setCollapsedStates((prev) => {
      const newState = { ...prev };
      newState[key] = !prev[key];
      return newState;
    });
  }, []);

  // Generate breadcrumb path
  const generateBreadcrumb = () => {
    const breadcrumbs: string[] = [];
    
    // Add current category
    const currentCategory = categories.find(c => c.isCurrent);
    if (currentCategory) {
      breadcrumbs.push(currentCategory.label);
    }
    
    // Add sub-paths based on sidebar structure
    if (sidebar && sidebar.length > 0) {
      // Normalize current path for comparison
      const normalizeUrl = (url: string) => {
        return url.replace(/\/+$/, '') || '/'; // Remove trailing slashes
      };
      
      const normalizedCurrentPath = normalizeUrl(currentPath);
      
      const findCurrentPath = (items: SidebarItem[], currentBreadcrumb: string[] = []): string[] => {
        for (const item of items) {
          if (item.link) {
            const normalizedItemLink = normalizeUrl(item.link);
            
            // Check for exact match first
            if (normalizedCurrentPath === normalizedItemLink) {
              return [...currentBreadcrumb, item.label || ''];
            }
            
            // If current item has sub-items, continue searching recursively
            if (item.items && item.items.length > 0) {
              const childPath = findCurrentPath(item.items, [...currentBreadcrumb, item.label || '']);
              if (childPath.length > 0) {
                return childPath;
              }
            }
          } else if (item.items && item.items.length > 0) {
            // If current item has no link but has sub-items, search recursively
            const childPath = findCurrentPath(item.items, [...currentBreadcrumb, item.label || '']);
            if (childPath.length > 0) {
              return childPath;
            }
          }
        }
        return [];
      };
      
      const sidebarPath = findCurrentPath(sidebar);
      // Filter out empty strings and duplicate category names
      const filteredPath = sidebarPath.filter(path => 
        path && !breadcrumbs.includes(path)
      );
      breadcrumbs.push(...filteredPath);
    }
    
    return breadcrumbs.filter(Boolean);
  };

  const breadcrumbs = generateBreadcrumb();

  // Prevent background scrolling
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Keyboard event handling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Render Sidebar items with collapse functionality
  const renderSidebarItems = (items: SidebarItem[], level = 0) => {
    // Normalize URL for comparison
    const normalizeUrl = (url: string) => {
      return url.replace(/\/+$/, '') || '/'; // Remove trailing slashes
    };
    
    const normalizedCurrentPath = normalizeUrl(currentPath);
    
    return items.map((item, index) => {
      const itemKey = item.link || item.label || `item-${level}-${index}`;
      const isGroup = Boolean(item.items?.length);
      const collapsed = collapsedStates[itemKey] ?? item.collapsed ?? false;
      
      // Check if this item or any of its children is active
      const isItemActive = item.link ? 
        normalizedCurrentPath === normalizeUrl(item.link) :
        false;
      
      return (
        <div key={index}>
          {item.link ? (
            // Single navigation link
            <a
              href={item.link}
              className={`flex items-center py-2 px-3 text-sm transition-colors duration-200 rounded-lg ${
                isItemActive
                  ? 'bg-[rgba(0,0,0,0.04)] text-[var(--text-primary)] font-medium'
                  : 'text-[var(--text-secondary)] hover:bg-[rgba(0,0,0,0.02)] hover:text-[var(--text-primary)]'
              }`}
              style={{ marginLeft: `${level * 12}px` }}
              onClick={() => setIsOpen(false)}
            >
              <span className="flex-1">{item.label}</span>
            </a>
          ) : isGroup ? (
            // Group with collapsible functionality
            <button
              type="button"
              className={`flex items-center justify-between w-full py-2 px-3 text-sm transition-colors duration-200 rounded-lg font-medium ${
                isItemActive
                  ? 'bg-[rgba(0,0,0,0.04)] text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-[rgba(0,0,0,0.02)] hover:text-[var(--text-primary)]'
              }`}
              style={{ marginLeft: `${level * 12}px` }}
              onClick={() => toggleCollapsed(itemKey)}
              aria-expanded={!collapsed}
            >
              <span className="flex-1 text-left">{item.label}</span>
              <span className="flex items-center ml-1">
                {collapsed ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </span>
            </button>
          ) : (
            // Non-link group header
            <div 
              className="py-2 px-3 text-sm font-medium text-[var(--text-primary)]"
              style={{ marginLeft: `${level * 12}px` }}
            >
              {item.label}
            </div>
          )}
          
          {/* Render sub-items if not collapsed */}
          {item.items && item.items.length > 0 && !collapsed && (
            <div className="mt-1 space-y-1">
              {renderSidebarItems(item.items, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <>
      {/* Mobile breadcrumb button */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 py-[18px] px-0 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors w-full"
          aria-label="Open navigation menu"
          aria-expanded={isOpen}
        >
          {/* Menu icon */}
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
          
          {/* Breadcrumb path */}
          <span className="truncate text-left flex-1">
            {breadcrumbs.length > 0 ? breadcrumbs.join(' / ') : 'Navigation'}
          </span>
        </button>
      </div>

      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[rgba(0,0,0,0.2)] z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
          role="button"
          tabIndex={-1}
          aria-label="Close navigation menu"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setIsOpen(false);
            }
          }}
        />
      )}

      {/* Side drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-nav-logo"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-[12px] py-[14px] border-b border-[rgba(0,0,0,0.06)] bg-[#fff]">
            <div id="mobile-nav-logo" className="flex items-center gap-3">
              <img src="/logo.svg" alt="ScopeDB Logo" className="h-7 w-7" />
              <div className="text-lg text-[var(--text-primary)] font-medium">ScopeDB</div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              aria-label="Close navigation menu"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto">
            {/* Categories */}
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-3">Categories</h3>
              <div className="space-y-1">
                {categories.map((category) => (
                  <a
                    key={category.link}
                    href={category.link}
                    className={`flex items-center py-2.5 px-3 text-sm rounded-lg transition-colors duration-200 ${
                      category.isCurrent
                        ? 'bg-[rgba(0,0,0,0.04)] text-[var(--text-primary)] font-medium'
                        : 'text-[var(--text-secondary)] hover:bg-[rgba(0,0,0,0.02)] hover:text-[var(--text-primary)]'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <span className="flex-1">{category.label}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            {sidebar && sidebar.length > 0 && (
              <div className="p-4">
                <h3 className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-3">Content</h3>
                <div className="space-y-1">
                  {renderSidebarItems(sidebar)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
