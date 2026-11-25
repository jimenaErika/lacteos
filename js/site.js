(function(){
  var d=document;
  var nav=d.querySelector('.nav-transparente');
  if(nav){
    var f=function(){ nav.classList.toggle('nav-solido', window.scrollY>40); };
    f();
    window.addEventListener('scroll',f,{passive:true});
  }
  var els=[].slice.call(d.querySelectorAll('[data-reveal]:not([data-reveal=""])'));
  if(els.length){
    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(en){
        en.forEach(function(x){ if(x.isIntersecting){ x.target.classList.add('visible'); io.unobserve(x.target); } });
      },{threshold:0.12});
      els.forEach(function(el){ io.observe(el); });
    }else{
      els.forEach(function(el){ el.classList.add('visible'); });
    }
  }
  /* Botones que saltan a una sección: un <button> no navega solo. */
  d.addEventListener('click',function(e){
    var b=e.target.closest?e.target.closest('[data-ir-a]'):null;
    if(!b) return;
    var sel=b.getAttribute('data-ir-a');
    if(!sel) return;
    if(sel.charAt(0)!=='#'){ e.preventDefault(); location.href=sel; return; }
    var dest=null;
    try{ dest=d.querySelector(sel); }catch(err){ dest=null; }
    if(!dest) return;
    e.preventDefault();
    dest.scrollIntoView({behavior:'smooth',block:'start'});
    if(history.replaceState) history.replaceState(null,'',sel);
  });
  /* Cierra el menú desplegado en móvil al saltar a una sección */
  d.addEventListener('click',function(e){
    var a=e.target.closest?e.target.closest('a[href^="#"]'):null;
    if(!a||a.getAttribute('href')==='#') return;
    var abierto=d.querySelector('.navbar-collapse.show');
    if(abierto&&abierto.contains(a)&&window.bootstrap&&window.bootstrap.Collapse){
      window.bootstrap.Collapse.getOrCreateInstance(abierto).hide();
    }
  });
  d.addEventListener('click',function(e){
    var b=e.target.closest?e.target.closest('[data-pista]'):null;
    if(!b) return;
    var wrap=b.closest('.pista-wrap'); if(!wrap) return;
    var pista=wrap.querySelector('.pista'); if(!pista) return;
    var primera=pista.firstElementChild;
    var paso=primera?primera.getBoundingClientRect().width+20:300;
    pista.scrollBy({left:(b.getAttribute('data-pista')==='ant'?-paso:paso),behavior:'smooth'});
  });
  d.addEventListener('click',function(e){
    var img=e.target.closest?e.target.closest('.galeria-lightbox img'):null;
    if(!img) return;
    var lb=d.createElement('div');
    lb.className='lb';
    var big=d.createElement('img');
    big.src=img.currentSrc||img.src;
    big.alt=img.alt||'';
    lb.appendChild(big);
    var key=function(ev){ if(ev.key==='Escape') close(); };
    var close=function(){ if(lb.parentNode) lb.parentNode.removeChild(lb); d.removeEventListener('keydown',key); };
    lb.addEventListener('click',close);
    d.addEventListener('keydown',key);
    d.body.appendChild(lb);
  });
  (function bucleFondoYT(w) {
  var d = w.document;
  var esFondoYT = function (f) { return f && f.tagName === 'IFRAME' && f.classList.contains('hero-video') && /youtube(-nocookie)?\.com\/embed\//.test(f.src); };
  var fondos = function () { return [].filter.call(d.querySelectorAll('iframe.hero-video'), esFondoYT); };
  var enviar = function (f, msg) { try { f.contentWindow.postMessage(JSON.stringify(msg), '*'); } catch (e) {} };
  // El reproductor solo responde si se le avisa cuando ya está listo: se repite
  // el aviso (como hace la API oficial de YouTube) hasta que conteste.
  var mostrar = function (f, si) {
    clearTimeout(f._fundido);
    if (si) f._fundido = setTimeout(function () { f.classList.add('yt-ve'); }, 600);
    else f.classList.remove('yt-ve');
  };
  var escuchar = function (f) {
    clearInterval(f._avisos);
    f._listo = false;
    // Se oculta solo si cambió el video: el «load» puede llegar después de que
    // YouTube ya avisó que reproduce, y no lo vuelve a avisar.
    if (f._srcVisto !== f.src) { f._srcVisto = f.src; f._estado = null; mostrar(f, false); }
    // Si el reproductor nunca informa su estado (sin la API), se muestra igual a los 6 s
    clearTimeout(f._respaldo);
    f._respaldo = setTimeout(function () { if (f._estado == null) mostrar(f, true); }, 6000);
    var n = 0;
    f._avisos = setInterval(function () {
      if (f._listo || ++n > 60 || !f.isConnected) { clearInterval(f._avisos); return; }
      enviar(f, { event: 'listening', id: 1, channel: 'widget' });
    }, 250);
  };
  // Videos guardados antes de este cambio: se les activa la API
  fondos().forEach(function (f) {
    if (!/[?&]enablejsapi=1/.test(f.src)) f.src += (f.src.indexOf('?') < 0 ? '?' : '&') + 'enablejsapi=1';
    else escuchar(f);
  });
  // load no burbujea, pero se captura: sirve también para iframes que se agregan después
  d.addEventListener('load', function (e) { if (esFondoYT(e.target)) escuchar(e.target); }, true);
  var alRecibir = function (e) {
    if (!/youtube/.test(e.origin)) return;
    var m; try { m = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch (x) { return; }
    var f = fondos().filter(function (x) { return x.contentWindow === e.source; })[0];
    if (!f || !m) return;
    f._listo = true;
    // Estados de YouTube: 1 reproduciendo; -1, 0, 2 y 5 sin reproducir (botones a la vista)
    var estado = m.event === 'onStateChange' ? m.info : (m.info && typeof m.info.playerState === 'number' ? m.info.playerState : null);
    if (estado !== null) f._estado = estado;
    if (estado === 1) mostrar(f, true);
    else if (estado === -1 || estado === 0 || estado === 2 || estado === 5) mostrar(f, false);
    if (!m.info) return;
    if (m.info.duration) f._duracion = m.info.duration;
    var t = m.info.currentTime;
    if (m.info.playerState === 0 || (f._duracion && typeof t === 'number' && f._duracion - t < 1.2)) {
      enviar(f, { event: 'command', func: 'seekTo', args: [0, true] });
      enviar(f, { event: 'command', func: 'playVideo', args: [] });
    }
  };
  // YouTube contesta a la ventana que envió el aviso: en el sitio es la misma
  // página; en el editor, la ventana del editor y no la del lienzo.
  w.addEventListener('message', alRecibir);
  if (window !== w) window.addEventListener('message', alRecibir);
})(window);
})();
