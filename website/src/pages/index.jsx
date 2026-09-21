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

function formatFrame({ x, y, width, height }) {
  return `x:${x} y:${y} w:${width} h:${height} pt`;
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
  const [landscape, setLandscape] = useState(false);
  const orientation = landscape ? 'LANDSCAPE' : 'PORTRAIT';
  const division = landscape ? rotateClockwise(portraitRegions.division) : portraitRegions.division;
  const occlusion = landscape ? rotateClockwise(portraitRegions.occlusion) : portraitRegions.occlusion;
  const geometryStyle = {
    '--division-x': `${(portraitRegions.division.x / portraitFrame.width) * 100}%`,
    '--cutout-x': `${(portraitRegions.occlusion.x / portraitFrame.width) * 100}%`,
    '--cutout-y': `${(portraitRegions.occlusion.y / portraitFrame.height) * 100}%`,
    '--cutout-width': `${(portraitRegions.occlusion.width / portraitFrame.width) * 100}%`,
    '--cutout-height': `${(portraitRegions.occlusion.height / portraitFrame.height) * 100}%`,
  };

  return (
    <figure
      className={styles.preview}
      aria-label="Illustrative provider geometry controls. The region coordinates are example values, not live device measurements."
    >
      <div className={styles.previewHeader}>
        <span className={styles.liveDot} />
        <span>PROVIDER COORDINATES</span>
        <span className={styles.previewUnit}>{orientation} · pt</span>
      </div>
      <div className={styles.deviceStage}>
        <div className={`${styles.device} ${landscape ? styles.deviceLandscape : ''}`}>
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
              <RegionLabel kind="division" frame={division} />
            </div>
            <div className={styles.cutout}>
              <RegionLabel kind="occlusion" frame={occlusion} />
            </div>
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
          <i className={styles.providerKey} /> Provider {landscape ? '951 × 669 pt' : '669 × 951 pt'}
        </span>
        <span>
          <i className={styles.divisionKey} /> Division {formatFrame(division)}
        </span>
        <span>
          <i className={styles.occlusionKey} /> Occlusion {formatFrame(occlusion)}
        </span>
        <small>Illustrative controls and geometry, not live device measurements</small>
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
