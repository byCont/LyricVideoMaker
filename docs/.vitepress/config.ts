import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Lyric Video Maker",
  description: "Create stunning lyric videos with code and plugins",
  base: "/LyricVideoMaker/",

  head: [
    ["meta", { property: "og:title", content: "Lyric Video Maker" }],
    [
      "meta",
      {
        property: "og:description",
        content: "Desktop app for creating lyric videos with an extensible plugin system",
      },
    ],
  ],

  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "Plugin API", link: "/guide/plugin-api" },
      {
        text: "Download",
        link: "https://github.com/mrkmg/LyricVideoMaker/releases",
      },
    ],

    sidebar: [
      {
        text: "Getting Started",
        items: [{ text: "Quick Start", link: "/guide/getting-started" }],
      },
      {
        text: "Plugin Development",
        items: [
          { text: "Plugin API Reference", link: "/guide/plugin-api" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/mrkmg/LyricVideoMaker" },
    ],

    footer: {
      message: "Plugin SDK released under the MIT License.",
      copyright: "Copyright © 2025 Kevin Gravier",
    },
  },
});
