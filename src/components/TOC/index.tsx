import React from "react";
import type { MarkdownHeading } from "astro";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { throttle } from "lodash-es";
import { useMedia, useScrollLock } from "@/src/libs/hooks";
import { AlignLeftIcon } from "lucide-react";
import RelatedContent, { type RelatedContentItem } from "../RelatedContent";

import styles from "./index.module.css";

interface TOCProps {
  toc: MarkdownHeading[];
  relatedContents?: RelatedContentItem[];
}

interface TocItemProps {
  item: MarkdownHeading;
  isActive: boolean;
  onClick: (href: string) => void;
  isMobile?: boolean;
  onClose?: () => void;
}

interface LinkInfo {
  top: number;
  height: number;
  href: string;
  index: number;
}

type OffsetTarget = Window | Document | HTMLElement | Element;

const SCROLL_THROTTLE_MS = 128;
const TOP_BOUND = 12;
const ITEM_HEIGHT = 14;
const ITEM_MARGIN = 12;

function getOffset(
  el: HTMLElement,
  scrollTarget: OffsetTarget,
): {
  top: number;
  height: number;
} {
  const { top: elTop, height } = el.getBoundingClientRect();
  let scrollTargetTop = 0;

  if (scrollTarget instanceof HTMLElement || scrollTarget instanceof Element) {
    scrollTargetTop = scrollTarget.getBoundingClientRect().top;
  }

  return {
    top: elTop - scrollTargetTop,
    height,
  };
}

function useTOCState(toc: MarkdownHeading[]) {
  const [activeHref, setActiveHref] = useState<string | null>(null);
  const [activeLink, setActiveLink] = useState<LinkInfo | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useMedia("(max-width:960px)");
  const tocListRef = useRef<HTMLUListElement>(null);

  const collectedLinkHrefs = useMemo(() => toc.map((t) => t.slug), [toc]);

  useEffect(() => {
    const hash = window.location.hash.replaceAll("#", "");
    if (hash) {
      setActiveHref(hash);
    } else if (toc[0]?.slug) {
      setActiveHref(toc[0].slug);
    }
  }, [toc]);

  return {
    activeHref,
    setActiveHref,
    activeLink,
    setActiveLink,
    isOpen,
    setIsOpen,
    isMobile,
    tocListRef,
    collectedLinkHrefs,
  };
}

function useTOCScroll(
  collectedLinkHrefs: string[],
  activeHref: string | null,
  setActiveHref: (href: string) => void,
  setActiveLink: (link: LinkInfo | null) => void,
) {
  const handleScroll = useCallback(() => {
    const links: LinkInfo[] = [];
    const offsetTarget = document;

    collectedLinkHrefs.forEach((href, index) => {
      const linkEl = document.getElementById(href);
      if (linkEl && offsetTarget) {
        const { top, height } = getOffset(linkEl, offsetTarget);
        links.push({ top, height, href, index });
      }
    });

    links.sort((a, b) => a.top - b.top);

    const activeLink = links.reduce((prevLink: LinkInfo | null, link) => {
      if (link.top + link.height < 0) {
        return prevLink;
      }

      if (link.top <= TOP_BOUND) {
        if (!prevLink) return link;
        if (link.top > prevLink.top) return link;
        if (link.top === prevLink.top && link.href === activeHref) return link;
        return prevLink;
      }

      if (!prevLink) return link;
      if (link.top < prevLink.top) return link;
      return prevLink;
    }, null);

    if (activeLink?.href) {
      setActiveHref(activeLink.href);
      setActiveLink(activeLink);
    }
  }, [collectedLinkHrefs, activeHref, setActiveHref, setActiveLink]);

  const throttledHandleScroll = useMemo(
    () => throttle(handleScroll, SCROLL_THROTTLE_MS),
    [handleScroll],
  );

  useEffect(() => {
    const cleanup = () => {
      throttledHandleScroll.cancel();
      window.removeEventListener("scroll", throttledHandleScroll);
    };

    window.addEventListener("scroll", throttledHandleScroll);
    return cleanup;
  }, [throttledHandleScroll]);

  return throttledHandleScroll;
}

function useTOCInitialization(
  toc: MarkdownHeading[],
  collectedLinkHrefs: string[],
  activeHref: string | null,
  setActiveHref: (href: string) => void,
  setActiveLink: (link: LinkInfo | null) => void,
) {
  useEffect(() => {
    const initialize = () => {
      const hash = window.location.hash.replaceAll("#", "");
      if (hash && collectedLinkHrefs.includes(hash)) {
        setActiveHref(hash);
        const linkEl = document.getElementById(hash);
        if (linkEl) {
          const { top, height } = getOffset(linkEl, document);
          setActiveLink({
            top,
            height,
            href: hash,
            index: collectedLinkHrefs.indexOf(hash),
          });
        }
        return;
      }

      if (toc.length > 0 && !activeHref) {
        const firstHref = toc[0].slug;
        setActiveHref(firstHref);
        const firstLink = document.getElementById(firstHref);
        if (firstLink) {
          const { top, height } = getOffset(firstLink, document);
          setActiveLink({
            top,
            height,
            href: firstHref,
            index: 0,
          });
        }
      }
    };

    initialize();
  }, [toc, collectedLinkHrefs, activeHref, setActiveHref, setActiveLink]);
}

export const TOCItem = React.memo(function TOCItem({
  item,
  isActive,
  onClick,
  isMobile,
  onClose,
}: TocItemProps) {
  const handleClick = useCallback(() => {
    onClick(item.slug);
    if (isMobile && onClose) {
      onClose();
    }
  }, [item.slug, onClick, isMobile, onClose]);

  return (
    <li className={`${styles.tocItem} ${isActive ? styles.tocItemActive : ""}`}>
      <a
        target="_self"
        title={item.text}
        href={`#${item.slug}`}
        onClick={handleClick}
        style={{ marginLeft: `${(item.depth - 2) * 16}px` }}
      >
        {item.text}
      </a>
    </li>
  );
});

export function TOC({ toc, relatedContents }: TOCProps) {
  const {
    activeHref,
    setActiveHref,
    activeLink,
    setActiveLink,
    isOpen,
    setIsOpen,
    isMobile,
    tocListRef,
    collectedLinkHrefs,
  } = useTOCState(toc);

  useTOCInitialization(
    toc,
    collectedLinkHrefs,
    activeHref,
    setActiveHref,
    setActiveLink,
  );

  useTOCScroll(collectedLinkHrefs, activeHref, setActiveHref, setActiveLink);

  const updateActiveHref = useCallback(
    (href: string, shouldScroll = false) => {
      const linkEl = document.getElementById(href);
      if (!linkEl) return;

      setActiveHref(href);
      if (shouldScroll) {
        linkEl.scrollIntoView({ behavior: "smooth" });
      }
    },
    [setActiveHref],
  );

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, [setIsOpen]);

  const tocBarTop = useMemo(
    () => (ITEM_HEIGHT + ITEM_MARGIN) * (activeLink?.index ?? 0),
    [activeLink],
  );
  const close = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  function handleClickTocItem(href: string) {
    if (isMobile) {
      close?.();
    }
    updateActiveHref(href, true);
  }

  useScrollLock(isOpen);

  return (
    <div className={styles.toc}>
      {isMobile && (
        <AlignLeftIcon onClick={toggleOpen} width={16} height={16} />
      )}
      {isOpen && <div className={styles.tocMask} onClick={toggleOpen} />}

      <RelatedContent relatedContents={relatedContents} />
      <div
        className={`${isMobile ? (isOpen ? styles.open : styles.close) : ""}`}
      >
        <div className={styles.tocTitle}>
          <AlignLeftIcon width={16} height={16} />
          <span>On this page</span>
        </div>
        <div className={styles.tocListContainer}>
          <div className={styles.tocRail}>
            <div
              className={`${styles.tocRailBar} ${
                activeLink ? styles.tocRailBarActive : ""
              }`}
              style={{ top: `${tocBarTop}px` }}
            />
          </div>
          <ul className={styles.tocList} ref={tocListRef}>
            {toc.map((item) => (
              <TOCItem
                key={item.slug}
                item={item}
                isActive={item.slug === activeHref}
                onClick={handleClickTocItem}
                isMobile={isMobile}
                onClose={close}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
