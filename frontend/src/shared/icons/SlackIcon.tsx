/**
 * SlackIcon - Official Slack brand icon
 *
 * SVG path from Bootstrap Icons (https://icons.getbootstrap.com/icons/slack/)
 * Compatible with lucide-react API
 */

import type { ComponentType } from 'react';

interface IconProps {
  className?: string;
}

export const SlackIcon: ComponentType<IconProps> = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 16 16"
      className={className}
    >
      <path fill="#E01E5A" d="M3.362 10.11c0 .926-.756 1.681-1.681 1.681S0 11.036 0 10.111C0 9.186.756 8.43 1.68 8.43h1.682z" />
      <path fill="#E01E5A" d="M4.208 10.11c0-.924.756-1.68 1.681-1.68s1.681.756 1.681 1.68v4.21c0 .924-.756 1.68-1.68 1.68a1.685 1.685 0 0 1-1.682-1.68z" />
      <path fill="#36C5F0" d="M5.89 3.362c-.926 0-1.682-.756-1.682-1.681S4.964 0 5.89 0s1.68.756 1.68 1.68v1.682z" />
      <path fill="#36C5F0" d="M5.89 4.208c.924 0 1.68.756 1.68 1.681S6.814 7.57 5.89 7.57H1.68C.757 7.57 0 6.814 0 5.89c0-.926.756-1.682 1.68-1.682z" />
      <path fill="#2EB67D" d="M12.639 5.89c0-.926.755-1.682 1.68-1.682.925 0 1.681.756 1.681 1.681s-.756 1.681-1.68 1.681h-1.681z" />
      <path fill="#2EB67D" d="M11.791 5.89c0 .924-.755 1.68-1.68 1.68A1.685 1.685 0 0 1 8.43 5.89V1.68C8.43.757 9.186 0 10.11 0c.926 0 1.681.756 1.681 1.68z" />
      <path fill="#ECB22E" d="M10.11 12.638c.926 0 1.682.756 1.682 1.681S11.036 16 10.11 16s-1.681-.756-1.681-1.68v-1.682z" />
      <path fill="#ECB22E" d="M10.11 11.791c-.924 0-1.68-.755-1.68-1.68 0-.925.756-1.681 1.68-1.681h4.21c.924 0 1.68.756 1.68 1.68 0 .926-.756 1.681-1.68 1.681z" />
    </svg>
  );
};
