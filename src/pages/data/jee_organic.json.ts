/** The map's reaction graph, served from the site so the map and the pages always use the same data. */
import type { APIRoute } from 'astro';
import data from '../../app/data/jee_organic.json';

export const GET: APIRoute = () =>
  new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
