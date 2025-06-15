import React from 'react';

export interface RelatedContentItem {
  title: string;
  url: string;
}

export interface RelatedContentProps {
  relatedContents?: RelatedContentItem[];
}

export default function RelatedContent({ relatedContents }: RelatedContentProps) {
  if (!relatedContents || relatedContents.length === 0) {
    return null;
  }

  return (
    <div className="related-docs pb-[40px]">
      <h2 className="flex items-center">
        <span className="pr-[12px]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-link-icon lucide-link"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </span>
        <span className="font-medium" style={{ fontSize: "14px" }}>
          Related
        </span>
      </h2>
      <ul>
        {relatedContents.map((item) => (
          <li key={item.url} className="mt-[12px]">
            <a href={item.url} style={{ fontSize: "14px" }}>
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
