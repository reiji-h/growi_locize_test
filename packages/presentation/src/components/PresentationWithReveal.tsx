import React, { useEffect } from 'react';

import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import type { ReactMarkdownOptions } from 'react-markdown/lib/react-markdown';
import Reveal from 'reveal.js';

import * as hrSplitter from '../services/renderer/hr-splitter';


import 'reveal.js/dist/reveal.css';
import 'reveal.js/dist/theme/black.css';


type Props = {
  rendererOptions: ReactMarkdownOptions,
  revealOptions?: Reveal.Options,
  children?: string,
}

export const Presentation = (props: Props): JSX.Element => {
  const { rendererOptions, revealOptions, children } = props;

  useEffect(() => {
    if (children != null) {
      const deck = new Reveal(revealOptions);
      deck.initialize()
        .then(() => deck.slide(0)); // navigate to the first slide
    }
  }, [children, revealOptions]);

  rendererOptions.remarkPlugins?.push(hrSplitter.remarkPlugin);

  return (
    <div className="reveal">
      <div className="slides">
        { children == null
          ? <section>No contents</section>
          : <ReactMarkdown {...rendererOptions}>{children}</ReactMarkdown>
        }
      </div>
    </div>
  );
};
