import { createHash, randomBytes } from 'node:crypto';
const [role, id] = process.argv.slice(2);
if (!['Founder', 'Admin', 'Operator', 'Observer'].includes(role) || !id?.trim()) {
  console.error('Usage: node scripts/create-key.mjs <Founder|Admin|Operator|Observer> <identity-id>');
  process.exit(1);
}
const key = randomBytes(32).toString('base64url');
console.log('API key (keep private):', key);
console.log('Configuration record:', JSON.stringify({ id, role, digest: createHash('sha256').update(key).digest('hex') }));
