function extractChunks() {

  const chunks = [];


  // ------------- Metadata -------------------
  // Page title
  if (document.title && document.title.trim()) {
    chunks.push({
      text: document.title.trim().replace(/\s+/g, ' '),
      tag: 'TITLE',
    });
  }

  // Meta description
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    const t = (metaDesc.getAttribute('content') || '').trim();
    if (t) chunks.push({ text: t.replace(/\s+/g, ' '), tag: 'META' });
  }


  //------------ Walker ----------------
  function walk(el) {
    
    // Decision 1: SKIP — prune entire branch
    if (shouldSkip(el)) return;

    // Decision 2: COLLECT — grab text, stop
    if (shouldCollect(el)) {
      const text = getTextWithSpaces(el).trim().replace(/\s+/g, ' ');
      if (text.length > 1) chunks.push({ text, tag: el.tagName });
      return;
    }

    // Decision 3: RECURSE — go into children
    for (const child of el.children) {
      walk(child);
    }
  }


  walk(document.body);
  return chunks;
}


function shouldSkip(el) {

  if (SKIP_TAGS.has(el.tagName)) return true;

  // Skip by ARIA role
  const role = el.getAttribute('role');
  if (role && SKIP_ROLES.has(role)) return true;


  // Hidden elements
  if (el.hasAttribute('hidden')) return true;
  if (el.getAttribute('aria-hidden') === 'true') return true;

  const style = window.getComputedStyle(el);
  if (style.display === 'none') return true;
  if (style.visibility === 'hidden') return true;
  if (style.opacity === '0') return true;


  const id  = (el.id || '').toLowerCase();
  const cls = typeof el.className === 'string' ? el.className.toLowerCase() : '';

  if (SKIP_PATTERNS.test(id) || SKIP_PATTERNS.test(cls))
    return true;

  if (el.hasAttribute('data-ad')       || el.hasAttribute('data-ad-unit') ||
      el.hasAttribute('data-adunit')   || el.hasAttribute('data-dfp')     ||
      el.hasAttribute('data-sponsored'))
    return true;

  return false;
}


function shouldCollect(el) {

  if (COLLECT_TAGS.has(el.tagName)) return true;

  // DIV or SPAN acting as a text leaf
  if (el.tagName === 'DIV' || el.tagName === 'SPAN' || el.tagName === 'A') {
    if (hasDirectText(el) && !hasBlockChild(el)) return true;
  }

  return false;
}


function hasDirectText(el) {
  for (const child of el.childNodes) {
    if (
      child.nodeType === Node.TEXT_NODE &&
      child.textContent.trim().length > 1   //update min length condition. what should be the minimum length?
    )
      return true;
  }
  return false;
}



function hasBlockChild(el) {

  for (const child of el.children) {
    if (BLOCK_TAGS.has(child.tagName)) return true;
  }

  return false;
}


function getTextWithSpaces(el) {
  let parts = [];

  function collect(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = node.textContent.trim();
      if (t.length > 0) parts.push(t);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    for (const child of node.childNodes) {
      collect(child);
    }
  }

  collect(el);
  return parts.join(' ');
}


const SKIP_TAGS = new Set([
  'NAV', 'HEADER', 'FOOTER',
  'SCRIPT', 'STYLE', 'NOSCRIPT',
  'IFRAME', 'SVG', 'CANVAS',
  'BUTTON', 'SELECT', 'OPTION', 'TEXTAREA',
  'PICTURE', 'VIDEO', 'AUDIO', 'TRACK',
  'MAP', 'AREA',
  'TEMPLATE',
  'DATALIST'
]);


const SKIP_ROLES = new Set([
  'navigation',
  'banner',
  'contentinfo',
  'menubar', 'menu', 'menuitem',
  'toolbar',
  'dialog', 'alertdialog',
  'search',
]);

const SKIP_PATTERNS = 
  /\b(navbar|toolbar|topbar|breadcrumb|pagination|cookie|gdpr|advert|advertisement|dfp|outbrain|taboola|mgid|sticky-header|fixed-header|flyout|dropdown|megamenu|toast|snackbar|notification-bar)\b/;

const COLLECT_TAGS = new Set([
  'P',
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'LI',
  'TD', 'TH',
  'BLOCKQUOTE', 'FIGCAPTION', 'CAPTION',
  'DT', 'DD',
  'SUMMARY'
]);


const BLOCK_TAGS = new Set([
  'P', 'DIV', 'SECTION', 'ARTICLE', 'ASIDE',
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'UL', 'OL', 'LI', 'TABLE', 'TR', 'TD', 'TH',
  'BLOCKQUOTE', 'FIGURE', 'FIGCAPTION',
  'MAIN', 'HEADER', 'FOOTER', 'NAV',
  'DETAILS','SUMMARY',
  'FORM','FIELDSET'
]);
