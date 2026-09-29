# Documentation website

Docusaurus 3.10.2. The website is a private pnpm workspace and uses the repository's shared lockfile and Ox tooling.

From the repository root:

```sh
pnpm install
pnpm run docs:start
```

Open the URL printed by Docusaurus. The site uses the `/react-native-reserved-regions/` base path.

```sh
pnpm run format:check
pnpm run docs:build
pnpm --filter reserved-regions-docs serve
```

The build fails on broken internal links and produces `website/build/`. The site is deployed to GitHub Pages at `https://rnrr.appandflow.com/` by `.github/workflows/docs.yml`; these commands do not deploy. Update `url` and `baseUrl` before hosting elsewhere.

Docs describe the repository source. Update the release status in `docs/installation.md` when a new package is published. Native API changes should update `docs/api.md` and `docs/platforms.md` together.
