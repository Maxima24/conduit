import config from '@conduit/eslint-config';

export default [
  ...config,
  {
    ignores: ['.next/**', 'next-env.d.ts'],
  },
];
