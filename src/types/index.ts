export enum MRStatus {
  COMMENTED = 'commented',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  MERGED = 'merged',
}

export interface Reviewer {
  id: number;
  username: string;
  name: string;
  avatarUrl: string;
}

export interface Approver {
  id: number;
  username: string;
  name: string;
  avatarUrl: string;
}

export interface Author {
  id: number;
  username: string;
  name: string;
  avatarUrl: string;
}

export interface MergeRequest {
  id: string;
  url: string;
  projectId: number;
  iid: number;
  title: string;
  repository: string;
  status: MRStatus;
  statusUpdatedAt: string;
  author: Author;
  reviewers: Reviewer[];
  approvers: Approver[];
  lastFetchedAt: string;
  createdAt: string;
  latestCommentAt?: string;
}

export interface AppConfig {
  gitlabHost: string;
  accessToken: string;
  autoRefreshInterval: number;
  myAccount: string;
  teamAccounts: string[];
  fetchTimeUnit: 'days' | 'weeks';
  fetchTimeValue: number;
  fetchClosedMRs: boolean;
}

export interface ParsedMRUrl {
  host: string;
  projectPath: string;
  iid: number;
}

export interface GitLabMR {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  state: string;
  web_url: string;
  created_at: string;
  updated_at: string;
  merged_at?: string;
  closed_at?: string;
  author: {
    id: number;
    username: string;
    name: string;
    avatar_url: string;
  };
  path_with_namespace?: string;
}

export interface GitLabApproval {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  description: string;
  state: string;
  created_at: string;
  updated_at: string;
  approvals_required: number;
  approvals_left: number;
  approved_by: Array<{
    user: {
      id: number;
      username: string;
      name: string;
      avatar_url: string;
    };
  }>;
}

export interface GitLabNote {
  id: number;
  body: string;
  author: {
    id: number;
    username: string;
    name: string;
    avatar_url: string;
  };
  created_at: string;
  system: boolean;
}

