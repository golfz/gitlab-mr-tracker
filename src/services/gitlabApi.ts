import {
  AppConfig,
  MergeRequest,
  MRStatus,
  GitLabMR,
  GitLabApproval,
  GitLabNote,
  ParsedMRUrl,
  Reviewer,
  Approver,
} from '../types';

class GitLabAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public statusText?: string
  ) {
    super(message);
    this.name = 'GitLabAPIError';
  }
}

async function fetchGitLabAPI(
  url: string,
  accessToken: string
): Promise<Response> {
  const response = await fetch(url, {
    headers: {
      'PRIVATE-TOKEN': accessToken,
    },
  });

  if (!response.ok) {
    throw new GitLabAPIError(
      `GitLab API error: ${response.statusText}`,
      response.status,
      response.statusText
    );
  }

  return response;
}

export async function fetchMergeRequest(
  config: AppConfig,
  parsedUrl: ParsedMRUrl
): Promise<MergeRequest> {
  const projectPath = encodeURIComponent(parsedUrl.projectPath);
  const baseUrl = `${config.gitlabHost}/api/v4/projects/${projectPath}`;

  // Fetch MR details
  const mrUrl = `${baseUrl}/merge_requests/${parsedUrl.iid}`;
  const mrResponse = await fetchGitLabAPI(mrUrl, config.accessToken);
  const mrData: GitLabMR = await mrResponse.json();

  // Fetch approvals
  let approvals: GitLabApproval | null = null;
  try {
    const approvalsUrl = `${baseUrl}/merge_requests/${parsedUrl.iid}/approvals`;
    const approvalsResponse = await fetchGitLabAPI(approvalsUrl, config.accessToken);
    approvals = await approvalsResponse.json();
  } catch (error) {
    console.warn('Failed to fetch approvals:', error);
  }

  // Fetch notes/comments
  let notes: GitLabNote[] = [];
  try {
    const notesUrl = `${baseUrl}/merge_requests/${parsedUrl.iid}/notes`;
    const notesResponse = await fetchGitLabAPI(notesUrl, config.accessToken);
    notes = await notesResponse.json();
  } catch (error) {
    console.warn('Failed to fetch notes:', error);
  }

  // Determine status
  let status: MRStatus;
  if (mrData.state === 'merged') {
    status = MRStatus.MERGED;
  } else if (mrData.state === 'closed') {
    status = MRStatus.REJECTED;
  } else if (approvals && approvals.approved_by && approvals.approved_by.length > 0) {
    status = MRStatus.APPROVED;
  } else if (notes && notes.length > 0 && notes.some(note => !note.system)) {
    status = MRStatus.COMMENTED;
  } else {
    // New MR without any comments
    status = MRStatus.NEW;
  }

  // Extract approvers
  const approvers: Approver[] = approvals?.approved_by?.map((item) => ({
    id: item.user.id,
    username: item.user.username,
    name: item.user.name,
    avatarUrl: item.user.avatar_url || '',
  })) || [];

  // Extract reviewers from notes (non-system comments)
  const reviewerMap = new Map<number, Reviewer>();
  notes
    .filter((note) => !note.system)
    .forEach((note) => {
      if (!reviewerMap.has(note.author.id)) {
        reviewerMap.set(note.author.id, {
          id: note.author.id,
          username: note.author.username,
          name: note.author.name,
          avatarUrl: note.author.avatar_url || '',
        });
      }
    });

  const reviewers = Array.from(reviewerMap.values());

  // Extract author
  const author = {
    id: mrData.author.id,
    username: mrData.author.username,
    name: mrData.author.name,
    avatarUrl: mrData.author.avatar_url || '',
  };

  // Get latest comment timestamp (non-system comments)
  const latestComment = notes
    .filter((note) => !note.system)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  const latestCommentAt = latestComment?.created_at;

  // Determine status updated time based on status
  let statusUpdatedAt: string;
  
  if (status === MRStatus.MERGED && mrData.merged_at) {
    statusUpdatedAt = mrData.merged_at;
  } else if (status === MRStatus.REJECTED && mrData.closed_at) {
    statusUpdatedAt = mrData.closed_at;
  } else if (status === MRStatus.APPROVED && approvals?.updated_at) {
    statusUpdatedAt = approvals.updated_at;
  } else if (mrData.updated_at) {
    statusUpdatedAt = mrData.updated_at;
  } else {
    // Fallback to created_at or current time
    statusUpdatedAt = mrData.created_at || new Date().toISOString();
  }

  const mr: MergeRequest = {
    id: `${parsedUrl.host}/${parsedUrl.projectPath}/-/merge_requests/${parsedUrl.iid}`,
    url: mrData.web_url,
    projectId: mrData.project_id,
    iid: mrData.iid,
    title: mrData.title,
    repository: parsedUrl.projectPath,
    status,
    statusUpdatedAt,
    author,
    reviewers,
    approvers,
    lastFetchedAt: new Date().toISOString(),
    createdAt: mrData.created_at,
    latestCommentAt,
  };

  return mr;
}

export async function updateMergeRequest(
  config: AppConfig,
  existingMR: MergeRequest
): Promise<MergeRequest> {
  const parsedUrl = parseMRUrlFromId(existingMR.id);
  if (!parsedUrl) {
    throw new Error('Invalid MR ID');
  }
  return fetchMergeRequest(config, parsedUrl);
}

function parseMRUrlFromId(id: string): ParsedMRUrl | null {
  try {
    const urlObj = new URL(id.startsWith('http') ? id : `https://${id}`);
    const pathMatch = urlObj.pathname.match(/^\/(.+?)\/-\/merge_requests\/(\d+)$/);
    
    if (!pathMatch) {
      return null;
    }
    
    return {
      host: urlObj.origin,
      projectPath: pathMatch[1],
      iid: parseInt(pathMatch[2], 10),
    };
  } catch {
    return null;
  }
}

export async function fetchMRsByAuthor(
  config: AppConfig,
  username: string
): Promise<MergeRequest[]> {
  // Remove @ if present
  const cleanUsername = username.startsWith('@') ? username.slice(1) : username;
  
  // Calculate created_after date based on fetch time limit
  const now = new Date();
  let createdAfter: Date;
  
  if (config.fetchTimeUnit === 'days') {
    createdAfter = new Date(now.getTime() - config.fetchTimeValue * 24 * 60 * 60 * 1000);
  } else {
    // weeks
    createdAfter = new Date(now.getTime() - config.fetchTimeValue * 7 * 24 * 60 * 60 * 1000);
  }
  
  // Format date as ISO 8601 (GitLab API format)
  const createdAfterStr = createdAfter.toISOString().split('T')[0];
  
  const baseUrl = `${config.gitlabHost}/api/v4/merge_requests`;
  
  // Fetch MRs within time limit
  // Note: GitLab API doesn't support filtering by multiple states in one request,
  // so we fetch all states and filter client-side based on fetchClosedMRs config
  const url = `${baseUrl}?author_username=${encodeURIComponent(cleanUsername)}&scope=all&created_after=${createdAfterStr}&per_page=100`;
  
  try {
    const response = await fetchGitLabAPI(url, config.accessToken);
    let mrList: GitLabMR[] = await response.json();
    
    // Filter out closed MRs if fetchClosedMRs is false
    // Closed MRs have state='closed' and are not merged
    if (!config.fetchClosedMRs) {
      mrList = mrList.filter((mr) => mr.state !== 'closed');
    }
    
    // Fetch full details for each MR
    const mrDetails = await Promise.allSettled(
      mrList.map(async (mr) => {
        // Get project path from project API
        let projectPath: string;
        try {
          const projectUrl = `${config.gitlabHost}/api/v4/projects/${mr.project_id}`;
          const projectResponse = await fetchGitLabAPI(projectUrl, config.accessToken);
          const project = await projectResponse.json();
          projectPath = project.path_with_namespace;
        } catch {
          // Fallback: try to extract from web_url if available
          if (mr.web_url) {
            const urlMatch = mr.web_url.match(/https?:\/\/[^/]+\/(.+?)\/-\/merge_requests/);
            if (urlMatch) {
              projectPath = urlMatch[1];
            } else {
              throw new Error(`Could not get project path for project ${mr.project_id}`);
            }
          } else {
            throw new Error(`Could not get project path for project ${mr.project_id}`);
          }
        }
        
        const parsedUrl: ParsedMRUrl = {
          host: config.gitlabHost,
          projectPath,
          iid: mr.iid,
        };
        
        return fetchMergeRequest(config, parsedUrl);
      })
    );
    
    let finalMRs = mrDetails
      .filter((result): result is PromiseFulfilledResult<MergeRequest> => 
        result.status === 'fulfilled'
      )
      .map((result) => result.value);
    
    // Filter out closed/rejected MRs if fetchClosedMRs is false
    // This is a second filter after fetching full details, in case status changed
    if (!config.fetchClosedMRs) {
      finalMRs = finalMRs.filter((mr) => mr.status !== MRStatus.REJECTED);
    }
    
    return finalMRs;
  } catch (error) {
    console.error(`Failed to fetch MRs for author ${username}:`, error);
    throw error;
  }
}

export { GitLabAPIError };

