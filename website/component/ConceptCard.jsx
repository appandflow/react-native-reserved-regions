import React from 'react';
import Link from '@docusaurus/Link';
import Illustration from './Illustration';
import styles from './ConceptCard.module.css';
import shared from './shared.module.css';

export default function ConceptCard({ concept, isFirst }) {
  return (
    <article
      style={{
        borderTopWidth: isFirst ? 1 : 0,
      }}
      className={styles.concept}
    >
      <h2 className={shared.heading}>{concept.title}</h2>
      <p className={[shared.description, styles.conceptDescription].join(' ')}>{concept.description}</p>
      <Link to={concept.to} className={[shared.link, shared.textLink].join(' ')}>
        {concept.label} <span aria-hidden="true">↗</span>
      </Link>
      <Illustration
        file={concept.image}
        reveal
        alt={concept.alt}
        width={concept.width}
        height={concept.height}
        style={{
          maxWidth: concept.maxWidth,
        }}
        className={styles.conceptIllustration}
      />
    </article>
  );
}
