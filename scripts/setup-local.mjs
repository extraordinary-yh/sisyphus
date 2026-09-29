import fs from 'node:fs';
fs.mkdirSync('.openai',{recursive:true});
if(!fs.existsSync('.openai/hosting.json'))fs.copyFileSync('.openai/hosting.example.json','.openai/hosting.json');
fs.mkdirSync('private-data',{recursive:true});
fs.mkdirSync('.sites-runtime',{recursive:true});
if(!fs.existsSync('.sites-runtime/execution-profile.json'))fs.writeFileSync('.sites-runtime/execution-profile.json',JSON.stringify({executionProfile:'portable'}));
fs.writeFileSync('.sites-runtime/local-db.json',JSON.stringify({name:'sisyphus-local',compatibility_date:'2026-05-15',d1_databases:[{binding:'DB',database_name:'site-creator-d1',database_id:'00000000-0000-4000-8000-000000000000',migrations_dir:'../drizzle'}]},null,2));
console.log('Local configuration ready. Personal snapshots belong in ignored private-data/.');
