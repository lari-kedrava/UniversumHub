import { spawnSync } from "node:child_process";

const accepted = new Set();
const packageManager = process.env.npm_execpath;
if (!packageManager) {
  process.stderr.write("Execute a auditoria por meio do pnpm.\n");
  process.exit(1);
}
const result = spawnSync(process.execPath, [packageManager, "audit", "--prod", "--json"], { encoding: "utf8" });

if (!result.stdout) {
  process.stderr.write(result.stderr || "A auditoria de dependências não retornou dados.\n");
  process.exit(1);
}

let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  process.stderr.write("A resposta da auditoria não é um JSON válido.\n");
  process.exit(1);
}

const blocking = Object.values(report.advisories ?? {}).filter((advisory) =>
  ["high", "critical"].includes(advisory.severity) &&
  !accepted.has(advisory.github_advisory_id),
);

if (blocking.length) {
  for (const advisory of blocking) {
    process.stderr.write(`${advisory.severity.toUpperCase()}: ${advisory.github_advisory_id ?? advisory.id} ${advisory.module_name}\n`);
  }
  process.exit(1);
}

process.stdout.write("Nenhuma vulnerabilidade alta ou crítica aplicável foi encontrada.\n");
