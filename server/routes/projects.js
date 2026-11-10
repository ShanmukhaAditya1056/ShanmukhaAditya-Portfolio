import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectsFile = path.resolve(__dirname, '../../shared/projects.json');
const projects = JSON.parse(fs.readFileSync(projectsFile, 'utf8'));

const router = Router();

router.get('/', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=300');
  res.json({ success: true, data: projects });
});

export default router;
