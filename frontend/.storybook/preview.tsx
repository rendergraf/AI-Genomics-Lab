import type { Preview } from "@storybook/react-vite";
import "@fontsource/electrolize";
import "../src/app/globals.css";
import React from "react";

// Componente decorador que añade las definiciones globales de SVG
const withSvgDefs = (Story: React.ComponentType) => (
  <>
    <svg width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        <clipPath id="btnClip" clipPathUnits="objectBoundingBox">
          <path
            d="
            M 0,0
            H 1
            V 0.65
            C 1,0.68 0.997,0.71 0.99,0.74
            L 0.95,0.90
            C 0.94,0.96 0.93,0.98 0.91,0.98
            H 0
            Z
          "
          />
        </clipPath>
      </defs>
    </svg>
    <Story />
  </>
);

const preview: Preview = {
  decorators: [withSvgDefs],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    // Background color for all stories
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#0d151c" },
        { name: "light", value: "#ffffff" },
      ],
    },

    // Dark mode toggle with themes addon
    themes: {
      default: "light",
      decorator: true,
      list: [
        { name: "light", class: "", color: "#ffffff" },
        { name: "dark", class: "dark", color: "#1a1a1a" },
      ],
    },

    a11y: {
      test: "todo",
    },
  },
};

export default preview;
