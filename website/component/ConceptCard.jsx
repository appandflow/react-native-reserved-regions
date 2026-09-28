import React from 'react';
import Link from '@docusaurus/Link';
import Illustration from './Illustration';
import styles from '../src/pages/index.module.css';

export default function ConceptCard({ concept, isFirst }) {
  return (
    <article
      style={{
        borderTopWidth: isFirst ? 1 : 0,
      }}
      className={styles.concept}
    >
      <h2 className={styles.heading}>{concept.title}</h2>
      <p className={[styles.description, styles.conceptDescription].join(' ')}>{concept.description}</p>
      <Link to={concept.to} className={[styles.link, styles.textLink].join(' ')}>
        {concept.label} <span aria-hidden="true">↗</span>
      </Link>
      <Illustration
        file={concept.image}
        reveal
        alt={concept.alt}
        width={concept.width}
        height={concept.height}
        style={{
          maxWidth: concept.image === 'platforms.png' ? 448 : 456,
        }}
        className={styles.conceptIllustration}
      />
    </article>
  );
}
