import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Lyric Video Maker",
  description: "Create stunning lyric videos with AI-powered subtitles and audio-reactive visuals",
  base: "/LyricVideoMaker/",

  head: [
    ["meta", { property: "og:title", content: "Lyric Video Maker" }],
    [
      "meta",
      {
        property: "og:description",
        content:
          "Desktop app for creating lyric videos with AI subtitle alignment and an extensible plugin system",
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
        text: "User Guide",
        items: [
          { text: "Getting Started", link: "/guide/getting-started" },
          { text: "The Workspace", link: "/guide/workspace" },
          {
            text: "Scenes & Components",
            link: "/guide/scenes-and-components",
          },
          {
            text: "Preview & Rendering",
            link: "/guide/preview-and-rendering",
          },
          {
            text: "Subtitle Generation",
            link: "/guide/subtitle-generation",
          },
          { text: "Plugins", link: "/guide/plugins" },
        ],
      },
      {
        text: "Plugin Development",
        items: [
          {
            text: "Plugin Quick Start",
            link: "/guide/plugin-development",
          },
          { text: "Plugin API Reference", link: "/guide/plugin-api" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/mrkmg/LyricVideoMaker" },
    ],

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2026 Kevin Gravier",
    },
  },
});
