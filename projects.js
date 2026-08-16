window.PROJECT_SLUG = function (title) {
  return String(title).toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

window.PROJECT_PAGES = {
  'logo-design':               { body: '', gallery: [] },
  'community-project':         { body: '', gallery: [] },
  'programming-for-education': { body: '', gallery: [] },
  'meta-me':                   { body: '', gallery: [] },
  'illuminate':                { body: '', gallery: [] },
  'amplifying-sound':          { body: '', gallery: [] },
  'final-client-project':      { body: '', gallery: [] },
  'design-3d-pen-video':       { body: '', gallery: [], video: '' },
  'voting-system':             { body: '', gallery: [] },
  'vanish-box':                { body: '', gallery: [] },
  'strixe':                    { body: '', gallery: [] },
  'velvet-revolution':         { body: '', gallery: [] },
  'hunt-it-down':              { body: '', gallery: [] },
  'tomera':                    { body: '', gallery: [] },
  'reservation-system':        { body: '', gallery: [] },
  'design-portfolio':          { body: '', gallery: [] },
};

window.PROJECT_STRIP_MIN = 4;
