/**
 * Plop generators for consistent code scaffolding
 * @see https://plopjs.com/documentation/
 */
export default function (plop) {
  // Feature generator - creates a complete feature module
  plop.setGenerator('feature', {
    description: 'Create a new feature module',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Feature name (e.g., notifications):',
        validate: (value) => {
          if (!value) return 'Feature name is required';
          if (!/^[a-z][a-z0-9-]*$/.test(value)) {
            return 'Feature name must be lowercase with hyphens (e.g., user-settings)';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'description',
        message: 'Brief description of the feature:',
        default: 'Feature module',
      },
    ],
    actions: [
      {
        type: 'add',
        path: 'src/features/{{kebabCase name}}/api/{{camelCase name}}Service.ts',
        templateFile: 'plop-templates/feature/service.ts.hbs',
      },
      {
        type: 'add',
        path: 'src/features/{{kebabCase name}}/components/index.ts',
        templateFile: 'plop-templates/feature/components-index.ts.hbs',
      },
      {
        type: 'add',
        path: 'src/features/{{kebabCase name}}/types/index.ts',
        templateFile: 'plop-templates/feature/types.ts.hbs',
      },
      {
        type: 'add',
        path: 'src/features/{{kebabCase name}}/index.ts',
        templateFile: 'plop-templates/feature/index.ts.hbs',
      },
      {
        type: 'add',
        path: 'src/features/{{kebabCase name}}/hooks/index.ts',
        templateFile: 'plop-templates/feature/hooks-index.ts.hbs',
      },
    ],
  });

  // Shared component generator - creates component in src/shared/components
  plop.setGenerator('component', {
    description: 'Create a new shared component with test and story',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Component name (PascalCase, e.g., UserCard):',
        validate: (value) => {
          if (!value) return 'Component name is required';
          if (!/^[A-Z][a-zA-Z0-9]*$/.test(value)) {
            return 'Component name must be PascalCase (e.g., UserCard)';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'description',
        message: 'Brief description of the component:',
        default: 'A reusable component',
      },
    ],
    actions: [
      {
        type: 'add',
        path: 'src/shared/components/{{pascalCase name}}/index.tsx',
        templateFile: 'plop-templates/component/component.tsx.hbs',
      },
      {
        type: 'add',
        path: 'src/shared/components/{{pascalCase name}}/{{pascalCase name}}.test.tsx',
        templateFile: 'plop-templates/component/component.test.tsx.hbs',
      },
      {
        type: 'add',
        path: 'src/shared/components/{{pascalCase name}}/{{pascalCase name}}.stories.tsx',
        templateFile: 'plop-templates/component/component.stories.tsx.hbs',
      },
    ],
  });

  // Feature component generator - creates component in a feature module
  plop.setGenerator('feature-component', {
    description: 'Create a new component within a feature module',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Component name (PascalCase, e.g., UserCard):',
        validate: (value) => {
          if (!value) return 'Component name is required';
          if (!/^[A-Z][a-zA-Z0-9]*$/.test(value)) {
            return 'Component name must be PascalCase (e.g., UserCard)';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'feature',
        message: 'Feature name (existing feature, e.g., notifications):',
        validate: (value) => {
          if (!value) return 'Feature name is required';
          return true;
        },
      },
      {
        type: 'input',
        name: 'description',
        message: 'Brief description of the component:',
        default: 'A feature component',
      },
    ],
    actions: [
      {
        type: 'add',
        path: 'src/features/{{kebabCase feature}}/components/{{pascalCase name}}/index.tsx',
        templateFile: 'plop-templates/component/component.tsx.hbs',
      },
      {
        type: 'add',
        path: 'src/features/{{kebabCase feature}}/components/{{pascalCase name}}/{{pascalCase name}}.test.tsx',
        templateFile: 'plop-templates/component/component.test.tsx.hbs',
      },
      {
        type: 'add',
        path: 'src/features/{{kebabCase feature}}/components/{{pascalCase name}}/{{pascalCase name}}.stories.tsx',
        templateFile: 'plop-templates/component/component.stories.tsx.hbs',
      },
    ],
  });

  // Hook generator - creates a custom hook with test
  plop.setGenerator('hook', {
    description: 'Create a new custom hook with test',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Hook name (without "use" prefix, e.g., LocalStorage):',
        validate: (value) => {
          if (!value) return 'Hook name is required';
          if (!/^[A-Z][a-zA-Z0-9]*$/.test(value)) {
            return 'Hook name must be PascalCase (e.g., LocalStorage -> useLocalStorage)';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'description',
        message: 'Brief description of the hook:',
        default: 'A custom hook',
      },
    ],
    actions: [
      {
        type: 'add',
        path: 'src/shared/hooks/use{{pascalCase name}}.ts',
        templateFile: 'plop-templates/hook/hook.ts.hbs',
      },
      {
        type: 'add',
        path: 'src/shared/hooks/use{{pascalCase name}}.test.ts',
        templateFile: 'plop-templates/hook/hook.test.ts.hbs',
      },
    ],
  });

  // Page generator - creates a page component
  plop.setGenerator('page', {
    description: 'Create a new page component',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Page name (PascalCase, e.g., UserProfile):',
        validate: (value) => {
          if (!value) return 'Page name is required';
          if (!/^[A-Z][a-zA-Z0-9]*$/.test(value)) {
            return 'Page name must be PascalCase (e.g., UserProfile)';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'route',
        message: 'Route path (e.g., /user-profile):',
        default: (answers) => `/${answers.name.toLowerCase().replace(/([A-Z])/g, '-$1').slice(1)}`,
      },
      {
        type: 'input',
        name: 'description',
        message: 'Brief description of the page:',
        default: 'A page component',
      },
    ],
    actions: [
      {
        type: 'add',
        path: 'src/pages/{{pascalCase name}}Page/index.tsx',
        templateFile: 'plop-templates/page/page.tsx.hbs',
      },
      {
        type: 'add',
        path: 'src/pages/{{pascalCase name}}Page/{{pascalCase name}}Page.test.tsx',
        templateFile: 'plop-templates/page/page.test.tsx.hbs',
      },
    ],
  });

  // Store generator - creates a Zustand store
  plop.setGenerator('store', {
    description: 'Create a Zustand store for a feature',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Store name (e.g., user for useUserStore):',
        validate: (value) => {
          if (!value) return 'Store name is required';
          if (!/^[a-z][a-zA-Z0-9]*$/.test(value)) {
            return 'Store name must be camelCase (e.g., user, userSettings)';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'feature',
        message: 'Feature name (existing feature where store will be created):',
        validate: (value) => {
          if (!value) return 'Feature name is required';
          return true;
        },
      },
      {
        type: 'input',
        name: 'description',
        message: 'Brief description of the store:',
        default: 'A Zustand store',
      },
    ],
    actions: [
      {
        type: 'add',
        path: 'src/features/{{kebabCase feature}}/store/{{camelCase name}}Store.ts',
        templateFile: 'plop-templates/store/store.ts.hbs',
      },
      {
        type: 'add',
        path: 'src/features/{{kebabCase feature}}/store/{{camelCase name}}Store.test.ts',
        templateFile: 'plop-templates/store/store.test.ts.hbs',
      },
    ],
  });
}
