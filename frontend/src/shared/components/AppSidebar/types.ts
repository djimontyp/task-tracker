export interface NavItem {
  path: string;
  labelKey?: string; // i18n key like 'sidebar.items.overview' (required in production)
  label?: string; // Direct label (for Storybook or as fallback)
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export interface NavGroup {
  labelKey?: string; // i18n key like 'sidebar.groups.dataManagement' (required in production)
  label?: string; // Direct label (for Storybook or as fallback)
  items: NavItem[];
  action?: boolean;
}
