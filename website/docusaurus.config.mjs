import { themes } from 'prism-react-renderer';

export default {
  title: 'Reserved Regions',
  tagline: 'Display divisions and occlusions in your React Native view coordinates.',
  favicon: 'img/mark.svg',
  url: 'https://appandflow.github.io',
  baseUrl: '/react-native-reserved-regions/',
  organizationName: 'appandflow',
  projectName: 'react-native-reserved-regions',
  trailingSlash: true,
  onBrokenLinks: 'throw',
  markdown: { hooks: { onBrokenMarkdownLinks: 'throw' } },
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.mjs',
          editUrl: 'https://github.com/appandflow/react-native-reserved-regions/edit/main/website/',
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
      },
    ],
  ],
  themeConfig: {
    colorMode: { defaultMode: 'light', respectPrefersColorScheme: true },
    announcementBar: {
      id: 'early-preview',
      content:
        'Alpha prerelease · These docs follow repository source. <a href="/react-native-reserved-regions/docs/installation/">Check release status</a>.',
      isCloseable: false,
      backgroundColor: '#eaf0ff',
      textColor: '#21356b',
    },
    navbar: {
      title: 'Reserved Regions',
      logo: { alt: '', src: 'img/mark.svg' },
      items: [
        { type: 'docSidebar', sidebarId: 'docs', label: 'Documentation', position: 'left' },
        { to: '/docs/api', label: 'API', position: 'left' },
        { href: 'https://github.com/appandflow/react-native-reserved-regions', label: 'GitHub', position: 'right' },
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: 'Learn',
          items: [
            { label: 'Get started', to: '/docs/installation' },
            { label: 'Coordinate spaces', to: '/docs/coordinates' },
          ],
        },
        {
          title: 'Reference',
          items: [
            { label: 'Public API', to: '/docs/api' },
            { label: 'Platform behavior', to: '/docs/platforms' },
          ],
        },
        {
          title: 'Project',
          items: [
            { label: 'GitHub', href: 'https://github.com/appandflow/react-native-reserved-regions' },
            { label: 'App & Flow', href: 'https://appandflow.com' },
          ],
        },
      ],
      copyright: 'Built by App & Flow · MIT license',
    },
    prism: { theme: themes.github, darkTheme: themes.dracula, additionalLanguages: ['bash', 'typescript', 'tsx'] },
  },
};
