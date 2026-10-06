// Behaviour: theme, nav, service map, pipeline demo, stack inspector, flip cards, command palette, easter eggs.
(function(){
  var $=function(s,r){return (r||document).querySelector(s)};
  var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  var root=document.documentElement;
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* toast + easter eggs */
  var toastEl=$('#toast'),tt;
  function toast(m){toastEl.textContent=m;toastEl.classList.add('show');clearTimeout(tt);tt=setTimeout(function(){toastEl.classList.remove('show')},2600)}
  var eggs={};
  function egg(k,m){if(!eggs[k]){eggs[k]=1;$('#eggs').textContent='Easter eggs found: '+Object.keys(eggs).length+' of 4'}toast(m)}

  /* theme */
  function cur(){var t=root.getAttribute('data-theme');if(t)return t;return window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}
  function flipTheme(){root.setAttribute('data-theme',cur()==='dark'?'light':'dark')}
  $('#themeBtn').addEventListener('click',flipTheme);

  /* clock + mood */
  function tick(){
    var d=new Date();
    $('#clock').textContent=d.toLocaleTimeString('en-AU',{hour:'numeric',minute:'2-digit',timeZone:'Australia/Melbourne'}).toLowerCase();
    var h=parseInt(new Intl.DateTimeFormat('en-AU',{hour:'numeric',hour12:false,timeZone:'Australia/Melbourne'}).format(d),10)%24;
    $('#mood').textContent=(h>=22||h<5)?'one more apply, then sleep':h<12?'coffee, then pipelines':h<18?'reading plan output':'terraform plan, no changes';
  }
  tick();setInterval(tick,20000);

  /* nav: progress, active link, brand */
  var bar=$('#bar');
  function prog(){var m=document.documentElement.scrollHeight-innerHeight;bar.style.transform='scaleX('+(m>0?Math.min(1,scrollY/m):0)+')'}
  addEventListener('scroll',prog,{passive:true});prog();
  var clicks=0;
  $('#brand').addEventListener('click',function(){
    scrollTo({top:0,behavior:reduce?'auto':'smooth'});
    clicks++;if(clicks>=5){clicks=0;egg('staging','You found the staging environment. It is empty.')}
  });
  if('IntersectionObserver' in window){
    var linkMap={};$$('#links a').forEach(function(a){linkMap[a.getAttribute('href').slice(1)]=a});
    var so=new IntersectionObserver(function(es){es.forEach(function(e){
      if(e.isIntersecting){$$('#links a').forEach(function(a){a.removeAttribute('aria-current')});var a=linkMap[e.target.id];if(a)a.setAttribute('aria-current','true')}
    })},{rootMargin:'-40% 0px -55% 0px'});
    Object.keys(linkMap).forEach(function(id){var s=document.getElementById(id);if(s)so.observe(s)});
  }

  /* pointer-lit dot grid in the hero */
  var heroEl=$('.hero');
  heroEl.addEventListener('pointermove',function(e){var r=heroEl.getBoundingClientRect();heroEl.style.setProperty('--mx',(e.clientX-r.left)+'px');heroEl.style.setProperty('--my',(e.clientY-r.top)+'px')});

  /* ghost parallax */
  var ghost=$('#ghost');
  if(!reduce&&!window.gsap)$('.hero').addEventListener('pointermove',function(e){
    ghost.style.transform='translate3d('+((e.clientX/innerWidth-.5)*-30)+'px,'+((e.clientY/innerHeight-.5)*-14)+'px,0)';
  });

  /* accordions */
  var recruiter=false;
  function setAcc(btn,open){
    var p=document.getElementById(btn.getAttribute('aria-controls'));
    btn.setAttribute('aria-expanded',open?'true':'false');p.classList.toggle('open',open);
    if(open||recruiter)p.removeAttribute('inert');else p.setAttribute('inert','');
  }
  function syncAcc(){$$('.acc-btn').forEach(function(b){setAcc(b,b.getAttribute('aria-expanded')==='true')})}
  $$('.acc-btn').forEach(function(b){
    setAcc(b,b.getAttribute('aria-expanded')==='true');
    b.addEventListener('click',function(){
      var o=b.getAttribute('aria-expanded')!=='true';setAcc(b,o);
      var pj=b.closest('[data-p]');if(pj&&o)setLens(pj.getAttribute('data-p'));
    });
  });

  /* recruiter mode */
  var sw=$('#recSw');
  function setRec(on){recruiter=on;document.body.classList.toggle('rec',on);sw.setAttribute('aria-checked',on?'true':'false');syncAcc();setTimeout(drawEdges,50)}
  sw.addEventListener('click',function(){setRec(!recruiter);toast(recruiter?'Recruiter mode on: the short version.':'Recruiter mode off: full portfolio.')});

  /* copy email */
  var cb=$('#copyBtn'),mt=$('#mailText');
  function copyMail(){
    var ok=function(){cb.textContent='Copied';toast('Email copied.');setTimeout(function(){cb.textContent='Copy email'},1600)};
    var no=function(){var r=document.createRange();r.selectNodeContents(mt);var s=getSelection();s.removeAllRanges();s.addRange(r);toast('Press Ctrl+C to copy.')};
    try{navigator.clipboard.writeText(mt.textContent).then(ok,no)}catch(e){no()}
  }
  cb.addEventListener('click',copyMail);

  /* ===== service map ===== */
  var NAMES={neuro:'NeuroGuide',bird:'BirdTag',pose:'Pose Estimation',fee:'FeePrint'};
  var TOOLS=[{id:'gha',n:'GitHub Actions',k:'CI/CD'},{id:'tf',n:'Terraform',k:'infra as code'},{id:'loc',n:'Locust',k:'load testing'}];
  var NODES=[
    {id:'cog',n:'Cognito',k:'auth',c:0,r:0},{id:'api',n:'API Gateway',k:'entry',c:0,r:1},{id:'eb',n:'EventBridge',k:'schedule',c:0,r:2},
    {id:'ecr',n:'ECR',k:'images',c:1,r:0},{id:'lam',n:'Lambda',k:'compute',c:1,r:1},{id:'k8s',n:'Kubernetes on EC2',k:'compute',c:1,r:2},
    {id:'ddb',n:'DynamoDB',k:'nosql',c:2,r:0},{id:'s3',n:'S3',k:'objects',c:2,r:1},{id:'pg',n:'PostgreSQL',k:'sql',c:2,r:2}
  ];
  var EDGES=[['cog','api',['bird']],['api','lam',['bird']],['eb','lam',['neuro']],['ecr','lam',['neuro','bird']],['lam','ddb',['bird']],['lam','s3',['bird']],['lam','pg',['neuro']]];
  var USE={
    gha:{neuro:'Runs Vitest and Playwright on every pull request.',fee:'Deploys the AWS infrastructure through CI/CD.'},
    tf:{neuro:'Defines the least-privilege IAM roles.',fee:'Defines the AWS infrastructure.'},
    loc:{pose:'Simulates concurrent users against the API.'},
    cog:{bird:'Handles user authentication.'},
    api:{bird:'Fronts the Lambda functions that run metadata operations.'},
    eb:{neuro:'Schedules the automated data refresh.'},
    ecr:{neuro:'Holds the FastAPI Docker image that Lambda runs.',bird:'Holds the AI species-identification model images.'},
    lam:{neuro:'Runs the FastAPI back end from a container image.',bird:'Runs metadata operations and serverless inference.'},
    k8s:{pose:'Autoscaled pods on EC2 serve the YOLOv8 API.'},
    ddb:{bird:'Schema built for low-latency retrieval across large datasets.'},
    s3:{bird:'Stores the media recordings.'},
    pg:{neuro:'Data models for cloud session sync.'}
  };
  var SUM={
    all:'Four projects, one toolchain. Pick a project above or tap a service.',
    neuro:'<span class="rp">NeuroGuide</span>A container image built in CI, run on Lambda, with IAM defined in Terraform.',
    bird:'<span class="rp">BirdTag</span>Cognito and API Gateway in front of Lambda, with DynamoDB and S3 behind it.',
    pose:'<span class="rp">Pose</span>Autoscaled Kubernetes pods on EC2, load tested with Locust.',
    fee:'<span class="rp">FeePrint</span>Infrastructure in Terraform, shipped through CI/CD. Services are still being chosen.'
  };
  var lens='all',sel=null,nodeEl={},pathEls=[];
  var toolEl=$('#tool'),gridEl=$('#grid'),svg=$('#edges'),readout=$('#readout');
  function mk(n,place){
    var b=document.createElement('button');b.type='button';b.className='node';b.setAttribute('data-id',n.id);
    b.innerHTML='<b>'+n.n+'</b><span>'+n.k+'</span>';
    if(place){b.style.gridColumn=n.c+1;b.style.gridRow=n.r+2}
    b.addEventListener('click',function(){sel=(sel===n.id)?null:n.id;applyMap()});
    nodeEl[n.id]=b;return b;
  }
  TOOLS.forEach(function(n){toolEl.appendChild(mk(n,false))});
  ['Entry','Run','Store'].forEach(function(t,i){var d=document.createElement('div');d.className='col';d.textContent=t;d.style.gridColumn=i+1;d.style.gridRow=1;gridEl.appendChild(d)});
  NODES.forEach(function(n){gridEl.appendChild(mk(n,true))});
  function inLens(id){if(lens==='all')return true;return !!(USE[id]&&USE[id][lens])}
  function applyMap(){
    Object.keys(nodeEl).forEach(function(id){
      var e=nodeEl[id];e.classList.toggle('dim',!inLens(id));e.classList.toggle('lit',lens!=='all'&&inLens(id));e.classList.toggle('sel',sel===id);
    });
    pathEls.forEach(function(o){
      var hot=lens!=='all'&&o.e[2].indexOf(lens)>-1;
      o.p.setAttribute('class','edge'+(hot?' hot':(lens!=='all'?' faint':'')));
    });
    $$('#lens button').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-l')===lens?'true':'false')});
    var html;
    if(sel){
      var n=null;TOOLS.concat(NODES).forEach(function(x){if(x.id===sel)n=x});
      var rows=[];Object.keys(USE[sel]||{}).forEach(function(p){if(lens==='all'||p===lens)rows.push('<p><span class="rp">'+NAMES[p]+'</span>'+USE[sel][p]+'</p>')});
      html='<p><b>'+n.n+'</b></p>'+(rows.length?rows.join(''):'<p>Not used in '+NAMES[lens]+'.</p>');
    }else html='<p>'+SUM[lens]+'</p>';
    readout.innerHTML=html;
  }
  function drawEdges(){
    svg.setAttribute('width',gridEl.offsetWidth);svg.setAttribute('height',gridEl.offsetHeight);
    while(svg.firstChild)svg.removeChild(svg.firstChild);pathEls=[];
    EDGES.forEach(function(e){
      var a=nodeEl[e[0]],b=nodeEl[e[1]];if(!a||!b||!a.offsetWidth)return;
      var x1,y1,x2,y2,d;
      if(a.offsetLeft===b.offsetLeft){
        x1=a.offsetLeft+a.offsetWidth/2;y1=a.offsetTop+a.offsetHeight;x2=b.offsetLeft+b.offsetWidth/2;y2=b.offsetTop;
        var dy=(y2-y1)/2;d='M'+x1+' '+y1+' C'+x1+' '+(y1+dy)+' '+x2+' '+(y2-dy)+' '+x2+' '+y2;
      }else{
        x1=a.offsetLeft+a.offsetWidth;y1=a.offsetTop+a.offsetHeight/2;x2=b.offsetLeft;y2=b.offsetTop+b.offsetHeight/2;
        var dx=(x2-x1)/2;d='M'+x1+' '+y1+' C'+(x1+dx)+' '+y1+' '+(x2-dx)+' '+y2+' '+x2+' '+y2;
      }
      var p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',d);svg.appendChild(p);pathEls.push({p:p,e:e});
    });
    applyMap();
  }
  function setLens(l){if(!NAMES[l]&&l!=='all')return;lens=l;if(sel&&!inLens(sel))sel=null;applyMap()}
  $$('#lens button').forEach(function(b){b.addEventListener('click',function(){setLens(b.getAttribute('data-l'))})});
  drawEdges();
  addEventListener('resize',drawEdges);
  if('ResizeObserver' in window)new ResizeObserver(drawEdges).observe(gridEl);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(drawEdges);

  /* ===== pipeline demo ===== */
  var stages=[
    {id:'unit',nm:'Unit tests',tool:'Vitest'},
    {id:'e2e',nm:'Integration and end-to-end tests',tool:'Playwright'},
    {id:'plan',nm:'Terraform plan and IAM review',tool:'Terraform'},
    {id:'build',nm:'Build container image',tool:'Docker, Amazon ECR'},
    {id:'deploy',nm:'Deploy',tool:'AWS Lambda'}
  ];
  var S={
    ok:{title:'pull request: add job-fit score endpoint',fail:null,
      logs:{unit:['<span class="good">PASS</span>  18 tests passed'],e2e:['<span class="good">PASS</span>  6 flows passed in the browser'],
        plan:['<span class="good">OK</span>    plan: 2 to add, 0 to change, roles scoped to named actions'],build:['<span class="good">OK</span>    image pushed to ECR'],deploy:['<span class="good">OK</span>    new image live on Lambda']},
      v:['ok','Merged','Deployed to AWS Lambda.']},
    unit:{title:'pull request: change job-fit scoring',fail:'unit',
      logs:{unit:['<span class="bad">FAIL</span>  scoring &gt; rejects an empty job description','       expected an error, received a score of 0']},
      v:['bad','Blocked','A unit test failed. Nothing reaches AWS.']},
    e2e:{title:'pull request: refactor interview practice page',fail:'e2e',
      logs:{unit:['<span class="good">PASS</span>  18 tests passed'],e2e:['<span class="bad">FAIL</span>  practice flow &gt; answer saves after stage 2','       the save button never enabled']},
      v:['bad','Blocked','The user flow regressed. Caught before merge, not after release.']},
    iam:{title:'pull request: let the API read uploads',fail:'plan',
      logs:{unit:['<span class="good">PASS</span>  18 tests passed'],e2e:['<span class="good">PASS</span>  6 flows passed in the browser'],
        plan:['<span class="bad">FAIL</span>  role grants every action on every resource','<span class="bad">-</span>  Action   = "*"','<span class="good">+</span>  Action   = ["s3:GetObject"]','<span class="dim">   scope the role to what the service needs, then push again</span>']},
      v:['bad','Blocked','The role is too broad. Least privilege is enforced before deploy.']}
  };
  var list=$('#stages'),logEl=$('#log'),vEl=$('#verdict'),title=$('#prTitle'),pbtns=$$('.picker button');
  var token=0,label={pending:'Waiting',run:'Running',pass:'Passed',fail:'Failed',skip:'Skipped'};
  stages.forEach(function(s){var li=document.createElement('li');li.className='stage';li.id='st-'+s.id;li.setAttribute('data-s','pending');
    li.innerHTML='<span class="dot"></span><span class="nm">'+s.nm+'<span class="tool">'+s.tool+'</span></span><span class="st">Waiting</span>';list.appendChild(li)});
  function setS(id,s){var el=document.getElementById('st-'+id);el.setAttribute('data-s',s);el.querySelector('.st').textContent=label[s];
    if(window.gsap&&!reduce&&(s==='pass'||s==='fail'))gsap.fromTo(el.querySelector('.dot'),{scale:1.7},{scale:1,duration:.4,ease:'back.out(3)'})}
  function wait(ms){return new Promise(function(r){setTimeout(r,reduce?0:ms)})}
  async function run(key,animate){
    var my=++token,sc=S[key];
    title.textContent=sc.title;logEl.innerHTML='';vEl.innerHTML='';
    pbtns.forEach(function(x){x.setAttribute('aria-pressed',x.getAttribute('data-k')===key?'true':'false')});
    stages.forEach(function(s){setS(s.id,'pending')});
    var failed=false;
    for(var i=0;i<stages.length;i++){
      var id=stages[i].id;
      if(failed){setS(id,'skip');continue}
      if(animate){setS(id,'run');await wait(650);if(my!==token)return}
      var isFail=sc.fail===id;setS(id,isFail?'fail':'pass');
      (sc.logs[id]||[]).forEach(function(l){logEl.innerHTML+=l+'\n'});
      if(isFail)failed=true;
    }
    vEl.setAttribute('data-v',sc.v[0]);vEl.innerHTML='<span class="tg">'+sc.v[1]+'</span><span>'+sc.v[2]+'</span>';
    if(window.gsap&&!reduce)gsap.from(vEl,{y:12,opacity:0,duration:.35,clearProps:'transform,opacity'});
  }
  run('ok',false);
  document.addEventListener('run-demo',function(e){run(e.detail,true)});
  pbtns.forEach(function(b){b.addEventListener('click',function(){run(b.getAttribute('data-k'),true)})});

  /* ===== autoscale toy ===== */
  var users=$('#users'),podsEl=$('#pods');
  for(var i=0;i<8;i++)podsEl.appendChild(document.createElement('i'));
  function pods(){
    var u=+users.value,n=Math.min(8,Math.max(1,Math.ceil(u/50)));
    $('#usersOut').textContent=u;
    $$('#pods i').forEach(function(el,i){el.classList.toggle('on',i<n)});
    $('#podText').textContent=n+(n===1?' pod':' pods')+', each 0.5 CPU and 512 MiB. Illustrative: one pod serves about 50 users, capped at 8.';
  }
  users.addEventListener('input',pods);pods();

  /* ===== counters ===== */
  var nums=$$('[data-to]');
  function animateNum(el){
    var to=+el.getAttribute('data-to'),suf=el.getAttribute('data-suf')||'',t0=null;
    function f(v){return Math.round(v).toLocaleString('en-AU')+suf}
    if(window.gsap&&!reduce){var o={v:0};gsap.to(o,{v:to,duration:1.4,ease:'power3.out',onUpdate:function(){el.textContent=f(o.v)},onComplete:function(){el.textContent=f(to)}});return}
    if(reduce){el.textContent=f(to);return}
    function step(t){if(!t0)t0=t;var k=Math.min(1,(t-t0)/1100),e=1-Math.pow(1-k,3);el.textContent=f(to*e);if(k<1)requestAnimationFrame(step);else el.textContent=f(to)}
    requestAnimationFrame(step);
  }
  if('IntersectionObserver' in window){
    var no=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){animateNum(e.target);no.unobserve(e.target)}})},{threshold:.6});
    nums.forEach(function(n){no.observe(n)});
  }

  /* ===== stack explorer ===== */
  var STACK=[
    ['Cloud (AWS)',['EC2','Lambda','ECS','ECR','S3','API Gateway','DynamoDB','RDS','IAM','Cognito','CloudWatch','EventBridge','SNS','SQS']],
    ['DevOps and IaC',['Terraform','CI/CD','GitHub Actions','GitLab','Git','Docker','Kubernetes']],
    ['Security',['Least-privilege IAM','RBAC','CORS','HTTPS and HSTS','XSS prevention','Secure coding','PCI DSS awareness']],
    ['Languages',['Python','TypeScript','JavaScript','SQL','C#','Java']],
    ['Back end and data',['FastAPI','.NET Core','Spring Boot','REST APIs','Microservices','PostgreSQL','MySQL','SQL Server','DynamoDB','Python ETL']],
    ['Testing',['Unit tests','Integration tests','End-to-end tests','Playwright','Vitest','Locust']],
    ['AI-assisted development',['Claude','Claude Code','GitHub Copilot','Cursor','Multi-agent orchestration']]
  ];
  var USED={
    'Lambda':['NeuroGuide','BirdTag'],'ECR':['NeuroGuide','BirdTag'],'S3':['BirdTag'],'API Gateway':['BirdTag'],'DynamoDB':['BirdTag'],'Cognito':['BirdTag'],
    'EC2':['Pose Estimation'],'IAM':['NeuroGuide'],'Least-privilege IAM':['NeuroGuide'],'EventBridge':['NeuroGuide'],
    'Terraform':['NeuroGuide','FeePrint'],'CI/CD':['NeuroGuide','FeePrint'],'GitHub Actions':['NeuroGuide'],'Docker':['NeuroGuide','Pose Estimation'],'Kubernetes':['Pose Estimation'],
    'GitLab':['Monash teaching'],'CORS':['NeuroGuide'],
    'Python':['FeePrint','NeuroGuide','Pose Estimation'],'TypeScript':['Front ends in team projects'],'JavaScript':['FeePrint','Technip Energies'],'SQL':['Technip Energies'],'C#':['Technip Energies'],
    'FastAPI':['NeuroGuide','Pose Estimation'],'.NET Core':['Technip Energies'],'PostgreSQL':['NeuroGuide'],'SQL Server':['Technip Energies'],'Python ETL':['Shankville Technologies'],
    'Playwright':['NeuroGuide'],'Vitest':['NeuroGuide'],'Locust':['Pose Estimation'],'End-to-end tests':['NeuroGuide'],'Unit tests':['NeuroGuide','Technip Energies'],'Integration tests':['NeuroGuide','Technip Energies'],
    'Claude Code':['Daily development'],'Claude':['Daily development']
  };
  var stackList=$('#stackList'),inspect=$('#inspect'),picked=null;
  STACK.forEach(function(g){
    var d=document.createElement('div');d.innerHTML='<h3>'+g[0]+'</h3>';
    var ul=document.createElement('ul');
    g[1].forEach(function(t){
      var li=document.createElement('li'),b=document.createElement('button');b.type='button';b.textContent=t;b.setAttribute('aria-pressed','false');b.setAttribute('data-t',t);
      b.addEventListener('click',function(){picked=(picked===t)?null:t;showStack()});
      li.appendChild(b);ul.appendChild(li);
    });
    d.appendChild(ul);stackList.appendChild(d);
  });
  function showStack(){
    $$('#stackList button').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-t')===picked?'true':'false')});
    if(!picked){inspect.innerHTML='<p class="label">Inspector</p><h3>Pick a tool</h3><p>See which projects and roles it shows up in.</p>';return}
    var u=USED[picked];
    inspect.innerHTML='<p class="label">Used in</p><h3>'+picked+'</h3>'+(u?'<div class="tags">'+u.map(function(x){return '<span class="chip">'+x+'</span>'}).join('')+'</div>':'<p>Part of my toolkit from coursework and practice, not tied to one project above.</p>');
  }
  showStack();

  /* ===== flip cards ===== */
  var PRAC=[
    ['Test before merge','Regressions get caught in the pull request, not in production.','NeuroGuide: GitHub Actions runs Vitest unit tests and Playwright integration and end-to-end tests on every pull request.'],
    ['Grant the least access','Each service gets only the permissions it needs.','NeuroGuide: IAM roles defined in Terraform with least privilege, plus strict CORS enforcement.'],
    ['Plan for failure','Retries, timeouts and fallbacks go in from the start.','FeePrint: a Python pipeline with retries, timeouts and graceful failure handling. NeuroGuide: offline fallback for session sync.'],
    ['Measure, then tune','Load test with realistic traffic and keep changes that move the numbers.','Pose Estimation: Locust load tests guided changes that cut memory 35% and doubled throughput.'],
    ['Define it as code','Environments should be reviewable and rebuildable.','FeePrint and NeuroGuide: infrastructure in Terraform, deployed through CI/CD.'],
    ['Explain it to the client','Requirements in, plain-language progress out.','Technip Energies: turned requirements into technical solutions across time zones. Monash: Agile ceremonies with technical and non-technical stakeholders.']
  ];
  var pr=$('#prac');
  PRAC.forEach(function(p){
    var b=document.createElement('button');b.type='button';b.className='flip';b.setAttribute('aria-pressed','false');
    b.innerHTML='<span class="flipin"><span class="face front"><h3>'+p[0]+'</h3><p>'+p[1]+'</p><span class="hint">Flip for the evidence</span></span><span class="face back"><p class="label" style="color:inherit;opacity:.7">Where it showed up</p><p>'+p[2]+'</p><span class="hint">Flip back</span></span></span>';
    b.addEventListener('click',function(){var on=!b.classList.contains('on');b.classList.toggle('on',on);b.setAttribute('aria-pressed',on?'true':'false')});
    pr.appendChild(b);
  });

  /* ===== command palette ===== */
  var pal=$('#pal'),palq=$('#palq'),plist=$('#plist'),opener=null,actIdx=0,shown=[];
  function go(id){var el=document.getElementById(id);if(el)el.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'})}
  function demo(k){go('demo');setTimeout(function(){run(k,true)},reduce?0:400)}
  var CMDS=[
    {t:'Go to Demo',g:'Navigate',k:'pipeline break ci',f:function(){go('demo')}},
    {t:'Go to Work',g:'Navigate',k:'projects',f:function(){go('work')}},
    {t:'Go to Stack',g:'Navigate',k:'skills tools',f:function(){go('stack')}},
    {t:'Go to Record',g:'Navigate',k:'experience education timeline',f:function(){go('record')}},
    {t:'Go to Practice',g:'Navigate',k:'habits principles',f:function(){go('practice')}},
    {t:'Go to Contact',g:'Navigate',k:'email hire',f:function(){go('contact')}},
    {t:'Run: clean change',g:'Demo',k:'pipeline pass',f:function(){demo('ok')}},
    {t:'Run: broken logic',g:'Demo',k:'pipeline unit test fail',f:function(){demo('unit')}},
    {t:'Run: broken user flow',g:'Demo',k:'pipeline playwright e2e fail',f:function(){demo('e2e')}},
    {t:'Run: over-broad IAM role',g:'Demo',k:'pipeline terraform wildcard',f:function(){demo('iam')}},
    {t:'Map: NeuroGuide',g:'Map',k:'lens project',f:function(){go('top');setLens('neuro')}},
    {t:'Map: BirdTag',g:'Map',k:'lens project',f:function(){go('top');setLens('bird')}},
    {t:'Map: Pose Estimation',g:'Map',k:'lens project kubernetes',f:function(){go('top');setLens('pose')}},
    {t:'Map: FeePrint',g:'Map',k:'lens project',f:function(){go('top');setLens('fee')}},
    {t:'Copy email',g:'Action',k:'contact',f:copyMail},
    {t:'Toggle light and dark',g:'Action',k:'theme colour',f:flipTheme},
    {t:'Toggle recruiter mode',g:'Action',k:'short summary',f:function(){setRec(!recruiter)}},
    {t:'Open LinkedIn',g:'Link',k:'profile',href:'https://www.linkedin.com/in/shibila-thangavelu'},
    {t:'Open GitHub',g:'Link',k:'code repositories',href:'https://github.com/ShibilaThanagvelu'}
  ];
  function render(){
    var q=palq.value.trim().toLowerCase();
    shown=CMDS.filter(function(c){return !q||(c.t+' '+c.g+' '+c.k).toLowerCase().indexOf(q)>-1});
    if(actIdx>=shown.length)actIdx=Math.max(0,shown.length-1);
    plist.innerHTML='';
    if(!shown.length){plist.innerHTML='<li><span style="color:var(--muted)">Nothing matches. Try "demo" or "work".</span></li>';return}
    shown.forEach(function(c,i){
      var li=document.createElement('li');li.setAttribute('role','option');if(i===actIdx)li.className='act';
      var el;
      if(c.href){el=document.createElement('a');el.href=c.href;el.target='_blank';el.rel='noopener'}else el=document.createElement('div');
      el.innerHTML='<span>'+c.t+'</span><span class="g">'+c.g+'</span>';
      el.addEventListener('click',function(ev){if(!c.href){ev.preventDefault();closePal();c.f()}else closePal()});
      el.addEventListener('mousemove',function(){if(actIdx!==i){actIdx=i;$$('#plist li').forEach(function(x,j){x.className=j===i?'act':''})}});
      li.appendChild(el);plist.appendChild(li);
    });
  }
  function openPal(){opener=document.activeElement;pal.hidden=false;palq.value='';actIdx=0;render();palq.focus()}
  function closePal(){pal.hidden=true;if(opener&&opener.focus)try{opener.focus()}catch(e){}}
  $('#kbtn').addEventListener('click',openPal);
  pal.addEventListener('mousedown',function(e){if(e.target===pal)closePal()});
  palq.addEventListener('input',function(){actIdx=0;render()});
  palq.addEventListener('keydown',function(e){
    if(e.key==='ArrowDown'){e.preventDefault();actIdx=Math.min(shown.length-1,actIdx+1);render();var a=$('.act',plist);if(a)a.scrollIntoView({block:'nearest'})}
    else if(e.key==='ArrowUp'){e.preventDefault();actIdx=Math.max(0,actIdx-1);render();var b=$('.act',plist);if(b)b.scrollIntoView({block:'nearest'})}
    else if(e.key==='Enter'){e.preventDefault();var c=shown[actIdx];if(!c)return;if(c.href){var a2=$('.act a',plist);if(a2)a2.click();closePal()}else{closePal();c.f()}}
    else if(e.key==='Tab'){e.preventDefault()}
  });

  /* ===== global keys + easter eggs ===== */
  var buf='',kon=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'],ki=0;
  document.addEventListener('keydown',function(e){
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();pal.hidden?openPal():closePal();return}
    if(e.key==='Escape'&&!pal.hidden){closePal();return}
    var t=e.target&&e.target.tagName;if(t==='INPUT'||t==='TEXTAREA')return;
    if(e.key===kon[ki]){ki++;if(ki===kon.length){ki=0;users.value=400;pods();egg('konami','Autoscaling to 8 pods. Check the Pose Estimation card.')}}else ki=(e.key===kon[0])?1:0;
    if(e.key.length===1){
      buf=(buf+e.key.toLowerCase()).slice(-10);
      if(buf.slice(-6)==='deploy'){buf='';egg('deploy','Deployed. 0 errors, 0 warnings.')}
      else if(buf.slice(-4)==='sudo'){buf='';egg('sudo','Nice try. IAM says no.')}
    }
  });
})();
