'use strict';

// All media stay on the existing official project site; no anonymous-host dependencies.
const MEDIA_ROOT = 'https://liujiahao2077.github.io/InCoM.github.io/assets/';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.getElementById('site-nav');
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  nav.classList.toggle('open', open);
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open navigation');
}));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    nav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
  }
});

// Keyboard navigation for the two tab sets.
function keyboardTabs(tablist, selector) {
  tablist.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const tabs = [...tablist.querySelectorAll(selector)];
    const current = tabs.indexOf(document.activeElement);
    if (current < 0) return;
    event.preventDefault();
    let next = current;
    if (event.key === 'ArrowRight') next = (current + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    tabs[next].click();
    tabs[next].focus();
  });
}

const heroVideos = [...document.querySelectorAll('.preview-video')];
const heroPlayback = document.getElementById('hero-playback');
let previewEnabled = !reduceMotion.matches;
const visiblePreviews = new Set();
function updatePreviewLabel() {
  heroPlayback.querySelector('span').textContent = previewEnabled ? 'Pause previews' : 'Play previews';
  heroPlayback.setAttribute('aria-label', previewEnabled ? 'Pause preview videos' : 'Play preview videos');
  heroPlayback.querySelector('use').setAttribute('href', previewEnabled ? '#icon-pause' : '#icon-play');
}
function updatePreviewPlayback() {
  heroVideos.forEach(video => {
    if (previewEnabled && visiblePreviews.has(video) && !document.hidden) {
      video.play().catch(() => { video.controls = true; });
    } else video.pause();
  });
  updatePreviewLabel();
}
const previewObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => entry.isIntersecting ? visiblePreviews.add(entry.target) : visiblePreviews.delete(entry.target));
  updatePreviewPlayback();
}, { threshold: 0.15 });
heroVideos.forEach(video => previewObserver.observe(video));
heroPlayback.addEventListener('click', () => { previewEnabled = !previewEnabled; updatePreviewPlayback(); });
document.addEventListener('visibilitychange', () => {
  updatePreviewPlayback();
  if (document.hidden) document.querySelectorAll('video:not(.preview-video)').forEach(video => video.pause());
});
reduceMotion.addEventListener('change', event => { previewEnabled = !event.matches; updatePreviewPlayback(); });
updatePreviewLabel();

const environments = {
  real: {
    baseline: 'Pi0.5', label: 'π₀.₅',
    description: 'Coordinated base motion and manipulation on a dual-arm mobile robot.',
    tasks: [['throw_rubbish', 'Throw rubbish'], ['close_drawer', 'Close drawer'], ['pick_banana', 'Pick banana'], ['move_block', 'Move block']]
  },
  sim: {
    baseline: 'DSPv2', label: 'DSPv2',
    description: 'Mobile manipulation in the ManiSkill-HAB benchmark.',
    tasks: [['pick_box_from_counter', 'Pick box from counter'], ['place_can_on_counter', 'Place can on counter'], ['pick_box_from_sofa', 'Pick box from sofa'], ['place_can_on_sofa', 'Place can on sofa']]
  }
};
let environment = 'real';
const comparisonVideos = [...document.querySelectorAll('.comparison-card video')];
const taskBar = document.querySelector('.task-bar');
const playTogether = document.getElementById('play-together');
const demoStatus = document.getElementById('demo-status');

function selectTask(task, label) {
  taskBar.querySelectorAll('button').forEach(button => {
    const selected = button.dataset.task === task;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  const config = environments[environment];
  const methods = ['ACT', config.baseline, 'InCoM'];
  comparisonVideos.forEach((video, index) => {
    video.pause();
    video.closest('figure').querySelector('.media-error')?.remove();
    video.src = MEDIA_ROOT + environment + '/' + methods[index] + '/' + task + '.mp4#t=0.1';
    video.setAttribute('aria-label', (index === 1 ? config.label : methods[index]) + ': ' + label);
    video.load();
  });
  demoStatus.textContent = label + ' selected. Press Play all from start to compare policies.';
}
taskBar.addEventListener('click', event => {
  const button = event.target.closest('button[data-task]');
  if (button) selectTask(button.dataset.task, button.textContent);
});
document.querySelectorAll('[data-env]').forEach(button => button.addEventListener('click', () => {
  environment = button.dataset.env;
  const config = environments[environment];
  document.querySelectorAll('[data-env]').forEach(tab => {
    const selected = tab === button;
    tab.classList.toggle('active', selected);
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  document.getElementById('demo-workspace').setAttribute('aria-labelledby', button.id);
  document.getElementById('second-baseline').textContent = config.label;
  document.getElementById('demo-description').textContent = config.description;
  taskBar.replaceChildren(...config.tasks.map(([id, label]) => {
    const task = document.createElement('button');
    task.type = 'button'; task.className = 'task-button'; task.dataset.task = id;
    task.textContent = label; task.setAttribute('aria-pressed', 'false');
    return task;
  }));
  selectTask(...config.tasks[0]);
}));
keyboardTabs(document.querySelector('.demo-switch'), '[role=tab]');
playTogether.addEventListener('click', async () => {
  const outcomes = await Promise.allSettled(comparisonVideos.map(video => {
    video.currentTime = 0;
    return video.play();
  }));
  demoStatus.textContent = outcomes.some(result => result.status === 'rejected')
    ? 'Some videos could not start. Please use their individual play controls.'
    : 'All three videos started from the beginning.';
});
const demosObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (!entry.isIntersecting) comparisonVideos.forEach(video => video.pause()); });
}, { threshold: 0 });
demosObserver.observe(document.querySelector('.comparison-grid'));

const showcase = document.querySelector('.showcase-details');
const fullVideo = document.getElementById('full-showcase');
showcase.addEventListener('toggle', () => {
  if (showcase.open && !fullVideo.getAttribute('src')) {
    fullVideo.src = fullVideo.dataset.src;
    fullVideo.load();
  }
  if (!showcase.open) fullVideo.pause();
});

document.querySelectorAll('[data-result]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-result]').forEach(tab => {
    const selected = button === tab;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden = !selected;
  });
}));
keyboardTabs(document.querySelector('.result-tabs'), '[role=tab]');

const figureDialog = document.getElementById('figure-dialog');
document.getElementById('expand-framework').addEventListener('click', () => figureDialog.showModal());
figureDialog.querySelector('.dialog-close').addEventListener('click', () => figureDialog.close());
figureDialog.addEventListener('click', event => { if (event.target === figureDialog) figureDialog.close(); });

document.getElementById('copy-citation').addEventListener('click', async () => {
  const code = document.getElementById('bibtex');
  const status = document.getElementById('copy-status');
  try {
    await navigator.clipboard.writeText(code.textContent);
    status.textContent = 'Citation copied to clipboard.';
  } catch {
    const range = document.createRange();
    range.selectNodeContents(code);
    const selection = window.getSelection();
    selection.removeAllRanges(); selection.addRange(range);
    status.textContent = 'Citation selected. Press Ctrl+C or ⌘C to copy.';
  }
});

const navigationLinks = [...nav.querySelectorAll('a')];
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navigationLinks.forEach(link => {
      const active = link.hash === '#' + entry.target.id;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  });
}, { rootMargin: '-15% 0px -55% 0px' });
navigationLinks.forEach(link => { const section = document.querySelector(link.hash); if (section) sectionObserver.observe(section); });

document.querySelectorAll('video').forEach(video => video.addEventListener('error', () => {
  if (video.parentElement.querySelector('.media-error')) return;
  const error = document.createElement('p');
  error.className = 'media-error';
  error.append('Video unavailable. ');
  const link = document.createElement('a');
  link.href = video.currentSrc || video.src; link.textContent = 'Open original video';
  link.target = '_blank'; link.rel = 'noopener noreferrer';
  error.append(link); video.after(error);
}));
