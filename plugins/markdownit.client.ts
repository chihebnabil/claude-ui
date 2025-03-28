import markdownit from "markdown-it";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.min.css";

export default defineNuxtPlugin((nuxtApp) => {
  let codeBlockId = 0;

  const md = markdownit({
    highlight: function (str, lang) {
      const currentId = `code-block-${codeBlockId++}`;

      if (lang && hljs.getLanguage(lang)) {
        try {
          const highlighted = hljs.highlight(str, {
            language: lang,
            ignoreIllegals: true,
          }).value;
          // Return without the surrounding pre/code tags since markdown-it will add them
          return highlighted;
        } catch (__) {}
      }

      return md.utils.escapeHtml(str);
    },
  });

  // Override the fence renderer to add our custom wrapper
  md.renderer.rules.fence = function (tokens, idx, options, env, slf) {
    const token = tokens[idx];
    const info = token.info ? md.utils.unescapeAll(token.info).trim() : "";
    const lang = info ? info.split(/\s+/g)[0] : "";
    const currentId = `code-block-${codeBlockId++}`;

    const code = options.highlight
      ? options.highlight(token.content, lang, "")
      : token.content;

    const codeBlock = `
      <div class="relative code-block">
        <pre class="!my-0"><code class="hljs" id="${currentId}">${code}</code></pre>
        <button 
          onclick="copyCode('${currentId}')" 
          class="copy-button absolute top-1.5 right-1.5 flex items-center justify-center w-6 h-6 text-xs text-gray-400 bg-gray-800/50 rounded hover:bg-gray-700 hover:text-gray-200 transition-colors"
          aria-label="Copy code"
        >
          <svg class="copy-icon w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <svg class="check-icon w-3.5 h-3.5 hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>
      </div>
    `;

    return codeBlock;
  };

  // Add the copy functionality to the window object
  if (import.meta.client) {
    window.copyCode = async function (id: string) {
      const codeBlock = document.getElementById(id);
      if (!codeBlock) return;

      const code = codeBlock.textContent || "";

      try {
        await navigator.clipboard.writeText(code);

        // Get the button associated with this code block
        const button =
          codeBlock.parentElement?.parentElement?.querySelector(".copy-button");
        const copyIcon = button?.querySelector(".copy-icon");
        const checkIcon = button?.querySelector(".check-icon");

        if (copyIcon && checkIcon) {
          copyIcon.classList.add("hidden");
          checkIcon.classList.remove("hidden");

          // Reset button after 2 seconds
          setTimeout(() => {
            copyIcon.classList.remove("hidden");
            checkIcon.classList.add("hidden");
          }, 2000);
        }
      } catch (err) {
        console.error("Failed to copy code:", err);
      }
    };
  }

  return {
    provide: {
      mdRenderer: md,
    },
  };
});
