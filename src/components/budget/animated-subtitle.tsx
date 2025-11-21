'use client'

import React, { useState, useEffect } from 'react';

interface AnimatedSubtitleProps {
  text: string;
}

export default function AnimatedSubtitle({ text }: AnimatedSubtitleProps) {
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const words = text.split(' ');

  useEffect(() => {
    // Animazione solo una volta all'ingresso
    const timeouts: NodeJS.Timeout[] = [];
    
    // Delay iniziale prima di iniziare l'animazione
    const initialDelay = setTimeout(() => {
      words.forEach((_, index) => {
        const timeout = setTimeout(() => {
          setHighlightedIndex(index);
        }, index * 350); // 350ms tra ogni parola
        timeouts.push(timeout);
      });

      // Reset dopo che tutte le parole sono state evidenziate
      const resetTimeout = setTimeout(() => {
        setHighlightedIndex(-1);
      }, words.length * 350 + 1500); // Attende 1.5 secondi dopo l'ultima parola
      timeouts.push(resetTimeout);
    }, 500);
    
    timeouts.push(initialDelay);

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [text]);

  return (
    <span className="inline-flex flex-wrap gap-x-2">
      {words.map((word, index) => (
        <span
          key={index}
          className={`transition-all duration-300 ${
            highlightedIndex === index
              ? 'bg-yellow-200 px-1 rounded text-gray-900'
              : 'text-gray-600'
          }`}
        >
          {word}
        </span>
      ))}
    </span>
  );
}

