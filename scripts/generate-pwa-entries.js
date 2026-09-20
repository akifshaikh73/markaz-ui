// Generates one manifest + HTML entry document per installable PWA role, so each role's
// Home Screen icon gets its own start_url. See docs/pwa-multi-role-install.md for why this
// has to happen server-side (in the build output) rather than with a client-side JS swap.
//
// Runs as the "postbuild" npm script, after `react-scripts build` has already produced
// build/index.html and build/manifest.json.
'use strict';

const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '..', 'build');
const rolesPath = path.join(__dirname, 'pwa-roles.json');

const MANIFEST_LINK_MARKER = 'rel="manifest" href="/manifest.json"';
const APPLE_TITLE_MARKER = /(<meta name="apple-mobile-web-app-title" content=")[^"]*(")/;

function fail(message) {
    console.error(`generate-pwa-entries: ${message}`);
    process.exit(1);
}

const { roles } = JSON.parse(fs.readFileSync(rolesPath, 'utf8'));

const indexHtmlPath = path.join(buildDir, 'index.html');
const manifestPath = path.join(buildDir, 'manifest.json');

if (!fs.existsSync(indexHtmlPath)) fail(`${indexHtmlPath} not found — run "react-scripts build" first.`);
if (!fs.existsSync(manifestPath)) fail(`${manifestPath} not found — run "react-scripts build" first.`);

const baseHtml = fs.readFileSync(indexHtmlPath, 'utf8');
const baseManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

if (!baseHtml.includes(MANIFEST_LINK_MARKER)) {
    fail(`expected marker not found in build/index.html: ${MANIFEST_LINK_MARKER} — did the CRA HTML template change?`);
}
if (!APPLE_TITLE_MARKER.test(baseHtml)) {
    fail('expected apple-mobile-web-app-title meta tag not found in build/index.html — did the CRA HTML template change?');
}

for (const role of roles) {
    const { path: rolePath, name, shortName, appleTitle } = role;

    const manifestFileName = `manifest-${rolePath}.json`;
    const roleManifest = {
        ...baseManifest,
        name,
        short_name: shortName,
        start_url: `/${rolePath}`,
    };
    fs.writeFileSync(path.join(buildDir, manifestFileName), JSON.stringify(roleManifest, null, 2));

    const roleHtml = baseHtml
        .replace(MANIFEST_LINK_MARKER, `rel="manifest" href="/${manifestFileName}"`)
        .replace(APPLE_TITLE_MARKER, `$1${appleTitle}$2`);

    const roleDir = path.join(buildDir, rolePath);
    fs.mkdirSync(roleDir, { recursive: true });
    fs.writeFileSync(path.join(roleDir, 'index.html'), roleHtml);

    console.log(`generate-pwa-entries: wrote build/${rolePath}/index.html -> ${manifestFileName} (start_url /${rolePath})`);
}
