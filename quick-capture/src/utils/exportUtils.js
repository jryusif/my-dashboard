export function exportBrainDumpData(inbox, vault, stats) {
  const data = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    inbox,
    vault,
    stats,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `brain-dump-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importBrainDumpData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed.inbox && Array.isArray(parsed.inbox)) {
          resolve(parsed);
        } else {
          reject(new Error('Invalid brain dump backup format'));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read backup file'));
    reader.readAsText(file);
  });
}
