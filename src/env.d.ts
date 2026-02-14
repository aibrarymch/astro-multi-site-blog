/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SITE_TYPE: string;
  readonly SHOW_DRAFTS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
