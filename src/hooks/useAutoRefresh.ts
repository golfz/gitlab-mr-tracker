import { useEffect, useRef } from 'react';
import { AppConfig, MergeRequest } from '../types';
import { updateMergeRequest } from '../services/gitlabApi';

export function useAutoRefresh(
  config: AppConfig,
  mrList: MergeRequest[],
  onUpdate: (updated: MergeRequest[]) => void
) {
  const intervalRef = useRef<number | null>(null);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    if (!config.autoRefreshInterval || config.autoRefreshInterval <= 0) {
      return;
    }

    if (!config.accessToken || mrList.length === 0) {
      return;
    }

    const refresh = async () => {
      if (isRefreshingRef.current) {
        return;
      }

      isRefreshingRef.current = true;

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

        onUpdate(updatedList);
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      } finally {
        isRefreshingRef.current = false;
      }
    };

    // Initial refresh after interval
    intervalRef.current = window.setInterval(refresh, config.autoRefreshInterval * 1000);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [config.autoRefreshInterval, config.accessToken, mrList, onUpdate]);
}

