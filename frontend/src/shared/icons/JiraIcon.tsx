/**
 * JiraIcon - Official Jira brand icon
 *
 * SVG path from Font Awesome (https://fontawesomeicons.com/svg/icons/jira)
 * Compatible with lucide-react API
 */

import type { ComponentType } from 'react';

interface IconProps {
  className?: string;
}

export const JiraIcon: ComponentType<IconProps> = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 496 512"
      fill="#0052CC"
      className={className}
    >
      <path d="M490 241.7C417.1 169 320.6 71.8 248.5 0 83 164.9 6 241.7 6 241.7c-7.9 7.9-7.9 20.7 0 28.7C138.8 402.7 67.8 331.9 248.5 512c379.4-378.8 364.5-364.1 364.5-364.1 7.9-7.9 7.9-20.7 0-28.7-19.7-19.6-126.6-126.4-123-122.9zM186.8 351.9c-18.4-18.4-18.4-48.3 0-66.7l41.9-41.9c18.4-18.4 48.3-18.4 66.7 0l24.3 24.3c18.4 18.4 18.4 48.3 0 66.7l-41.9 41.9c-18.4 18.4-48.3 18.4-66.7 0zm145.9-145.9c-18.4-18.4-18.4-48.3 0-66.7l41.9-41.9c18.4-18.4 48.3-18.4 66.7 0l24.3 24.3c18.4 18.4 18.4 48.3 0 66.7l-41.9 41.9c-18.4 18.4-48.3 18.4-66.7 0z" />
    </svg>
  );
};
