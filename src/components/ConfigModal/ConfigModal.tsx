import { useState, useEffect, FormEvent } from 'react';
import { AppConfig } from '../../types';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onSave: (config: AppConfig) => void;
}

export function ConfigModal({ isOpen, onClose, config, onSave }: ConfigModalProps) {
  const [formData, setFormData] = useState<AppConfig>(config);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setFormData(config);
      setErrors({});
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.gitlabHost.trim()) {
      newErrors.gitlabHost = 'GitLab host is required';
    } else {
      try {
        new URL(formData.gitlabHost);
      } catch {
        newErrors.gitlabHost = 'Invalid URL format';
      }
    }

    if (!formData.accessToken.trim()) {
      newErrors.accessToken = 'Access token is required';
    }

    if (formData.autoRefreshInterval <= 0) {
      newErrors.autoRefreshInterval = 'Auto-refresh interval must be greater than 0';
    }

    if (!formData.fetchTimeValue || formData.fetchTimeValue <= 0) {
      newErrors.fetchTimeValue = 'Fetch time limit is required';
    } else {
      const max = formData.fetchTimeUnit === 'days' ? 90 : 12;
      if (formData.fetchTimeValue > max) {
        newErrors.fetchTimeValue = `Maximum ${max} ${formData.fetchTimeUnit} allowed`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
      onClose();
    }
  };

  const handleCancel = () => {
    setFormData(config);
    setErrors({});
    onClose();
  };

  const handleExport = () => {
    try {
      const configJson = JSON.stringify(config, null, 2);
      const blob = new Blob([configJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'gitlab-mr-config.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export config:', error);
      alert('Failed to export configuration');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string) as AppConfig;
          
          // Validate imported config
          if (!imported.gitlabHost || !imported.accessToken) {
            alert('Invalid configuration file: missing required fields');
            return;
          }

          // Update form with imported config
          setFormData({
            gitlabHost: imported.gitlabHost || '',
            accessToken: imported.accessToken || '',
            autoRefreshInterval: imported.autoRefreshInterval || 60,
            myAccount: imported.myAccount || '',
            teamAccounts: imported.teamAccounts || [],
            fetchTimeUnit: imported.fetchTimeUnit || 'weeks',
            fetchTimeValue: imported.fetchTimeValue || 2,
            fetchClosedMRs: imported.fetchClosedMRs !== undefined ? imported.fetchClosedMRs : false,
          });
          
          alert('Configuration imported successfully! Click Save to apply.');
        } catch (error) {
          console.error('Failed to import config:', error);
          alert('Failed to import configuration: Invalid JSON file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Configuration</h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="gitlabHost" className="block text-sm font-medium text-gray-700 mb-1">
                GitLab Host
              </label>
              <input
                type="text"
                id="gitlabHost"
                value={formData.gitlabHost}
                onChange={(e) =>
                  setFormData({ ...formData, gitlabHost: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.gitlabHost ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="https://gitlab.com"
              />
              {errors.gitlabHost && (
                <p className="mt-1 text-sm text-red-600">{errors.gitlabHost}</p>
              )}
            </div>

            <div>
              <label htmlFor="accessToken" className="block text-sm font-medium text-gray-700 mb-1">
                Private Access Token
              </label>
              <input
                type="password"
                id="accessToken"
                value={formData.accessToken}
                onChange={(e) =>
                  setFormData({ ...formData, accessToken: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.accessToken ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your GitLab access token"
              />
              {errors.accessToken && (
                <p className="mt-1 text-sm text-red-600">{errors.accessToken}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Create a token at: Settings → Access Tokens
              </p>
            </div>

            <div>
              <label htmlFor="autoRefreshInterval" className="block text-sm font-medium text-gray-700 mb-1">
                Auto-refresh Interval (seconds)
              </label>
              <input
                type="number"
                id="autoRefreshInterval"
                value={formData.autoRefreshInterval}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    autoRefreshInterval: parseInt(e.target.value, 10) || 60,
                  })
                }
                min="10"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.autoRefreshInterval ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.autoRefreshInterval && (
                <p className="mt-1 text-sm text-red-600">{errors.autoRefreshInterval}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Minimum: 10 seconds
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fetch Time Limit <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 items-center">
                <div className="flex gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="fetchTimeUnit"
                      value="days"
                      checked={formData.fetchTimeUnit === 'days'}
                      onChange={() =>
                        setFormData({
                          ...formData,
                          fetchTimeUnit: 'days',
                          fetchTimeValue: Math.min(formData.fetchTimeValue, 90),
                        })
                      }
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">Days</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="fetchTimeUnit"
                      value="weeks"
                      checked={formData.fetchTimeUnit === 'weeks'}
                      onChange={() =>
                        setFormData({
                          ...formData,
                          fetchTimeUnit: 'weeks',
                          fetchTimeValue: Math.min(formData.fetchTimeValue, 12),
                        })
                      }
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">Weeks</span>
                  </label>
                </div>
                <input
                  type="number"
                  value={formData.fetchTimeValue}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10) || 0;
                    const max = formData.fetchTimeUnit === 'days' ? 90 : 12;
                    setFormData({
                      ...formData,
                      fetchTimeValue: Math.min(Math.max(value, 1), max),
                    });
                  }}
                  min="1"
                  max={formData.fetchTimeUnit === 'days' ? 90 : 12}
                  className={`w-20 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.fetchTimeValue ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.fetchTimeValue && (
                <p className="mt-1 text-sm text-red-600">{errors.fetchTimeValue}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Maximum: {formData.fetchTimeUnit === 'days' ? '90 days' : '12 weeks'}. Default: 2 weeks
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.fetchClosedMRs}
                  onChange={(e) =>
                    setFormData({ ...formData, fetchClosedMRs: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Fetch Closed MRs
                </span>
              </label>
              <p className="mt-1 text-xs text-gray-500 ml-6">
                When enabled, includes closed/rejected MRs in addition to opened and merged MRs. Default: disabled (only fetch opened and merged).
              </p>
            </div>

            <div>
              <label htmlFor="myAccount" className="block text-sm font-medium text-gray-700 mb-1">
                My Account
              </label>
              <input
                type="text"
                id="myAccount"
                value={formData.myAccount}
                onChange={(e) =>
                  setFormData({ ...formData, myAccount: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="@myname"
              />
              <p className="mt-1 text-xs text-gray-500">
                Your GitLab username (e.g., @myname). MRs from this account will appear in "My MRs" table.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team Accounts
              </label>
              <div className="space-y-2">
                {formData.teamAccounts.map((account, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={account}
                      onChange={(e) => {
                        const newAccounts = [...formData.teamAccounts];
                        newAccounts[index] = e.target.value;
                        setFormData({ ...formData, teamAccounts: newAccounts });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="@teammate"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newAccounts = formData.teamAccounts.filter((_, i) => i !== index);
                        setFormData({ ...formData, teamAccounts: newAccounts });
                      }}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      teamAccounts: [...formData.teamAccounts, ''],
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  + Add Team Account
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Team member usernames. MRs from these accounts will appear in "Team MRs" table.
              </p>
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={handleExport}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  📥 Export Config
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  📤 Import Config
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

