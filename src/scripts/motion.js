// Motion: GSAP entrance timeline, scroll choreography, marquee, magnetic buttons.
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
var ghost = $('#ghost'), sw = $('#recSw');

  /* ===== GSAP motion ===== */
  if(window.gsap&&!reduce){
    var hasST=!!window.ScrollTrigger;
    if(hasST)gsap.registerPlugin(ScrollTrigger);
    gsap.defaults({ease:'power3.out'});

    /* hero entrance */
    var tl=gsap.timeline({defaults:{duration:.8,clearProps:'transform,opacity'}});
    tl.from('.pill',{y:-30,opacity:0,duration:.6})
      .from('.hero .tag',{y:20,opacity:0},'-=.3')
      .from('.hero h1',{y:40,opacity:0,duration:1},'-=.55')
      .from('.hero .pitch',{y:24,opacity:0},'-=.65')
      .from('.hero .cta .btn',{y:16,opacity:0,stagger:.08,duration:.6},'-=.5')
      .from('.hero .fact',{y:12,opacity:0,stagger:.07,duration:.5},'-=.4')
      .from('#mapCard',{y:40,opacity:0,duration:.9},.35)
      .from('.hero .node',{scale:.85,opacity:0,stagger:.035,duration:.5},'-=.5')
      .from('.hero .note',{rotation:-8,scale:.6,opacity:0,duration:.6,ease:'back.out(2)'},'-=.2');

    /* ghost name: pointer follow plus scroll drift */
    ghost.style.transition='none';
    var gx=gsap.quickTo(ghost,'x',{duration:.8}),gy=gsap.quickTo(ghost,'y',{duration:.8});
    $('.hero').addEventListener('pointermove',function(e){gx((e.clientX/innerWidth-.5)*-40);gy((e.clientY/innerHeight-.5)*-18)});
    if(hasST)gsap.to(ghost,{yPercent:-18,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});

    /* magnetic call-to-action buttons */
    $$('.cta .btn').forEach(function(b){
      var qx=gsap.quickTo(b,'x',{duration:.4}),qy=gsap.quickTo(b,'y',{duration:.4});
      b.addEventListener('pointermove',function(e){var r=b.getBoundingClientRect();qx((e.clientX-r.left-r.width/2)*.25);qy((e.clientY-r.top-r.height/2)*.35)});
      b.addEventListener('pointerleave',function(){qx(0);qy(0)});
    });

    /* project art tilts toward the pointer */
    $$('.proj .art').forEach(function(a){
      a.addEventListener('pointermove',function(e){var r=a.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
        gsap.to(a,{rotationY:x*10,rotationX:-y*10,transformPerspective:800,duration:.4,overwrite:'auto'})});
      a.addEventListener('pointerleave',function(){gsap.to(a,{rotationX:0,rotationY:0,duration:.6,overwrite:'auto'})});
    });

    /* scroll choreography */
    var ghost=$('#ghost'),sw=$('#recSw');
    if(hasST){
      /* headings split into masked words that rise into place */
      function splitWords(el){
        var words=el.textContent.trim().split(/\s+/);el.setAttribute('aria-label',words.join(' '));el.innerHTML='';
        words.forEach(function(w,i){var o=document.createElement('span');o.className='w';o.setAttribute('aria-hidden','true');
          var n=document.createElement('span');n.className='wi';n.textContent=w;o.appendChild(n);el.appendChild(o);
          if(i<words.length-1)el.appendChild(document.createTextNode(' '))});
        return $$('.wi',el);
      }
      $$('.sec-head h2,.contact h2').forEach(function(h){
        gsap.from(splitWords(h),{yPercent:120,rotate:5,duration:1,stagger:.07,ease:'power4.out',scrollTrigger:{trigger:h,start:'top 88%'}});
      });
      $$('.sec-head .label,.sec-head p').forEach(function(el){
        gsap.from(el,{y:26,opacity:0,duration:.7,scrollTrigger:{trigger:el,start:'top 92%'}});
      });

      /* hero drifts apart as you leave it */
      gsap.to('.hero-grid>div:first-child',{y:-60,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
      gsap.to('#mapCard',{y:50,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});

      /* demo wakes up when it scrolls into view */
      gsap.from('.picker button',{x:-50,opacity:0,stagger:.09,duration:.6,clearProps:'transform,opacity',scrollTrigger:{trigger:'.picker',start:'top 88%'}});
      gsap.from('#demo .panel',{y:70,opacity:0,duration:.9,clearProps:'transform,opacity',scrollTrigger:{trigger:'#demo .panel',start:'top 90%'}});
      ScrollTrigger.create({trigger:'#demo .demo',start:'top 65%',once:true,onEnter:function(){document.dispatchEvent(new CustomEvent('run-demo',{detail:'ok'}))}});

      /* project cards scale and rise with the scroll position */
      $$('.proj').forEach(function(c){
        gsap.fromTo(c,{y:100,scale:.93,opacity:.2,transformOrigin:'50% 0%'},{y:0,scale:1,opacity:1,ease:'none',scrollTrigger:{trigger:c,start:'top 98%',end:'top 60%',scrub:.6}});
        gsap.from($$('.met',c),{y:26,opacity:0,stagger:.12,duration:.7,clearProps:'transform,opacity',scrollTrigger:{trigger:c,start:'top 80%'}});
      });
      gsap.from('.also',{y:60,opacity:0,duration:.9,clearProps:'transform,opacity',scrollTrigger:{trigger:'.also',start:'top 92%'}});

      /* stat tiles tip up in 3D */
      gsap.from('.num',{rotationX:-75,y:50,opacity:0,transformPerspective:900,transformOrigin:'50% 100%',stagger:.12,duration:1,ease:'back.out(1.5)',clearProps:'transform,opacity',scrollTrigger:{trigger:'.nums',start:'top 88%'}});

      /* marquee speeds up and reverses with scroll velocity */
      var track=$('#marquee .mtrack');
      if(track){
        var loop=gsap.to(track,{xPercent:-50,ease:'none',duration:28,repeat:-1}),target=1,cur=1;
        ScrollTrigger.create({onUpdate:function(self){target=self.direction*(1+Math.min(8,Math.abs(self.getVelocity())/280))}});
        gsap.ticker.add(function(){target+=((target<0?-1:1)-target)*.04;cur+=(target-cur)*.12;loop.timeScale(cur)});
      }

      /* stack chips pop in group by group */
      gsap.from('#stackList h3',{x:-24,opacity:0,stagger:.07,duration:.6,clearProps:'transform,opacity',scrollTrigger:{trigger:'#stackList',start:'top 88%'}});
      $$('#stackList ul').forEach(function(ul){
        gsap.from($$('button',ul),{scale:0,opacity:0,stagger:.025,duration:.5,ease:'back.out(2.4)',clearProps:'transform,opacity',scrollTrigger:{trigger:ul,start:'top 94%'}});
      });
      gsap.from('#inspect',{x:70,opacity:0,duration:.9,clearProps:'transform,opacity',scrollTrigger:{trigger:'#inspect',start:'top 90%'}});

      /* timeline: rail fills as you scroll, entries slide in and light their dot */
      var rw=$('#recwrap');
      if(rw){
        gsap.to('#railfill',{scaleY:1,ease:'none',scrollTrigger:{trigger:rw,start:'top 70%',end:'bottom 65%',scrub:.5}});
        $$('.rec').forEach(function(r){
          gsap.from(r,{x:-70,opacity:0,duration:.9,clearProps:'transform,opacity',scrollTrigger:{trigger:r,start:'top 90%',onEnter:function(){r.classList.add('on')}}});
        });
      }

      /* practice cards swing in like opening a book */
      gsap.from('.flip',{rotationY:-80,y:40,opacity:0,transformOrigin:'0% 50%',stagger:.1,duration:1,clearProps:'transform,opacity',scrollTrigger:{trigger:'#prac',start:'top 88%'}});

      /* contact */
      gsap.from('.mail,.links2',{y:36,opacity:0,stagger:.12,duration:.8,clearProps:'transform,opacity',scrollTrigger:{trigger:'.mail',start:'top 94%'}});

      var rf=function(){ScrollTrigger.refresh()};
      $$('.acc-btn').forEach(function(b){b.addEventListener('click',function(){setTimeout(rf,450)})});
      sw.addEventListener('click',function(){setTimeout(rf,150)});
      if(document.fonts&&document.fonts.ready)document.fonts.ready.then(rf);
      addEventListener('load',rf);
    }
  }
