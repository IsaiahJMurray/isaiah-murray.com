import adapter from '@sveltejs/adapter-auto';
import sveltePreprocess from 'svelte-preprocess';
import { mdsvex } from 'mdsvex';

const config = {
  // allow both .svelte and .md as components
  extensions: ['.svelte', '.md'],

  preprocess: [
    // markdown → Svelte via mdsvex
    mdsvex({
      extensions: ['.md']
      // NOTE: no `layout` here – we're not using Mdsvex layouts now
    }),
    // standard Svelte preprocessing (TS, PostCSS, etc.)
    sveltePreprocess()
  ],

  kit: {
    adapter: adapter()
  }
};

export default config;
