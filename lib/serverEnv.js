import fs from "node:fs";
import path from "node:path";

let envLoaded = false;

function stripWrappingQuotes(value) {
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) continue;

    const separatorIndex = trimmedLine.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = stripWrappingQuotes(trimmedLine.slice(separatorIndex + 1).trim());

    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

function ensureServerEnvLoaded() {
  if (envLoaded) return;
  envLoaded = true;

  loadEnvFile(path.join(process.cwd(), ".env"));
  loadEnvFile(path.join(process.cwd(), ".env.local"));
}

export function getServerEnv(key) {
  ensureServerEnvLoaded();
  return process.env[key] || "";
}
