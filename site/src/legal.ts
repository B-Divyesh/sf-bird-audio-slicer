import './style.css';

const heading = document.querySelector<HTMLElement>('h1');
const status = document.querySelector<HTMLElement>('#route-status');
function announceRoute() {
  heading?.focus({ preventScroll: true });
  if (status && heading) status.textContent = heading.textContent ?? document.title;
}
announceRoute();
window.addEventListener('pageshow', announceRoute);

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
