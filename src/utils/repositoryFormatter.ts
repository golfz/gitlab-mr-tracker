/**
 * Splits a repository path into namespace and project name parts
 * @param repositoryPath - Full repository path (e.g., "regional/platform/auth-service")
 * @returns Object with namespace and projectName, or null if path doesn't contain '/'
 */
export function splitRepositoryPath(repositoryPath: string): { namespace: string; projectName: string } | null {
  const lastSlashIndex = repositoryPath.lastIndexOf('/');
  if (lastSlashIndex === -1) {
    // No slash found, treat entire string as project name
    return { namespace: '', projectName: repositoryPath };
  }
  const namespace = repositoryPath.substring(0, lastSlashIndex + 1); // Include the trailing slash
  const projectName = repositoryPath.substring(lastSlashIndex + 1);
  return { namespace, projectName };
}

