export interface NavItem {
  path: string;
  labelKey: string; // i18n key like 'sidebar.items.overview'
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export interface NavGroup {
  labelKey: string; // i18n key like 'sidebar.groups.dataManagement'
  items: NavItem[];
  action?: boolean;
}
