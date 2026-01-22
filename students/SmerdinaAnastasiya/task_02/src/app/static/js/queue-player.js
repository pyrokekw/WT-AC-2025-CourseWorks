document.addEventListener('DOMContentLoaded', function(){
  // create simple bottom player UI
  const container = document.createElement('div');
  container.id = 'mp-player';
  container.innerHTML = `
    <div class="mp-player-inner d-flex align-items-center justify-content-between">
      <div class="mp-track-info">
        <img id="mp-cover" src="" alt="cover" style="width:48px;height:48px;object-fit:cover;margin-right:8px;display:none;">
        <span id="mp-title">No track</span> — <small id="mp-artist"></small>
      </div>
      <div class="mp-controls">
        <button id="mp-prev" class="btn btn-sm btn-outline-light">Prev</button>
        <button id="mp-play" class="btn btn-sm btn-outline-light">Play</button>
        <button id="mp-next" class="btn btn-sm btn-outline-light">Next</button>
      </div>
      <div class="mp-queue-count text-muted small">Queue: <span id="mp-queue-count">0</span></div>
    </div>
  `;
  container.className = 'mp-player fixed-bottom bg-dark text-white p-2';
  document.body.appendChild(container);

  function getQueue(){try{return JSON.parse(localStorage.getItem('mp_queue')||'[]')}catch(e){return[]}}
  function setQueue(q){localStorage.setItem('mp_queue', JSON.stringify(q));}

  let playingIndex = parseInt(localStorage.getItem('mp_playing_index')||'0');
  let isPlaying = localStorage.getItem('mp_playing') === '1';

  function render(){
    const q = getQueue();
    document.getElementById('mp-queue-count').innerText = q.length;
    if (q.length>0 && q[playingIndex]){
      const cur = q[playingIndex];
      const title = cur.title || 'Unknown';
      const artist = cur.artist || '';
      const cover = cur.cover_url || '';
      document.getElementById('mp-title').innerText = title;
      document.getElementById('mp-artist').innerText = artist;
      const img = document.getElementById('mp-cover');
      if (cover){ img.src = cover; img.style.display='inline-block'} else { img.style.display='none'}
      document.getElementById('mp-play').innerText = isPlaying ? 'Pause' : 'Play';
    } else {
      document.getElementById('mp-title').innerText = 'No track';
      document.getElementById('mp-artist').innerText = '';
      document.getElementById('mp-cover').style.display='none';
      document.getElementById('mp-play').innerText = 'Play';
    }
  }

  function savePlayingIndex(i){ playingIndex = i; localStorage.setItem('mp_playing_index', String(playingIndex)); }
  function savePlayingState(p){ isPlaying = !!p; localStorage.setItem('mp_playing', p ? '1' : '0'); }

  document.getElementById('mp-next').addEventListener('click', function(){
    const q = getQueue(); if (q.length===0) return; savePlayingIndex(Math.min(playingIndex+1, q.length-1)); savePlayingState(true); render();
  });
  document.getElementById('mp-prev').addEventListener('click', function(){
    const q = getQueue(); if (q.length===0) return; savePlayingIndex(Math.max(playingIndex-1, 0)); savePlayingState(true); render();
  });
  document.getElementById('mp-play').addEventListener('click', function(){
    savePlayingState(!isPlaying); render();
  });

  // Queue modal/view
  const queueModalId = 'mp-queue-modal';
  function openQueueModal(){
    let modal = document.getElementById(queueModalId);
    if (!modal){
      modal = document.createElement('div'); modal.id = queueModalId; modal.className='mp-queue-modal';
      modal.innerHTML = `<div class="mp-queue-list p-3 bg-white text-dark" style="max-height:300px;overflow:auto;"><h6>Queue</h6><ul id="mp-queue-list" class="list-group"></ul><div class="mt-2 text-end"><button id="mp-close-queue" class="btn btn-sm btn-secondary">Close</button></div></div>`;
      document.body.appendChild(modal);
      document.getElementById('mp-close-queue').addEventListener('click', ()=>{ modal.remove(); });
    }
    // render list
    const listEl = document.getElementById('mp-queue-list'); listEl.innerHTML='';
    const q = getQueue();
    q.forEach((it, idx)=>{
      const li = document.createElement('li'); li.className='list-group-item d-flex justify-content-between align-items-center';
      li.innerHTML = `<div><strong>${it.title}</strong><div class="small text-muted">${it.artist||''}</div></div>`;
      const btns = document.createElement('div');
      const playBtn = document.createElement('button'); playBtn.className='btn btn-sm btn-outline-primary me-1'; playBtn.innerText='Play';
      playBtn.addEventListener('click', ()=>{ savePlayingIndex(idx); savePlayingState(true); render(); });
      const remBtn = document.createElement('button'); remBtn.className='btn btn-sm btn-outline-danger'; remBtn.innerText='Remove';
      remBtn.addEventListener('click', ()=>{ q.splice(idx,1); setQueue(q); if (playingIndex>=q.length) savePlayingIndex(Math.max(0,q.length-1)); render(); openQueueModal(); });
      btns.appendChild(playBtn); btns.appendChild(remBtn);
      li.appendChild(btns);
      listEl.appendChild(li);
    });
  }

  // wire opening via clicking the queue count
  document.querySelector('.mp-queue-count').addEventListener('click', openQueueModal);

  // watch localStorage changes and custom event
  window.addEventListener('storage', function(e){ if (e.key==='mp_queue' || e.key==='mp_playing_index' || e.key==='mp_playing'){ render(); } });
  window.addEventListener('mp_queue_updated', function(){ render(); });
  render();
});
