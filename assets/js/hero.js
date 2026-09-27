
(function(){

  if (typeof Swiper === 'undefined' || typeof gsap === 'undefined') {
    console.error('PITEX Hero: Swiper or GSAP failed to load from CDN. Check your internet connection or CDN access.');
    return;
  }

  const AUTOPLAY_MS = 5200;

  // build pagination dots
  const dotsWrap = document.getElementById('heroDots');
  const slideCount = 3;
  for(let i=0;i<slideCount;i++){
    const b = document.createElement('button');
    b.className = 'hero-dot' + (i===0 ? ' is-active' : '');
    b.innerHTML = '<span></span>';
    b.dataset.index = i;
    dotsWrap.appendChild(b);
  }
  const dotEls = Array.from(dotsWrap.querySelectorAll('.hero-dot'));

  function setActiveDot(idx){
    dotEls.forEach((d,i)=>{
      d.classList.remove('is-active');
      const span = d.querySelector('span');
      span.style.transition = 'none';
      span.style.inset = '0 100% 0 0';
    });
    // force reflow then animate active
    void dotsWrap.offsetWidth;
    const active = dotEls[idx];
    active.classList.add('is-active');
    const span = active.querySelector('span');
    requestAnimationFrame(()=>{
      span.style.transition = 'inset ' + (AUTOPLAY_MS/1000) + 's linear';
      span.style.inset = '0 0 0 0';
    });
  }

  // particles
  document.querySelectorAll('.hero-particles').forEach(container=>{
    const n = 14;
    for(let i=0;i<n;i++){
      const p = document.createElement('div');
      p.className = 'particle';
      const x = Math.random()*100, y = Math.random()*100;
      p.style.left = x+'%';
      p.style.top = y+'%';
      p.style.opacity = (0.15 + Math.random()*0.3).toFixed(2);
      container.appendChild(p);
      gsap.to(p, {
        y: (Math.random()*60+30) * -1,
        x: (Math.random()*40-20),
        duration: 8 + Math.random()*8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: Math.random()*4
      });
    }
  });

  const swiper = new Swiper('.hero-swiper', {
    effect: 'fade',
    fadeEffect: { crossFade: true },
    speed: 900,
    loop: true,
    autoplay: { delay: AUTOPLAY_MS, disableOnInteraction: false, pauseOnMouseEnter: true },
    allowTouchMove: true,
    on: {
      init: function(){ animateSlide(this.slides[this.activeIndex]); },
      slideChangeTransitionStart: function(){
        animateSlide(this.slides[this.activeIndex]);
        const realIndex = this.realIndex;
        setActiveDot(realIndex);
      }
    }
  });

  // Swiper reads text direction once, at construction time, from the
  // computed CSS `direction` of the container. On this site the <html
  // dir> attribute is still "ltr" at that exact moment — LanguageManager
  // only applies the saved/browser language (and flips dir to "rtl")
  // later, on DOMContentLoaded — so a page that loads straight into
  // Arabic (or switches to it afterwards) leaves Swiper's internal RTL
  // state out of sync with the real layout. That mismatch is what made
  // every slide except the active one mis-position/mis-fade and made
  // Prev/Next feel backwards. Swiper has a dedicated API for exactly
  // this — changeLanguageDirection() — which updates the existing
  // instance in place (no destroy/recreate, no duplicate instance), so
  // just keep it in sync on every language switch, including the
  // initial one.
  function syncSwiperDirection(){
    if (!window.I18N || typeof window.I18N.isRTL !== 'function') return;
    const dir = window.I18N.isRTL(window.I18N.getLanguage()) ? 'rtl' : 'ltr';
    if (typeof swiper.changeLanguageDirection === 'function') {
      swiper.changeLanguageDirection(dir);
    }
  }
  syncSwiperDirection();
  if (window.I18N && typeof window.I18N.onChange === 'function') {
    window.I18N.onChange(syncSwiperDirection);
  }

  document.getElementById('heroPrev').addEventListener('click', ()=>swiper.slidePrev());
  document.getElementById('heroNext').addEventListener('click', ()=>swiper.slideNext());
  dotEls.forEach(d=>{
    d.addEventListener('click', ()=>{
      swiper.slideToLoop(parseInt(d.dataset.index,10));
    });
  });

  function animateSlide(slideEl){
    if(!slideEl) return;
    const bg = slideEl.querySelector('.hero-bg');
    const overlay = slideEl.querySelector('.hero-overlay');
    const eyebrow = slideEl.querySelector('.js-eyebrow');
    const title = slideEl.querySelector('.js-title');
    const desc = slideEl.querySelector('.js-desc');
    const actions = slideEl.querySelector('.js-actions');

    gsap.killTweensOf([bg, overlay, eyebrow, title, desc, actions]);

    // Ken Burns
    gsap.fromTo(bg, {scale:1}, {scale:1.08, duration: AUTOPLAY_MS/1000 + 2.5, ease:'none'});

    gsap.fromTo(overlay, {opacity:0}, {opacity:1, duration:1.1, ease:'power2.out'});

    const tl = gsap.timeline({delay:.15});
    tl.fromTo(eyebrow, {opacity:0, y:16}, {opacity:1, y:0, duration:.6, ease:'power3.out'})
      .fromTo(title, {opacity:0, y:34, filter:'blur(10px)'}, {opacity:1, y:0, filter:'blur(0px)', duration:.85, ease:'power3.out'}, '-=.35')
      .fromTo(desc, {opacity:0, y:24}, {opacity:1, y:0, duration:.7, ease:'power3.out'}, '-=.45')
      .fromTo(actions.children, {opacity:0, y:16, scale:.94}, {opacity:1, y:0, scale:1, duration:.6, stagger:.12, ease:'back.out(1.6)'}, '-=.35');
  }

  // mouse parallax on light + subtle bg shift
  const heroSection = document.querySelector('.pitex-hero');
  heroSection.addEventListener('mousemove', (e)=>{
    const rect = heroSection.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    document.querySelectorAll('.hero-light').forEach(l=>{
      l.style.setProperty('--lx', px + '%');
      l.style.setProperty('--ly', py + '%');
    });
    const activeBg = document.querySelector('.swiper-slide-active .hero-bg');
    if(activeBg){
      const dx = (px - 50) / 50 * 10;
      const dy = (py - 50) / 50 * 10;
      gsap.to(activeBg, {x:dx, y:dy, duration:1, ease:'power2.out', overwrite:'auto'});
    }
  });

  setActiveDot(0);

  // scroll-to-discover: jumps to whatever section follows the hero
  const scrollBtn = document.getElementById('heroScrollBtn');
  if(scrollBtn){
    scrollBtn.addEventListener('click', ()=>{
      const heroEl = document.querySelector('.pitex-hero');
      const next = heroEl.nextElementSibling;
      if(next){
        next.scrollIntoView({behavior:'smooth', block:'start'});
      } else {
        window.scrollTo({top: window.innerHeight, behavior:'smooth'});
      }
    });
  }
})();
