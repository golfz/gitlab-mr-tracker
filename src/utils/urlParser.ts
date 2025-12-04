import { ParsedMRUrl } from '../types';

export function parseMRUrl(url: string): ParsedMRUrl | null {
  try {
    const urlObj = new URL(url);
    
    // Pattern: https://{host}/{group}/{project}/-/merge_requests/{iid}
    const pathMatch = urlObj.pathname.match(/^\/(.+?)\/-\/merge_requests\/(\d+)$/);
    
    if (!pathMatch) {
      return null;
    }
    
    const projectPath = pathMatch[1];
    const iid = parseInt(pathMatch[2], 10);
    
    if (isNaN(iid)) {
      return null;
    }
    
    return {
      host: urlObj.origin,
      projectPath,
      iid,
    };
  } catch {
    return null;
  }
}

export function isValidMRUrl(url: string): boolean {
  return parseMRUrl(url) !== null;
}

