import React, { useEffect, useRef, useState } from "react";
import LayoutProvider from "@theme/Layout/Provider";
import SkipToContent from "@theme/SkipToContent";
import {
  PageMetadata,
  SkipToContentFallbackId,
} from "@docusaurus/theme-common";
import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import CodeBlock from "@theme/CodeBlock";
import packageJson from "../../../package.json";

const github = "https://github.com/appandflow/react-native-reserved-regions";
const command = "npm install react-native-reserved-regions";

const snippet = `const regions = useReservedRegions();

for (const region of regions) {
  if (region.kind === 'division') {
    const hidden = region.occludesContent;
  }

  const { x, y, width, height } = region.frame;
}`;

const linkStyle = { color: "#008cff" };
const headingStyle = {
  margin: 0,
  color: "#121212",
};
const buttonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px 16px",
  borderRadius: 40,
  background: "#000",
  color: "#fff",
  fontSize: 12,
  fontWeight: 500,
  textDecoration: "none",
  whiteSpace: "nowrap",
};

const concepts = [
  {
    title: "View-relative coordinates",
    description:
      "Measure a whole screen or a smaller panel. Each provider establishes its own coordinate space.",
    label: "Coordinates",
    to: "/docs/coordinates",
    image: "coordinates.png",
    width: 1368,
    height: 599,
    alt: "A nested provider establishes coordinates relative to its container.",
  },
  {
    title: "Divisions and occlusions",
    description:
      "A tagged union distinguishes divisions from occlusions. Divisions also tell you whether content is hidden.",
    label: "API reference",
    to: "/docs/api",
    image: "occlusions.png",
    width: 1368,
    height: 640,
    alt: "Phone displays with camera occlusions and usable content areas.",
  },
  {
    title: "iOS and Android",
    description:
      "UIKit reserved regions and Android folding features share an API with documented platform differences.",
    label: "Platform support",
    to: "/docs/platforms",
    image: "platforms.png",
    width: 1344,
    height: 588,
    alt: "Foldable and conventional devices on iOS and Android.",
  },
];

function Illustration({ file, alt, width, height, style, reveal = false }) {
  const imageRef = useRef(null);

  useEffect(() => {
    if (!reveal || !("IntersectionObserver" in window)) return;

    const image = imageRef.current;
    image.dataset.reveal = "pending";

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          image.dataset.reveal = "visible";
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(image);
    return () => {
      observer.disconnect();
      delete image.dataset.reveal;
    };
  }, [reveal]);

  return (
    <img
      ref={imageRef}
      className={reveal ? "illustrationReveal" : undefined}
      src={useBaseUrl(`/img/${file}`)}
      alt={alt}
      width={width}
      height={height}
      style={{
        display: "block",
        width: "100%",
        height: "auto",
        ...style,
      }}
    />
  );
}

export default function Home() {
  const [copyStatus, setCopyStatus] = useState("");
  const resetTimer = useRef(null);
  const copied = copyStatus === "Copied";
  const copyIcon = useBaseUrl("/img/copy-05.png");

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(command);
      clearTimeout(resetTimer.current);
      setCopyStatus("Copied");
      resetTimer.current = setTimeout(() => setCopyStatus(""), 2000);
    } catch {
      clearTimeout(resetTimer.current);
      setCopyStatus("Select the command and copy it manually.");
    }
  }

  return (
    <LayoutProvider>
      <PageMetadata
        title="Reserved Regions for React Native"
        description="View-scoped display divisions and occlusions for React Native."
      />
      <SkipToContent />
      <div
        className="reservedRegionsHome"
        style={{
          minHeight: "100vh",
          background: "#fff",
          color: "#121212",
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: 14,
          lineHeight: 1.5,
          "--ifm-heading-color": "#121212",
          "--ifm-link-color": "#008cff",
          "--ifm-font-family-monospace":
            '"JetBrains Mono", ui-monospace, monospace',
        }}
      >
        <div
          style={{
            width: "calc(100% - 48px)",
            maxWidth: 520,
            margin: "0 auto",
            padding: "120px 0 160px",
          }}
        >
          <nav
            aria-label="Main navigation"
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
              marginBottom: 48,
              fontSize: 12,
              lineHeight: 1.4,
            }}
          >
            <Link to="/" aria-label="Reserved Regions home">
              <Illustration
                file="logo.png"
                alt="logo"
                width={96}
                height={96}
                style={{ width: 32, height: 32 }}
              />
            </Link>
            <Link to="/docs/installation" style={{ color: "#828282" }}>
              Documentation
            </Link>
            <Link to="/docs/api" style={{ color: "#828282" }}>
              API
            </Link>
            <Link
              href={github}
              aria-label={`GitHub · v${packageJson.version}`}
              style={{
                color: "#828282",
                display: "flex",
                gap: 5,
              }}
            >
              <Illustration
                file="github-grey.png"
                alt="github grey logo"
                width={48}
                height={48}
                style={{ width: 16, height: 16, flexShrink: 0 }}
              />
              <span aria-hidden="true">·</span>
              <span>v{packageJson.version}</span>
            </Link>
          </nav>

          <main id={SkipToContentFallbackId}>
            <header>
              <h1
                style={{
                  margin: "0 0 16px",
                  color: "#000",
                  fontSize: "clamp(30px, 5vw, 36px)",
                  fontFamily: '"GT Maru", Inter, sans-serif',
                  fontWeight: 700,
                  lineHeight: 1.12,
                  letterSpacing: "-0.8px",
                  width: 350,
                }}
              >
                Reserved Regions for React Native
              </h1>
              <p className="description" style={{ margin: 0 }}>
                Get the bounds of folds, camera cutouts, and system UI on iOS
                and Android. Use them to keep content and controls clear.
              </p>
              <Illustration
                file="devices.png"
                reveal
                alt="Foldable displays showing a central division and camera cutout."
                width={1557}
                height={712}
                style={{ margin: "48px 0" }}
              />

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 16,
                }}
              >
                <Link
                  to="/docs/installation"
                  className="buttonStyle"
                  style={buttonStyle}
                >
                  Get started
                </Link>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 8,
                    minWidth: 0,
                  }}
                >
                  <code
                    style={{
                      padding: 0,
                      border: 0,
                      background: "transparent",
                      color: "#828282",
                      fontSize: 12,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {command}
                  </code>
                  <button
                    type="button"
                    onClick={copyCommand}
                    aria-label={copied ? "Copied" : "Copy install command"}
                    title={copied ? "Copied" : "Copy"}
                    className="clean-btn"
                    style={{ padding: 8, cursor: "pointer" }}
                  >
                    <span
                      aria-hidden="true"
                      style={{ display: "grid", width: 16, height: 16 }}
                    >
                      <img
                        src={copyIcon}
                        alt="Copy icon"
                        width={16}
                        height={16}
                        style={{
                          gridArea: "1 / 1",
                          opacity: copied ? 0 : 1,
                          transform: copied ? "scale(0.33)" : "scale(1)",
                          transition: "all var(--ifm-transition-fast) ease",
                        }}
                      />
                      <svg
                        viewBox="0 0 24 24"
                        width={16}
                        height={16}
                        style={{
                          gridArea: "1 / 1",
                          color: "#00d600",
                          opacity: copied ? 1 : 0,
                          transform: copied ? "scale(1)" : "scale(0.33)",
                          transition: "all var(--ifm-transition-fast) ease",
                          transitionDelay: copied ? "75ms" : "0ms",
                        }}
                      >
                        <path
                          fill="currentColor"
                          d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"
                        />
                      </svg>
                    </span>
                  </button>
                </div>
              </div>
              <output
                style={
                  copied
                    ? {
                        position: "absolute",
                        width: 1,
                        height: 1,
                        overflow: "hidden",
                        clipPath: "inset(50%)",
                        whiteSpace: "nowrap",
                      }
                    : { fontSize: 12, color: "#59677f" }
                }
              >
                {copyStatus}
              </output>
            </header>

            <section aria-label="Core concepts" style={{ marginTop: 32 }}>
              {concepts.map((concept, index) => (
                <article
                  key={concept.title}
                  style={{
                    padding: "32px 32px 0",
                    border: "1px solid rgba(18, 18, 18, 0.1)",
                    borderTopWidth: index === 0 ? 1 : 0,
                    overflow: "hidden",
                  }}
                >
                  <h2 className="sectionHeading" style={headingStyle}>
                    {concept.title}
                  </h2>
                  <p className="description" style={{ margin: "16px 0" }}>
                    {concept.description}
                  </p>
                  <Link
                    to={concept.to}
                    className="learnMoreLink"
                    style={linkStyle}
                  >
                    {concept.label} <span aria-hidden="true">↗</span>
                  </Link>
                  <Illustration
                    file={concept.image}
                    reveal
                    alt={concept.alt}
                    width={concept.width}
                    height={concept.height}
                    style={{
                      margin: "64px auto 0",
                      maxWidth: concept.image === "platforms.png" ? 448 : 456,
                    }}
                  />
                </article>
              ))}
            </section>

            <section aria-labelledby="usage-title" style={{ marginTop: 32 }}>
              <h2
                id="usage-title"
                className="sectionHeading"
                style={headingStyle}
              >
                Usage
              </h2>
              <div style={{ padding: "40px 0" }}>
                <p className="description" style={{ margin: "0 0 8px" }}>
                  Wrap a view in ReservedRegionsProvider and read its regions
                  with useReservedRegions. Pair region frames with safe area
                  insets when your screen needs both edge spacing and
                  information about its interior.
                </p>
                <Link
                  to="/docs/safe-area"
                  className="learnMoreLink"
                  style={linkStyle}
                >
                  Learn more <span aria-hidden="true">↗</span>
                </Link>
              </div>

              <CodeBlock language="tsx" className="reservedRegionsCode">
                {snippet}
              </CodeBlock>

              <div style={{ padding: "32px 0" }}>
                <p className="description" style={{ margin: "0 0 16px" }}>
                  Compare full-screen, inset, and content-box providers, with
                  safe area insets alongside reserved regions.
                </p>
                <Link
                  to="/docs/example"
                  className="buttonStyle"
                  style={{ ...buttonStyle, fontSize: 14, gap: 8 }}
                >
                  <Illustration
                    file="github-white.png"
                    alt="Github white logo"
                    width={48}
                    height={48}
                    style={{ width: 16, height: 16 }}
                  />
                  Example app ↗
                </Link>
              </div>
            </section>
          </main>

          <footer
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 32,
              padding: "16px 0",
              borderTop: "1px solid rgba(18, 18, 18, 0.05)",
              fontSize: 12,
            }}
          >
            <span>
              Made by{" "}
              <Link href="https://appandflow.com" style={linkStyle}>
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
