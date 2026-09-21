import React, { useState } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import CodeBlock from '@theme/CodeBlock';
import styles from './index.module.css';

const snippet = `const regions = useReservedRegions();

for (const region of regions) {
  if (region.kind === 'division') {
    const hidden = region.occludesContent;
  }

  const { x, y, width, height } = region.frame;
}`;

function GeometryPreview() {
  const [landscape, setLandscape] = useState(false);
  const orientation = landscape ? 'LANDSCAPE' : 'PORTRAIT';

  return (
    <figure className={styles.preview}>
      <div className={styles.previewHeader}>
        <span className={styles.liveDot} />
        <span>PROVIDER COORDINATES</span>
        <span className={styles.previewUnit}>{orientation} · pt</span>
      </div>
      <div className={`${styles.device} ${landscape ? styles.deviceLandscape : ''}`}>
        <div className={`${styles.provider} ${landscape ? styles.providerLandscape : ''}`}>
          <span className={styles.origin}>(0, 0)</span>
          <div className={styles.panes}>
            <div className={styles.pane}>
              <div className={styles.stubTitle} />
              <div className={styles.stub} />
              <div className={styles.stub} />
              <div className={styles.tile} />
            </div>
            <div className={styles.pane}>
              <div className={styles.stubTitle} />
              <div className={styles.tile} />
              <div className={styles.stub} />
              <div className={styles.stub} />
            </div>
          </div>
          <div className={styles.fold}>
            <span>division</span>
          </div>
          <div className={styles.cutout}>
            <span>occlusion</span>
          </div>
        </div>
      </div>
      <div className={styles.previewControls}>
        <button type="button" className={styles.rotateButton} onClick={() => setLandscape((current) => !current)}>
          <span aria-hidden="true">↻</span> Rotate to {landscape ? 'portrait' : 'landscape'}
        </button>
        <span>Illustrative geometry</span>
      </div>
      <figcaption className={styles.previewCaption}>
        <span>
          <i className={styles.providerKey} /> Provider
        </span>
        <span>
          <i className={styles.divisionKey} /> Division
        </span>
        <span>
          <i className={styles.occlusionKey} /> Occlusion
        </span>
        <small>Illustrative controls and geometry</small>
      </figcaption>
    </figure>
  );
}

export default function Home() {
  return (
    <Layout
      title="Display geometry in your coordinates"
      description="View-scoped display divisions and occlusions for React Native's New Architecture."
    >
      <main>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>REACT NATIVE · NEW ARCHITECTURE</p>
            <h1>
              Display geometry.
              <br />
              <span>Your coordinates.</span>
            </h1>
            <p className={styles.intro}>
              Read the folds and occlusions that matter to your view. Build layouts around them with a provider, a hook,
              and native measurements.
            </p>
            <div className={styles.actions}>
              <Link className="button button--primary button--lg" to="/docs/installation">
                Get started <span aria-hidden="true">→</span>
              </Link>
              <Link className={styles.referenceLink} to="/docs/api">
                Explore the API <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <p className={styles.packageName}>react-native-reserved-regions</p>
          </div>
          <GeometryPreview />
        </section>
        <section className={styles.concepts} aria-label="Core concepts">
          <article>
            <span className={styles.number}>01 / SCOPE</span>
            <h2>Start with your view.</h2>
            <p>Measure a whole screen or a smaller panel. Each provider establishes its own coordinate space.</p>
            <Link to="/docs/coordinates">Understand coordinates →</Link>
          </article>
          <article>
            <span className={styles.number}>02 / GEOMETRY</span>
            <h2>Know what’s reserved.</h2>
            <p>
              A tagged union distinguishes divisions from occlusions. Divisions also tell you whether content is hidden.
            </p>
            <Link to="/docs/api">Read the type contract →</Link>
          </article>
          <article>
            <span className={styles.number}>03 / NATIVE</span>
            <h2>Keep platform detail.</h2>
            <p>
              UIKit reserved regions and Android folding features share an API with documented platform differences.
            </p>
            <Link to="/docs/platforms">See native mappings →</Link>
          </article>
        </section>
        <section className={styles.codeSection}>
          <div>
            <p className={styles.eyebrow}>SMALL API. EXPLICIT GEOMETRY.</p>
            <h2>The layout is yours.</h2>
            <p>
              Read native measurements beneath <code>ReservedRegionsProvider</code>, then decide where your content
              belongs.
            </p>
            <p>
              Pair region frames with safe area insets when your screen needs both edge spacing and information about
              its interior.
            </p>
            <Link to="/docs/safe-area">Use it with safe area context →</Link>
          </div>
          <CodeBlock language="tsx" title="Inside your provider">
            {snippet}
          </CodeBlock>
        </section>
        <section className={styles.exampleSection}>
          <div>
            <p className={styles.eyebrow}>SEE THE NUMBERS</p>
            <h2>Same device. Different bounds.</h2>
            <p>
              The native example compares full-screen, inset, and content-box providers, with safe area insets alongside
              reserved regions.
            </p>
          </div>
          <Link className="button button--outline button--primary" to="/docs/example">
            Run the example →
          </Link>
        </section>
      </main>
    </Layout>
  );
}
