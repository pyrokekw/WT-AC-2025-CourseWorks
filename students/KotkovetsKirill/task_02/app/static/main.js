async function markCompleted(lessonId, btn){
  try{
    btn.disabled = true;
    btn.innerText = 'Marking...';
    const resp = await fetch(`/lessons/${lessonId}/complete`, {method:'POST', headers: {'Accept':'application/json'}});
    if(resp.ok){
      const data = await resp.json();
      const badge = document.getElementById('completed-badge');
      if(badge){
        badge.style.display = 'inline-block';
        badge.classList.add('pop-in');
      }
      btn.style.display = 'none';
    } else if(resp.status === 401){
      window.location = '/login';
    } else {
      btn.disabled = false;
      btn.innerText = 'Mark completed';
      alert('Could not mark as completed');
    }
  }catch(e){
    console.error(e);
    btn.disabled = false;
    btn.innerText = 'Mark completed';
  }
}
