import type { SidebarItem } from "@/src/libs/sidebar";
import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useMedia, useScrollLock } from "@/src/libs/hooks";
import { ChevronDown, ChevronRight, ListMinusIcon } from "lucide-react";

interface Props {
  sidebar: SidebarItem[];
  currentPath: string;
}

interface SidebarItemProps {
  item: SidebarItem;
  depth: number;
  currentPath: string;
  collapsedStates: Record<string, boolean>;
  // eslint-disable-next-line no-unused-vars
  onToggleCollapsed: (key: string) => void;
}

interface SidebarGroupProps {
  items: SidebarItem[];
  classNames: string;
  currentPath: string;
  collapsedStates: Record<string, boolean>;
  // eslint-disable-next-line no-unused-vars
  onToggleCollapsed: (key: string) => void;
}

function useCurrentPath(initPathname: string) {
  const [currentPath, setCurrentPath] = useState(initPathname);

  useEffect(() => {
    const handleRouteChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("popstate", handleRouteChange);
    document.addEventListener("astro:page-load", handleRouteChange);

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
      document.removeEventListener("astro:page-load", handleRouteChange);
    };
  }, []);

  return currentPath;
}

// Hook: Manage collapsed states
function useCollapsedStates(initialItems: SidebarItem[]) {
  const [collapsedStates, setCollapsedStates] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
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
    processItems(initialItems);
    setCollapsedStates(initialState);
  }, [initialItems]);

  const toggleCollapsed = useCallback((key: string) => {
    setCollapsedStates((prev) => {
      const newState = { ...prev };
      newState[key] = !prev[key];
      return newState;
    });
  }, []);

  return { collapsedStates, toggleCollapsed };
}

// Utility: Normalize URL paths
const normalizePath = (path: string) =>
  path.split("/").filter(Boolean).join("/");

// Utility: Check if menu item is active
const isActive = (item: SidebarItem, pathname: string) => {
  const currentPath = normalizePath(pathname);
  const itemPath = item.link ? normalizePath(item.link) : "";

  if (item.items?.length) {
    return item.items.some((child) => {
      if (child.link) {
        return normalizePath(child.link) === currentPath;
      }
      if (child.items) {
        return child.items.some(
          (grandChild) =>
            grandChild.link && normalizePath(grandChild.link) === currentPath,
        );
      }
      return false;
    });
  }

  return itemPath === currentPath;
};

// Component: Individual menu item (group or link)
const SidebarMenuItem = React.memo(function SidebarMenuItem({
  item,
  depth,
  currentPath,
  collapsedStates,
  onToggleCollapsed,
}: SidebarItemProps) {
  const isGroup = Boolean(item.items?.length);
  const itemKey = item.link || item.label || `item-${depth}`;
  const collapsed = collapsedStates[itemKey] ?? item.collapsed ?? false;
  const isItemActive = isActive(item, currentPath);
  const paddingLeft = 16 + depth * 16;

  // Render: Group button with expand/collapse
  if (isGroup) {
    return (
      <div>
        <button
          type="button"
          className={`flex items-center text-[14px] justify-between rounded-[12px] w-full py-[8px] px-[12px] mb-[6px] border-none bg-transparent cursor-pointer text-inherit text-left transition-colors duration-200 font-medium ${isItemActive ? "bg-[rgba(0,0,0,0.04)] text-[var(--text-primary)] font-medium" : "hover:bg-[rgba(0,0,0,0.02)] hover:text-[var(--text-primary)]"}`}
          style={{ paddingLeft }}
          onClick={() => onToggleCollapsed(itemKey)}
          aria-expanded={!collapsed}
        >
          <span className="flex-1">{item.label}</span>
          <span className="flex items-center ml-[4px]">
            {collapsed ? (
              <ChevronRight width={16} height={16} />
            ) : (
              <ChevronDown width={16} height={16} />
            )}
          </span>
        </button>
        {!collapsed && item.items && item.items.length > 0 && (
          <div>
            {item.items.map((child) => (
              <SidebarMenuItem
                key={`${child.link}-${child.label}`}
                item={child}
                depth={depth + 1}
                currentPath={currentPath}
                collapsedStates={collapsedStates}
                onToggleCollapsed={onToggleCollapsed}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Render: Single navigation link
  return (
    <a
      href={item.link}
      className={`block min-h-[32px] leading-[32px] py-[4px] px-[8px] mb-[2px] font-normal text-[var(---text-secondary)] text-[14px] no-underline rounded-[12px] duration-200 break-all whitespace-normal ${isItemActive ? "bg-[rgba(0,0,0,0.04)] text-[var(--text-primary)] font-medium " : "hover:bg-[rgba(0,0,0,0.02)] hover:text-[var(--text-primary)]"}`}
      style={{ paddingLeft }}
      data-astro-prefetch
    >
      {item.label}
    </a>
  );
});

// Component: Sidebar container
const SidebarGroup = React.memo(function SidebarGroup({
  items,
  classNames,
  currentPath,
  collapsedStates,
  onToggleCollapsed,
}: SidebarGroupProps) {
  return (
    <aside className={classNames}>
      <nav className="space-y-[4px] p-[0px]">
        {items.map((item, index) => (
          <SidebarMenuItem
            key={`${item.link}${index}`}
            item={item}
            depth={0}
            currentPath={currentPath}
            collapsedStates={collapsedStates}
            onToggleCollapsed={onToggleCollapsed}
          />
        ))}
      </nav>
    </aside>
  );
});

// Component: Mobile breadcrumb navigation
function Breadcrumbs(props: { currentPath: string }) {
  const { currentPath } = props;

  const crumbs = useMemo(() => {
    const segments = currentPath.split("/").filter(Boolean);
    const result = [];
    let path = "";

    for (const segment of segments) {
      path += `/${segment}`;
      result.push({ text: segment, link: path });
    }

    return result;
  }, [currentPath]);

  return (
    <span className="pl-3 text-black/60 text-sm font-normal">
      {crumbs.map((crumb, index) => (
        <span key={crumb.link}>
          <a href={crumb.link} className="hover:text-black">
            {crumb.text}
          </a>
          {index < crumbs.length - 1 && (
            <span className="mx-1 text-gray-400"> / </span>
          )}
        </span>
      ))}
    </span>
  );
}

// Main: Responsive sidebar menu
export function SidebarMenu(props: Props) {
  const { sidebar: items, currentPath: initPathname } = props;
  const isMobile = useMedia("(max-width: 480px)");
  const [open, setOpen] = useState(false);
  const { collapsedStates, toggleCollapsed } = useCollapsedStates(items);
  const currentPath = useCurrentPath(initPathname);

  useScrollLock(open);

  const sidebarBaseClasses =
    "overflow-scroll sticky top-0 left-0 w-full max-w-[300px] overflow-x-hidden bg-white overflow-y-auto";

  const mobileClassName = useMemo(() => {
    if (!isMobile) return "";
    return isMobile
      ? open
        ? "opacity-100 visible bg-white w-[70%] h-full fixed inset-0 z-[1000] translate-x-0 transition-all duration-500 ease-in-out"
        : "opacity-0 invisible -translate-x-full w-0 h-0 transition-all duration-500 ease-in-out"
      : "";
  }, [isMobile, open]);

  return (
    <div>
      {isMobile && open && (
        <div
          className="absolute inset-0 bg-gray-400/50 backdrop-blur-sm transition-opacity duration-500"
          onClick={() => setOpen(false)}
        />
      )}
      {isMobile && (
        <div className="flex flex-row">
          <ListMinusIcon
            onClick={() => setOpen(true)}
            width={16}
            height={16}
            className="cursor-pointer"
          />
          <Breadcrumbs currentPath={currentPath} />
        </div>
      )}
      <SidebarGroup
        items={items}
        classNames={`${sidebarBaseClasses} ${mobileClassName}`}
        currentPath={currentPath}
        collapsedStates={collapsedStates}
        onToggleCollapsed={toggleCollapsed}
      />
    </div>
  );
}
