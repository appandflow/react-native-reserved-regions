import React from 'react';
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

const portraitFrame = { width: 669, height: 951 };
const portraitRegions = {
  division: { x: 334.5, y: 0, width: 0, height: 951 },
  occlusion: { x: 573, y: 42, width: 54, height: 54 },
};

function rotateClockwise({ x, y, width, height }) {
  return {
    x: portraitFrame.height - y - height,
    y: x,
    width: height,
    height: width,
  };
}

function RegionLabel({ kind, frame }) {
  return (
    <span className={styles.regionLabel}>
      <b>{kind}</b>
      <i>
        x:{frame.x} y:{frame.y}
      </i>
      <i>
        w:{frame.width} h:{frame.height} pt
      </i>
    </span>
  );
}

function GeometryPreview() {
  const geometryStyle = {
    '--division-x': `${(portraitRegions.division.x / portraitFrame.width) * 100}%`,
    '--cutout-x': `${(portraitRegions.occlusion.x / portraitFrame.width) * 100}%`,
    '--cutout-y': `${(portraitRegions.occlusion.y / portraitFrame.height) * 100}%`,
    '--cutout-width': `${(portraitRegions.occlusion.width / portraitFrame.width) * 100}%`,
    '--cutout-height': `${(portraitRegions.occlusion.height / portraitFrame.height) * 100}%`,
  };

  return (
    <figure className={styles.preview} aria-label="Reserved region coordinates">
      <div className={styles.previewHeader}>
        <span className={styles.liveDot} />
        <span>PROVIDER COORDINATES</span>
        <span className={styles.previewUnit}>
          <span className={styles.portraitValue}>669 × 951 pt</span>
          <span className={styles.landscapeValue}>951 × 669 pt</span>
        </span>
      </div>
      <div className={styles.deviceStage}>
        <div className={styles.device}>
          <div className={styles.provider} style={geometryStyle}>
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
              <div className={styles.portraitValue}>
                <RegionLabel kind="division" frame={portraitRegions.division} />
              </div>
              <div className={styles.landscapeValue}>
                <RegionLabel kind="division" frame={rotateClockwise(portraitRegions.division)} />
              </div>
            </div>
            <div className={styles.cutout}>
              <div className={styles.portraitValue}>
                <RegionLabel kind="occlusion" frame={portraitRegions.occlusion} />
              </div>
              <div className={styles.landscapeValue}>
                <RegionLabel kind="occlusion" frame={rotateClockwise(portraitRegions.occlusion)} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.previewControls}>
        <label className={styles.rotateButton}>
          <input className={styles.rotateToggle} type="checkbox" aria-label="Landscape orientation" />
          <span aria-hidden="true">↻</span> Rotate screen
        </label>
      </div>
    </figure>
  );
}

export default function Home() {
  return (
    <Layout
      title="Reserved Regions for React Native"
      description="View-scoped display divisions and occlusions for React Native's New Architecture."
    >
      <main>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>REACT NATIVE · NEW ARCHITECTURE</p>
            <h1>
              Reserved Regions
              <br />
              <span>for React Native</span>
            </h1>
            <p className={styles.intro}>
              Get the bounds of folds, camera cutouts, and system UI on iOS and Android. Use them to keep content and
              controls clear.
            </p>
            <div className={styles.actions}>
              <Link className="button button--primary button--lg" to="/docs/installation">
                Get started <span aria-hidden="true">→</span>
              </Link>
              <Link className={styles.referenceLink} to="/docs/api">
                API reference <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <p className={styles.packageName}>react-native-reserved-regions</p>
          </div>
          <GeometryPreview />
        </section>
        <section className={styles.concepts} aria-label="Core concepts">
          <article>
            <h2>View-relative coordinates</h2>
            <p>Measure a whole screen or a smaller panel. Each provider establishes its own coordinate space.</p>
            <Link to="/docs/coordinates">Coordinates →</Link>
          </article>
          <article>
            <h2>Divisions and occlusions</h2>
            <p>
              A tagged union distinguishes divisions from occlusions. Divisions also tell you whether content is hidden.
            </p>
            <Link to="/docs/api">API reference →</Link>
          </article>
          <article>
            <h2>iOS and Android</h2>
            <p>
              UIKit reserved regions and Android folding features share an API with documented platform differences.
            </p>
            <Link to="/docs/platforms">Platform support →</Link>
          </article>
        </section>
        <section className={styles.codeSection}>
          <div>
            <h2>Usage</h2>
            <p>
              Wrap a view in <code>ReservedRegionsProvider</code> and read its regions with{' '}
              <code>useReservedRegions</code>.
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
            <h2>Example app</h2>
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
