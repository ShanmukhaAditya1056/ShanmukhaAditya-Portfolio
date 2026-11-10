import { useEffect, useState } from 'react';
import api from '../lib/api.js';
import localProjects from '../../../shared/projects.json';

/** Renders bundled project data immediately, then refreshes from GET /api/projects. */
export default function useProjects() {
  const [projects, setProjects] = useState(localProjects);

  useEffect(() => {
    const controller = new AbortController();
    api
      .get('/api/projects', { signal: controller.signal })
      .then(({ data }) => {
        if (Array.isArray(data?.data) && data.data.length > 0) setProjects(data.data);
      })
      .catch(() => {
        /* API offline — keep the bundled copy. */
      });
    return () => controller.abort();
  }, []);

  return projects;
}
