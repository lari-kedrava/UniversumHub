import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente ausente: ${name}`);
  return value;
}

function validUrl(name: string): string {
  const value = required(name);
  if (value.includes("SEU-PROJETO")) throw new Error(`Configure um valor real em ${name}.`);
  const parsed = new URL(value);
  if (!(["https:", "http:"].includes(parsed.protocol))) throw new Error(`URL inválida em ${name}.`);
  return parsed.origin;
}

function secret(name: string): string {
  const value = required(name);
  if (value.length < 32 || /^(cole_|gere_)/i.test(value)) throw new Error(`Configure um segredo válido em ${name}.`);
  return value;
}

const port = Number(process.env.API_PORT ?? 3333);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("API_PORT inválida.");

const vercelOrigin = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "";
const allowedOrigins = [process.env.CORS_ORIGIN ?? "http://localhost:5173", vercelOrigin]
  .filter(Boolean)
  .join(",")
  .split(",")
  .map((origin) => new URL(origin.trim()).origin);
if (allowedOrigins.includes("*")) throw new Error("CORS_ORIGIN não permite curingas.");

export const env = {
  port,
  supabaseUrl: validUrl("SUPABASE_URL"),
  supabaseServiceRoleKey: secret("SUPABASE_SERVICE_ROLE_KEY"),
  allowedOrigins,
};
