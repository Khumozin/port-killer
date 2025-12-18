#!/usr/bin/env node

/**
 * Updates version in Tauri configuration files
 * Usage: node update-tauri-version.js <version>
 */

const fs = require('fs');
const path = require('path');

const version = process.argv[2];

if (!version) {
  console.error('Error: Version argument is required');
  console.error('Usage: node update-tauri-version.js <version>');
  process.exit(1);
}

// Validate version format (semantic versioning)
const versionRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
if (!versionRegex.test(version)) {
  console.error(`Error: Invalid version format: ${version}`);
  console.error('Expected format: X.Y.Z or X.Y.Z-prerelease or X.Y.Z+build');
  process.exit(1);
}

// Update tauri.conf.json
const tauriConfigPath = path.join(__dirname, '..', 'src-tauri', 'tauri.conf.json');
try {
  const tauriConfig = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf8'));
  tauriConfig.version = version;
  fs.writeFileSync(tauriConfigPath, JSON.stringify(tauriConfig, null, 2) + '\n');
  console.log(`✓ Updated tauri.conf.json to version ${version}`);
} catch (error) {
  console.error(`Error updating tauri.conf.json: ${error.message}`);
  process.exit(1);
}

// Update Cargo.toml
const cargoTomlPath = path.join(__dirname, '..', 'src-tauri', 'Cargo.toml');
try {
  let cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');

  // Replace version in [package] section
  const packageSectionRegex = /(\[package\][^\[]*version\s*=\s*)"[^"]*"/;
  if (!packageSectionRegex.test(cargoToml)) {
    throw new Error('Could not find version field in [package] section');
  }

  cargoToml = cargoToml.replace(packageSectionRegex, `$1"${version}"`);
  fs.writeFileSync(cargoTomlPath, cargoToml);
  console.log(`✓ Updated Cargo.toml to version ${version}`);
} catch (error) {
  console.error(`Error updating Cargo.toml: ${error.message}`);
  process.exit(1);
}

console.log(`\n✓ All Tauri version files updated to ${version}`);
