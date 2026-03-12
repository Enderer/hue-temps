import fs from 'node:fs';

fs.copyFileSync('config.template.yaml', 'dist/config.template.yaml');
