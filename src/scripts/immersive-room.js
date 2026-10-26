// The listening room is a view of MusicManager; no Audio object lives here.
export function setupImmersiveRoom(root, refreshLibrary) {
  const controller = new AbortController();
  const {signal} = controller;
  const drawer = root.querySelector('#library');
  if (!drawer || !root.querySelector('#music-room-player')) return () => controller.abort();
  const toggle = root.querySelector('[data-toggle-library]');
  const scrim = root.querySelector('.room-library-scrim');
  const narrow = matchMedia('(max-width: 900px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const motionButton = root.querySelector('[data-room-motion]');
  const fullscreenButton = root.querySelector('[data-room-fullscreen]');
  const tabs = root.querySelector('.room-tabs');
  const translation = root.querySelector('.btn-translation-toggle');
  if (translation && tabs) tabs.append(translation);
  const widget = root.querySelector('#music-room-player');
  const transport = widget?.querySelector('.music-transport');
  const times = widget?.querySelector('.music-times');
  if (times && transport) transport.append(times);
  const volume = widget?.querySelector('.music-volume');
  if (volume && transport) transport.append(volume);
  let savedOpen;
  try { savedOpen = localStorage.getItem('canglan-room-library-open'); } catch { /* defaults */ }
  const setOpen = (open, remember = false, focus = false) => {
    root.dataset.libraryOpen = String(open);
    drawer.inert = !open;
    drawer.setAttribute('aria-hidden', String(!open));
    toggle?.setAttribute('aria-expanded', String(open));
    if (scrim) scrim.hidden = !open || !narrow.matches;
    if (!open && drawer.contains(document.activeElement)) toggle?.focus({preventScroll:true});
    if (open && focus) drawer.querySelector('[data-close-library]')?.focus({preventScroll:true});
    if (remember) try { savedOpen=String(open);localStorage.setItem('canglan-room-library-open', savedOpen); } catch { /* private mode */ }
  };
  setOpen(location.hash === '#library' || (!narrow.matches && (savedOpen == null ? root.dataset.defaultLibraryOpen === 'true' : savedOpen === 'true')));
  root.addEventListener('click', event => {
    const target = event.target.closest?.('button');
    if (!target) return;
    if (target.matches('[data-toggle-library]')) setOpen(root.dataset.libraryOpen !== 'true',true,true);
    if (target.matches('[data-close-library]')) setOpen(false,true);
    const scope = target.dataset.libraryScope;
    if (scope) {
      root.dataset.libraryScope = scope;
      root.querySelectorAll('[data-library-scope]').forEach(button => button.setAttribute('aria-pressed',String(button===target)));
      const collections = root.querySelector('.room-collection-tabs');
      if (collections) collections.hidden = scope !== 'playlists';
      refreshLibrary(true);
    }
    if (target.matches('[data-room-motion]')) {
      root.dataset.motion = String(root.dataset.motion !== 'true');
      syncMotion();
    }
    if (target.matches('[data-room-fullscreen]')) {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(()=>{});
      else root.requestFullscreen?.().catch(()=>{});
    }
  },{signal});
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && root.dataset.libraryOpen === 'true') {
      event.preventDefault();setOpen(false,true);toggle?.focus({preventScroll:true});return;
    }
    // On narrow screens the open drawer covers the player: keep keyboard focus inside.
    if (event.key === 'Tab' && narrow.matches && root.dataset.libraryOpen === 'true') {
      const items = [...drawer.querySelectorAll('button:not([disabled]),input,a[href],select,[tabindex="0"]')].filter(node=>!node.closest('[hidden]'));
      const first=items[0],last=items.at(-1);
      if (event.shiftKey && document.activeElement===first) {event.preventDefault();last?.focus();}
      else if (!event.shiftKey && document.activeElement===last) {event.preventDefault();first?.focus();}
    }
  },{signal});
  const resizeDrawer = () => setOpen(narrow.matches ? false : savedOpen == null ? root.dataset.defaultLibraryOpen==='true' : root.dataset.libraryOpen==='true');
  narrow.addEventListener('change',resizeDrawer,{signal});
  const fullscreenChange=()=>{
    const active=document.fullscreenElement===root;
    fullscreenButton?.setAttribute('aria-pressed',String(active));
    fullscreenButton?.setAttribute('aria-label',active?'退出全屏':'全屏聆听');
  };
  document.addEventListener('fullscreenchange',fullscreenChange,{signal});
  if (!document.fullscreenEnabled) { if(fullscreenButton) fullscreenButton.hidden=true; }
  const canvas = root.querySelector('[data-room-motes]');
  const context = canvas?.getContext('2d');
  let frame=0,last=0,width=0,height=0;
  const particles = Array.from({length:narrow.matches?16:32},()=>({x:Math.random(),y:Math.random(),r:.5+Math.random()*1.3,s:.005+Math.random()*.012,phase:Math.random()*6.28}));
  const resizeCanvas=()=>{
    width=root.clientWidth;height=root.clientHeight;
    if (!canvas) return;
    const ratio=Math.min(devicePixelRatio||1,1.5);
    canvas.width=width*ratio;canvas.height=height*ratio;
    context?.setTransform(ratio,0,0,ratio,0,0);
  };
  const draw=time=>{
    frame=requestAnimationFrame(draw);
    if(time-last<40)return;
    const dt=Math.min((time-last)/1000,.08);last=time;
    context.clearRect(0,0,width,height);
    for(const p of particles){
      p.y-=p.s*dt;if(p.y<0)p.y=1;
      const x=(p.x+Math.sin(time/6000+p.phase)*.012)*width;
      context.beginPath();context.arc(x,p.y*height,p.r,0,Math.PI*2);
      context.fillStyle=`rgba(232,203,240,${.12+(Math.sin(time/2000+p.phase)+1)*.15})`;context.fill();
    }
  };
  function syncMotion(){
    const enabled=root.dataset.motion==='true';
    const active=enabled && !reduced.matches && !document.hidden && !navigator.connection?.saveData;
    root.dataset.scenePaused=String(!active);
    motionButton?.setAttribute('aria-pressed',String(enabled));
    const label=enabled?'暂停背景动态':'开启背景动态';
    motionButton?.setAttribute('aria-label',label);if(motionButton)motionButton.title=label;
    cancelAnimationFrame(frame);frame=0;
    if(canvas)canvas.hidden=!active || root.dataset.particles!=='true';
    if(active && context && root.dataset.particles==='true'){last=performance.now();frame=requestAnimationFrame(draw);}
  }
  const observer = new ResizeObserver(resizeCanvas);observer.observe(root);
  reduced.addEventListener('change',syncMotion,{signal});
  document.addEventListener('visibilitychange',syncMotion,{signal});
  resizeCanvas();syncMotion();
  return () => {
    controller.abort();observer.disconnect();cancelAnimationFrame(frame);
    if(document.fullscreenElement===root)document.exitFullscreen?.().catch(()=>{});
  };
}
