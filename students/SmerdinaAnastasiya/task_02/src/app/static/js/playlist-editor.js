document.addEventListener('DOMContentLoaded', function(){
  const list = document.getElementById('playlist-tracks');
  if (!list) return;
  const playlistId = window.location.pathname.match(/playlist\/(\d+)/);
  const pid = playlistId ? playlistId[1] : null;

  // Init Sortable
  const sortable = Sortable.create(list, {
    animation: 150,
    handle: '.list-group-item',
    onEnd: function (evt) {
      // build order
      const items = Array.from(list.querySelectorAll('li[data-track-id]'));
      const order = items.map(i => parseInt(i.getAttribute('data-track-id')));
      // send PATCH to server
      if (!pid) return;
      fetch(`/api/playlists/${pid}/tracks/order`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({order: order})
      }).then(r => {
        if (!r.ok) console.error('Failed to save order');
      }).catch(err => console.error(err));
    }
  });

  // Invite modal
  const inviteBtn = document.getElementById('invite-send');
  if (inviteBtn){
    inviteBtn.addEventListener('click', function(){
      const username = document.getElementById('invite-username').value.trim();
      const role = document.getElementById('invite-role').value;
      if (!username) return;
      fetch(`/api/playlists/${pid}/collaborators`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username: username, role: role})
      }).then(r => r.json()).then(data => {
        if (data.status === 'added'){
          location.reload();
        } else {
          alert('Error: '+(data.error||'unknown'));
        }
      });
    });
  }

  // Play / add to queue UI hooks (simple queue in localStorage)
  function getQueue(){
    try {return JSON.parse(localStorage.getItem('mp_queue')||'[]');}catch(e){return []}
  }
  function setQueue(q){localStorage.setItem('mp_queue', JSON.stringify(q));}

  list.addEventListener('click', function(e){
    const playBtn = e.target.closest('.btn-play');
    const addBtn = e.target.closest('.btn-add-queue');
    const li = e.target.closest('li[data-track-id]');
    if (!li) return;
    const trackId = parseInt(li.getAttribute('data-track-id'));
    const title = li.getAttribute('data-track-title') || (li.querySelector('strong') ? li.querySelector('strong').innerText : '');
    const artist = li.getAttribute('data-track-artist') || '';
    const cover = li.getAttribute('data-track-cover') || '';
    if (playBtn){
      const q = getQueue();
      q.unshift({id: trackId, title: title, artist: artist, cover_url: cover});
      setQueue(q);
      // set playing index to 0 to auto-start
      localStorage.setItem('mp_playing_index', '0');
      // notify player
      window.dispatchEvent(new Event('mp_queue_updated'));
    }
    if (addBtn){
      const q = getQueue();
      q.push({id: trackId, title: title, artist: artist, cover_url: cover});
      setQueue(q);
      window.dispatchEvent(new Event('mp_queue_updated'));
    }
  });
  // Import modal -> call API and offer add
  const importBtn = document.getElementById('import-send');
  if (importBtn){
    importBtn.addEventListener('click', function(){
      const url = document.getElementById('import-url').value.trim();
      if (!url) return alert('Provide URL');
      fetch('/api/tracks/import', {
        method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({url: url})
      }).then(r=>r.json()).then(data=>{
        if (data.track){
          // show simple confirm to add
          if (confirm('Import found: '+data.track.title+' — add to playlist?')){
            // POST to add track (we assume track already exists or server will create by URL)
            fetch(`/api/playlists/${pid}/tracks`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({track_id: null, url: url})}).then(r=>{
              if (r.ok) location.reload(); else alert('Failed to add');
            }).catch(e=>alert('Error'));
          }
        } else {
          alert('No track found');
        }
      });
    });
  }
});
