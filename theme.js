// ═══════════════════════════════════════════
//  THEME — light / dark / system switcher
//  (pre-paint resolver lives inline in each page <head>)
// ═══════════════════════════════════════════
(function(){
  var KEY = 'lr_theme_mode';
  var mq  = window.matchMedia('(prefers-color-scheme: dark)');

  function getMode(){ try{ return localStorage.getItem(KEY) || 'system'; }catch(e){ return 'system'; } }
  function resolve(mode){ return mode === 'system' ? (mq.matches ? 'dark' : 'light') : mode; }

  function apply(mode){
    var eff = resolve(mode);
    document.documentElement.setAttribute('data-theme', eff);
    document.querySelectorAll('.theme-switch button').forEach(function(b){
      b.classList.toggle('active', b.getAttribute('data-mode') === mode);
    });
  }
  function setMode(mode){ try{ localStorage.setItem(KEY, mode); }catch(e){} apply(mode); }

  window.LRTheme = { getMode: getMode, setMode: setMode, apply: apply };

  var ICONS = {
    light:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>',
    system: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
    dark:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
  };
  var TITLES = { light: 'Светлая тема', system: 'Системная тема', dark: 'Тёмная тема' };

  function build(){
    document.querySelectorAll('[data-theme-switch]').forEach(function(host){
      if(host.getAttribute('data-built')) return;
      host.setAttribute('data-built','1');
      host.classList.add('theme-switch');
      ['light','system','dark'].forEach(function(m){
        var b = document.createElement('button');
        b.setAttribute('data-mode', m);
        b.setAttribute('title', TITLES[m]);
        b.setAttribute('aria-label', TITLES[m]);
        b.innerHTML = ICONS[m];
        b.addEventListener('click', function(){ setMode(m); });
        host.appendChild(b);
      });
    });
    apply(getMode());
  }

  if(mq.addEventListener) mq.addEventListener('change', function(){ if(getMode() === 'system') apply('system'); });

  if(document.readyState !== 'loading') build();
  else document.addEventListener('DOMContentLoaded', build);
})();
