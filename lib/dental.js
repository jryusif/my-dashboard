/**
 * Dental Cases formatting & serialization helpers
 */

export function buildPhotosJson(body) {
  return {
    beforeAfter: body.beforeAfter || { beforeImageUrl: '', afterImageUrl: '', beforeLabel: 'Initial Condition', afterLabel: 'Final Result' },
    xrays: Array.isArray(body.xrays) ? body.xrays : [],
    tags: Array.isArray(body.tags) ? body.tags : [],
    photos: Array.isArray(body.photos) ? body.photos : []
  };
}

export function formatCaseOutput(c) {
  if (!c) return c;
  let beforeAfter = { beforeImageUrl: '', afterImageUrl: '', beforeLabel: 'Initial Condition', afterLabel: 'Final Result' };
  let xrays = [];
  let tags = [];

  const rawPhotos = c.photos;
  if (rawPhotos && typeof rawPhotos === 'object' && !Array.isArray(rawPhotos)) {
    if (rawPhotos.beforeAfter) beforeAfter = rawPhotos.beforeAfter;
    if (Array.isArray(rawPhotos.xrays)) xrays = rawPhotos.xrays;
    if (Array.isArray(rawPhotos.tags)) tags = rawPhotos.tags;
  } else if (Array.isArray(rawPhotos) && rawPhotos.length > 0) {
    const beforePhoto = rawPhotos.find(p => (p.label || '').toLowerCase().includes('pre') || (p.label || '').toLowerCase().includes('before'));
    const afterPhoto = rawPhotos.find(p => (p.label || '').toLowerCase().includes('post') || (p.label || '').toLowerCase().includes('after'));
    beforeAfter = {
      beforeImageUrl: (beforePhoto && beforePhoto.url) || (rawPhotos[0] && rawPhotos[0].url) || '',
      afterImageUrl: (afterPhoto && afterPhoto.url) || (rawPhotos[1] && rawPhotos[1].url) || '',
      beforeLabel: (beforePhoto && beforePhoto.label) || 'Initial Condition',
      afterLabel: (afterPhoto && afterPhoto.label) || 'Final Result'
    };
  }

  return {
    ...c,
    beforeAfter,
    xrays,
    tags
  };
}
