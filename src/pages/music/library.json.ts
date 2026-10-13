import azureContent from '@/data/azure-content.json';
import { musicLibrary } from '@/lib/music-library.mjs';

export function GET(): Response {
  return Response.json(musicLibrary(azureContent.playlist).map(({ id, name, artist, cover }) => ({ id, name, artist, cover })));
}
