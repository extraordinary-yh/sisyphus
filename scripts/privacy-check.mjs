import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
const files=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const forbidden=/(^|\/)(private-data|backups|exports|artifacts|test-results|\.wrangler|\.sites-runtime|\.env)(\/|$)|\.sqlite(?:3)?(?:-|$)|\.db(?:-|$)|\.local\.(json|md)$|^\.openai\/hosting\.json$|^public\/(jobhub-plans|stayfree.*)\.json$/;
const secret=/(?:gh[pousr]_[A-Za-z0-9_]{30,}|github_pat_[A-Za-z0-9_]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/;
const violations=[];
for(const f of files){if(forbidden.test(f))violations.push(`${f}: private path tracked`);if(/\.(?:png|jpg|jpeg|webp|ico|woff2?)$/.test(f))continue;const content=execFileSync('git',['show',`:${f}`],{encoding:'utf8',maxBuffer:10*1024*1024});if(secret.test(content))violations.push(`${f}: potential credential`);if(/\/Users\/[^/]+\//.test(content))violations.push(`${f}: personal absolute path`);}
if(violations.length){console.error(violations.join('\n'));process.exit(1)}
console.log(`Privacy check passed for ${files.length} tracked files. Review content manually before changing repository visibility.`);
