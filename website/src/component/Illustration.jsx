import React, { useEffect, useRef } from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from '../css/Illustration.module.css';

export default function Illustration({ file, alt, width, height, style, reveal = false, className = '' }) {
  const imageRef = useRef(null);
  useEffect(() => {
    if (!reveal || !('IntersectionObserver' in window)) return;
    const image = imageRef.current;
    image.dataset.reveal = 'pending';
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          image.dataset.reveal = 'visible';
          observer.disconnect();
        }
      },
      {
        threshold: 0.15,
      },
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
      className={[styles.illustration, reveal ? styles.illustrationReveal : '', className].join(' ')}
      src={useBaseUrl(`/img/${file}`)}
      alt={alt}
      width={width}
      height={height}
      style={style}
    />
  );
}
