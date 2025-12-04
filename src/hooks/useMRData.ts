import { useState, useEffect, useCallback } from 'react';
import { MergeRequest, AppConfig, MRStatus } from '../types';
import { storage } from '../services/storage';
import { fetchMergeRequest, updateMergeRequest, fetchMRsByAuthor, GitLabAPIError } from '../services/gitlabApi';
import { parseMRUrl } from '../utils/urlParser';

export type MRCategory = 'my' | 'team' | 'other';

export interface CategorizedMRs {
  my: MergeRequest[];
  team: MergeRequest[];
  other: MergeRequest[];
}

export function useMRData(config: AppConfig) {
  const [mrList, setMRList] = useState<MergeRequest[]>(() => {
    return storage.getMRList();
  });

  const [hiddenMRs, setHiddenMRs] = useState<string[]>(() => {
    return storage.getHiddenMRs();
  });

  const [lastUpdated, setLastUpdated] = useState<string | null>(() => {
    return storage.getLastUpdated();
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Save to storage whenever MR list or hidden MRs change
  useEffect(() => {
    storage.saveMRList(mrList);
  }, [mrList]);

  useEffect(() => {
    storage.saveHiddenMRs(hiddenMRs);
  }, [hiddenMRs]);

  // Helper to normalize username (remove @ if present, lowercase)
  const normalizeUsername = (username: string): string => {
    return username.startsWith('@') ? username.slice(1).toLowerCase() : username.toLowerCase();
  };

  // Categorize MRs
  const categorizeMRs = useCallback((mrs: MergeRequest[]): CategorizedMRs => {
    const myUsername = normalizeUsername(config.myAccount);
    const teamUsernames = config.teamAccounts.map(normalizeUsername);

    const categorized: CategorizedMRs = {
      my: [],
      team: [],
      other: [],
    };

    mrs.forEach((mr) => {
      const authorUsername = normalizeUsername(mr.author.username);
      
      if (myUsername && authorUsername === myUsername) {
        categorized.my.push(mr);
      } else if (teamUsernames.length > 0 && teamUsernames.includes(authorUsername)) {
        categorized.team.push(mr);
      } else {
        categorized.other.push(mr);
      }
    });

    // Sort by created time (newer first)
    const sortByCreated = (a: MergeRequest, b: MergeRequest) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    };

    categorized.my.sort(sortByCreated);
    categorized.team.sort(sortByCreated);
    categorized.other.sort(sortByCreated);

    return categorized;
  }, [config.myAccount, config.teamAccounts]);

  const addMR = useCallback(async (url: string) => {
    setError(null);
    setLoading(true);

    try {
      const parsedUrl = parseMRUrl(url);
      if (!parsedUrl) {
        throw new Error('Invalid GitLab merge request URL');
      }

      // Check for duplicates
      const existing = mrList.find((mr) => mr.url === url);
      if (existing) {
        throw new Error('This merge request is already in the list');
      }

      // Check if config is valid
      if (!config.accessToken) {
        throw new Error('Please configure your GitLab access token first');
      }

      const mr = await fetchMergeRequest(config, parsedUrl);
      setMRList((prev) => [mr, ...prev]);
      setLastUpdated(new Date().toISOString());
      storage.saveLastUpdated(new Date().toISOString());
    } catch (err) {
      if (err instanceof GitLabAPIError) {
        if (err.statusCode === 401) {
          setError('Invalid or expired access token. Please check your configuration.');
        } else if (err.statusCode === 404) {
          setError('Merge request not found or you do not have access.');
        } else {
          setError(err.message);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to add merge request');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [config, mrList]);

  const removeMR = useCallback((id: string) => {
    setMRList((prev) => prev.filter((mr) => mr.id !== id));
    // Also remove from hidden list if present
    setHiddenMRs((prev) => prev.filter((hiddenId) => hiddenId !== id));
  }, []);

  const hideMR = useCallback((id: string) => {
    if (!hiddenMRs.includes(id)) {
      setHiddenMRs((prev) => [...prev, id]);
    }
  }, [hiddenMRs]);

  const unhideMR = useCallback((id: string) => {
    setHiddenMRs((prev) => prev.filter((hiddenId) => hiddenId !== id));
  }, []);

  const refreshMR = useCallback(async (mr: MergeRequest) => {
    try {
      if (!config.accessToken) {
        return;
      }
      const updated = await updateMergeRequest(config, mr);
      setMRList((prev) =>
        prev.map((item) => (item.id === mr.id ? updated : item))
      );
    } catch (err) {
      console.error('Failed to refresh MR:', err);
    }
  }, [config]);

  const refreshAll = useCallback(async () => {
    if (!config.accessToken || mrList.length === 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updates = await Promise.allSettled(
        mrList.map((mr) => updateMergeRequest(config, mr))
      );

      const updatedList = updates.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        }
        return mrList[index];
      });

      setMRList(updatedList);
      setLastUpdated(new Date().toISOString());
      storage.saveLastUpdated(new Date().toISOString());
    } catch (err) {
      console.error('Failed to refresh MRs:', err);
      setError('Failed to refresh some merge requests');
    } finally {
      setLoading(false);
    }
  }, [config, mrList]);

  const subscribeToAccounts = useCallback(async () => {
    if (!config.accessToken) {
      setError('Please configure your GitLab access token first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const allMRs: MergeRequest[] = [];
      const existingUrls = new Set(mrList.map((mr) => mr.url));

      // Fetch my account MRs
      if (config.myAccount) {
        try {
          const myMRs = await fetchMRsByAuthor(config, config.myAccount);
          myMRs.forEach((mr) => {
            // Skip closed MRs if fetchClosedMRs is disabled
            if (!config.fetchClosedMRs && mr.status === MRStatus.REJECTED) {
              return;
            }
            if (!existingUrls.has(mr.url)) {
              allMRs.push(mr);
              existingUrls.add(mr.url);
            } else {
              // Update existing MR
              const existingIndex = mrList.findIndex((m) => m.url === mr.url);
              if (existingIndex >= 0) {
                allMRs.push(mr);
              }
            }
          });
        } catch (err) {
          console.error('Failed to fetch my account MRs:', err);
        }
      }

      // Fetch team account MRs
      for (const teamAccount of config.teamAccounts) {
        if (!teamAccount.trim()) continue;
        try {
          const teamMRs = await fetchMRsByAuthor(config, teamAccount);
          teamMRs.forEach((mr) => {
            // Skip closed MRs if fetchClosedMRs is disabled
            if (!config.fetchClosedMRs && mr.status === MRStatus.REJECTED) {
              return;
            }
            if (!existingUrls.has(mr.url)) {
              allMRs.push(mr);
              existingUrls.add(mr.url);
            } else {
              // Update existing MR
              const existingIndex = mrList.findIndex((m) => m.url === mr.url);
              if (existingIndex >= 0) {
                allMRs.push(mr);
              }
            }
          });
        } catch (err) {
          console.error(`Failed to fetch MRs for ${teamAccount}:`, err);
        }
      }

      // Merge with existing MRs (keep manually added ones)
      const existingMRs = mrList.filter((mr) => {
        const authorUsername = normalizeUsername(mr.author.username);
        const myUsername = normalizeUsername(config.myAccount);
        const teamUsernames = config.teamAccounts.map(normalizeUsername);
        
        return authorUsername !== myUsername && !teamUsernames.includes(authorUsername);
      });

      setMRList([...existingMRs, ...allMRs]);
      setLastUpdated(new Date().toISOString());
      storage.saveLastUpdated(new Date().toISOString());
    } catch (err) {
      console.error('Failed to subscribe to accounts:', err);
      setError('Failed to fetch MRs from configured accounts');
    } finally {
      setLoading(false);
    }
  }, [config, mrList]);

  const updateMRList = useCallback((updated: MergeRequest[]) => {
    setMRList(updated);
    setLastUpdated(new Date().toISOString());
    storage.saveLastUpdated(new Date().toISOString());
  }, []);

  return {
    mrList,
    hiddenMRs,
    lastUpdated,
    loading,
    error,
    categorizeMRs,
    addMR,
    removeMR,
    hideMR,
    unhideMR,
    refreshMR,
    refreshAll,
    subscribeToAccounts,
    updateMRList,
    setError,
  };
}
