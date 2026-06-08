import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from '@tanstack/react-router';
import "./styles/global.css";

// Import the generated route tree
import { routeTree } from './routeTree.gen';

const disableTextAutoCorrection = () => {
  const selector = 'input, textarea, [contenteditable="true"]';
  const apply = (root: ParentNode) => {
    root.querySelectorAll<HTMLElement>(selector).forEach((element) => {
      element.setAttribute('autocapitalize', 'off');
      element.setAttribute('autocorrect', 'off');
      element.setAttribute('autocomplete', 'off');
      element.setAttribute('spellcheck', 'false');
    });
  };

  apply(document);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        if (node.matches(selector)) {
          node.setAttribute('autocapitalize', 'off');
          node.setAttribute('autocorrect', 'off');
          node.setAttribute('autocomplete', 'off');
          node.setAttribute('spellcheck', 'false');
        }
        apply(node);
      });
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
};

disableTextAutoCorrection();

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);

window.requestAnimationFrame(() => {
  const bootScreen = document.getElementById('boot-screen');
  bootScreen?.classList.add('boot-hidden');
  window.setTimeout(() => bootScreen?.remove(), 220);
});
