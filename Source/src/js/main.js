import { start } from './app.js';
if (window.__boot) window.__boot.stage('bundle-loaded');
try { start(); } catch (e) { if (window.__boot) window.__boot.fail(e); else throw e; }
