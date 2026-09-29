import ConceptCard from '../../component/ConceptCard';
import Illustration from '../../component/Illustration';
import styles from './index.module.css';
import shared from '../../component/shared.module.css';
import React, { useEffect, useRef, useState } from 'react';
import LayoutProvider from '@theme/Layout/Provider';
import SkipToContent from '@theme/SkipToContent';
import { PageMetadata, SkipToContentFallbackId } from '@docusaurus/theme-common';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import CodeBlock from '@theme/CodeBlock';
import packageJson from '../../../package.json';
const github = 'https://github.com/appandflow/react-native-reserved-regions';
const command = 'npm install react-native-reserved-regions';
const snippet = `const regions = useReservedRegions();

for (const region of regions) {
  if (region.kind === 'division') {
    const hidden = region.occludesContent;
  }

  const { x, y, width, height } = region.frame;
}`;
const concepts = [
  {
    title: 'View-relative coordinates',
    description: 'Measure a whole screen or a smaller panel. Each provider establishes its own coordinate space.',
    label: 'Coordinates',
    to: '/docs/coordinates',
    image: 'coordinates.png',
    maxWidth: 456,
    width: 1368,
    height: 599,
    alt: 'A nested provider establishes coordinates relative to its container.',
  },
  {
    title: 'Divisions and occlusions',
    description:
      'A tagged union distinguishes divisions from occlusions. Divisions also tell you whether content is hidden.',
    label: 'API reference',
    to: '/docs/api',
    image: 'occlusions.png',
    maxWidth: 456,
    width: 1368,
    height: 640,
    alt: 'Phone displays with camera occlusions and usable content areas.',
  },
  {
    title: 'iOS and Android',
    description:
      'UIKit reserved regions and Android folding features share an API with documented platform differences.',
    label: 'Platform support',
    to: '/docs/platforms',
    image: 'platforms.png',
    maxWidth: 448,
    width: 1344,
    height: 588,
    alt: 'Foldable and conventional devices on iOS and Android.',
  },
];
export default function Home() {
  const [copyStatus, setCopyStatus] = useState('');
  const resetTimer = useRef(null);
  const copied = copyStatus === 'Copied';
  const copyIcon = useBaseUrl('/img/copy-05.png');
  useEffect(() => () => clearTimeout(resetTimer.current), []);
  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(command);
      clearTimeout(resetTimer.current);
      setCopyStatus('Copied');
      resetTimer.current = setTimeout(() => setCopyStatus(''), 2000);
    } catch {
      clearTimeout(resetTimer.current);
      setCopyStatus('Select the command and copy it manually.');
    }
  }
  return (
    <LayoutProvider>
      <PageMetadata
        title="Reserved Regions for React Native"
        description="View-scoped display divisions and occlusions for React Native."
      />
      <SkipToContent />
      <div className={styles.page}>
        <div className={styles.container}>
          <nav aria-label="Main navigation" className={styles.navigation}>
            <Link to="/" aria-label="Reserved Regions home">
              <Illustration file="logo.png" alt="logo" width={96} height={96} className={styles.logo} />
            </Link>
            <Link to="/docs/installation" className={styles.navLink}>
              Documentation
            </Link>
            <Link to="/docs/api" className={styles.navLink}>
              API
            </Link>
            <Link href={github} aria-label={`GitHub · v${packageJson.version}`} className={styles.githubLink}>
              <Illustration
                file="github-grey.png"
                alt="github grey logo"
                width={48}
                height={48}
                className={styles.githubIcon}
              />
              <span aria-hidden="true">·</span>
              <span>v{packageJson.version}</span>
            </Link>
          </nav>

          <main id={SkipToContentFallbackId}>
            <header>
              <h1 className={styles.title}>Reserved Regions for React Native</h1>
              <p className={[shared.description, styles.intro].join(' ')}>
                Get the bounds of folds, camera cutouts, and system UI on iOS and Android. Use them to keep content and
                controls clear.
              </p>
              <Illustration
                file="devices.png"
                reveal
                alt="Foldable displays showing a central division and camera cutout."
                width={1557}
                height={712}
                className={styles.heroIllustration}
              />

              <div className={styles.actions}>
                <Link to="/docs/installation" className={styles.button}>
                  Get started
                </Link>
                <div className={styles.install}>
                  <code className={styles.installCommand}>{command}</code>
                  <button
                    type="button"
                    onClick={copyCommand}
                    aria-label={copied ? 'Copied' : 'Copy install command'}
                    title={copied ? 'Copied' : 'Copy'}
                    className={['clean-btn', styles.copyButton].join(' ')}
                  >
                    <span aria-hidden="true" className={styles.copyIcons}>
                      <img
                        src={copyIcon}
                        alt="Copy icon"
                        width={16}
                        height={16}
                        style={{
                          opacity: copied ? 0 : 1,
                          transform: copied ? 'scale(0.33)' : 'scale(1)',
                        }}
                        className={styles.copyIcon}
                      />
                      <svg
                        viewBox="0 0 24 24"
                        width={16}
                        height={16}
                        style={{
                          opacity: copied ? 1 : 0,
                          transform: copied ? 'scale(1)' : 'scale(0.33)',
                          transitionDelay: copied ? '75ms' : '0ms',
                        }}
                        className={styles.copySuccess}
                      >
                        <path fill="currentColor" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
                      </svg>
                    </span>
                  </button>
                </div>
              </div>
              <output
                style={
                  copied
                    ? {
                        position: 'absolute',
                        width: 1,
                        height: 1,
                        overflow: 'hidden',
                        clipPath: 'inset(50%)',
                        whiteSpace: 'nowrap',
                      }
                    : {
                        fontSize: 12,
                        color: '#59677f',
                      }
                }
              >
                {copyStatus}
              </output>
            </header>

            <section aria-label="Core concepts" className={styles.concepts}>
              {concepts.map((concept, index) => (
                <ConceptCard key={concept.title} concept={concept} isFirst={index === 0} />
              ))}
            </section>

            <section aria-labelledby="usage-title" className={styles.usage}>
              <h2 id="usage-title" className={shared.heading}>
                Usage
              </h2>
              <div className={styles.usageIntro}>
                <p className={[shared.description, styles.usageDescription].join(' ')}>
                  Wrap a view in ReservedRegionsProvider and read its regions with useReservedRegions. Pair region
                  frames with safe area insets when your screen needs both edge spacing and information about its
                  interior.
                </p>
                <Link to="/docs/safe-area" className={[shared.link, shared.textLink].join(' ')}>
                  Learn more <span aria-hidden="true">↗</span>
                </Link>
              </div>

              <CodeBlock language="tsx" className={styles.codeBlock}>
                {snippet}
              </CodeBlock>

              <div className={styles.example}>
                <p className={[shared.description, styles.exampleDescription].join(' ')}>
                  Compare full-screen, inset, and content-box providers, with safe area insets alongside reserved
                  regions.
                </p>
                <Link to="/docs/example" className={[styles.button, styles.exampleButton].join(' ')}>
                  <Illustration
                    file="github-white.png"
                    alt="Github white logo"
                    width={48}
                    height={48}
                    className={styles.icon}
                  />
                  Example app ↗
                </Link>
              </div>
            </section>
          </main>

          <footer className={styles.footer}>
            <span>
              Made by{' '}
              <Link href="https://appandflow.com" className={shared.textLink}>
                App&amp;Flow
              </Link>
            </span>
            <span aria-hidden="true">·</span>
            licensed under the MIT License
          </footer>
        </div>
      </div>
    </LayoutProvider>
  );
}
