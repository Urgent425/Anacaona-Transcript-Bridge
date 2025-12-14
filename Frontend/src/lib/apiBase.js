// src/lib/apiBase.js

/* global import.meta */ // silences linters when CRA doesn't type import.meta

const hasImportMeta =
  typeof import.meta !== "undefined" &&
  typeof import.meta.env !== "undefined";

const fromVite = hasImportMeta ? import.meta.env.VITE_API_URL : undefined;
const fromCRA  = process.env.REACT_APP_API_URL;

export const API_BASE_BACKUP = (fromVite || fromCRA || "http://localhost:5000").replace(/\/$/, "");
export const API_BASE = process.env.REACT_APP_API_URL;
