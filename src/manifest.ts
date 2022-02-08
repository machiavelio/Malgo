const manifest: chrome.runtime.Manifest = {
  name: "malgo",
  version: "1.0.0",
  manifest_version: 2,
  background: {
    scripts: ["background/index.ts"],
  },
  content_scripts: [
    {
      js: ["content/index.ts"],
      matches: ["*://*.gogoanime.pe/*"],
    },
  ],
  browser_action: {
    default_popup: "pages/popup/index.html",
  },
  permissions: ["identity", "storage"],
};

export default manifest;
