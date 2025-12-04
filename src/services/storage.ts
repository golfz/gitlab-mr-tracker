import { AppConfig, MergeRequest, MRStatus } from '../types';

const CONFIG_KEY = 'gitlab_mr_config';
const MR_LIST_KEY = 'gitlab_mr_list';
const LAST_UPDATED_KEY = 'gitlab_mr_last_updated';
const HIDDEN_MRS_KEY = 'gitlab_mr_hidden';
const STATUS_FILTERS_KEY = 'gitlab_mr_status_filters';
const MR_READ_TIMESTAMPS_KEY = 'gitlab_mr_read_timestamps';

export const storage = {
  getConfig(): AppConfig | null {
    try {
      const item = localStorage.getItem(CONFIG_KEY);
      if (!item) return null;
      return JSON.parse(item) as AppConfig;
    } catch {
      return null;
    }
  },

  saveConfig(config: AppConfig): void {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  },

  getMRList(): MergeRequest[] {
    try {
      const item = localStorage.getItem(MR_LIST_KEY);
      if (!item) return [];
      return JSON.parse(item) as MergeRequest[];
    } catch {
      return [];
    }
  },

  saveMRList(mrList: MergeRequest[]): void {
    try {
      localStorage.setItem(MR_LIST_KEY, JSON.stringify(mrList));
    } catch (error) {
      console.error('Failed to save MR list:', error);
    }
  },

  getLastUpdated(): string | null {
    return localStorage.getItem(LAST_UPDATED_KEY);
  },

  saveLastUpdated(timestamp: string): void {
    try {
      localStorage.setItem(LAST_UPDATED_KEY, timestamp);
    } catch (error) {
      console.error('Failed to save last updated:', error);
    }
  },

  getHiddenMRs(): string[] {
    try {
      const item = localStorage.getItem(HIDDEN_MRS_KEY);
      if (!item) return [];
      return JSON.parse(item) as string[];
    } catch {
      return [];
    }
  },

  saveHiddenMRs(hiddenIds: string[]): void {
    try {
      localStorage.setItem(HIDDEN_MRS_KEY, JSON.stringify(hiddenIds));
    } catch (error) {
      console.error('Failed to save hidden MRs:', error);
    }
  },

  getStatusFilters(): Record<MRStatus, boolean> {
    try {
      const item = localStorage.getItem(STATUS_FILTERS_KEY);
      if (!item) {
        // Default: all statuses visible
        return {
          [MRStatus.COMMENTED]: true,
          [MRStatus.APPROVED]: true,
          [MRStatus.REJECTED]: true,
          [MRStatus.MERGED]: true,
        };
      }
      return JSON.parse(item) as Record<MRStatus, boolean>;
    } catch {
      return {
        [MRStatus.COMMENTED]: true,
        [MRStatus.APPROVED]: true,
        [MRStatus.REJECTED]: true,
        [MRStatus.MERGED]: true,
      };
    }
  },

  saveStatusFilters(filters: Record<MRStatus, boolean>): void {
    try {
      localStorage.setItem(STATUS_FILTERS_KEY, JSON.stringify(filters));
    } catch (error) {
      console.error('Failed to save status filters:', error);
    }
  },

  getMRReadTimestamps(): Record<string, string> {
    try {
      const item = localStorage.getItem(MR_READ_TIMESTAMPS_KEY);
      if (!item) return {};
      return JSON.parse(item) as Record<string, string>;
    } catch {
      return {};
    }
  },

  saveMRReadTimestamps(timestamps: Record<string, string>): void {
    try {
      localStorage.setItem(MR_READ_TIMESTAMPS_KEY, JSON.stringify(timestamps));
    } catch (error) {
      console.error('Failed to save MR read timestamps:', error);
    }
  },

  updateMRReadTimestamp(mrId: string, timestamp: string): void {
    try {
      const timestamps = this.getMRReadTimestamps();
      timestamps[mrId] = timestamp;
      this.saveMRReadTimestamps(timestamps);
    } catch (error) {
      console.error('Failed to update MR read timestamp:', error);
    }
  },
};

