async function updateWidget() {
  try {
    const list = await window.tempoAPI.getActivities();
    if (!list || list.length === 0) {
      document.getElementById('wTitle').textContent = 'Tidak ada agenda';
      document.getElementById('wCountdown').textContent = '-';
      document.getElementById('wProgress').textContent = '0/0';
      return;
    }

    const total = list.length;
    const completed = list.filter(a => a.status === 'completed').length;
    document.getElementById('wProgress').textContent = `${completed}/${total} selesai`;

    // Ambil tugas yang belum selesai dan memiliki dueDate paling dekat
    const pendingList = list.filter(a => a.status !== 'completed');
    if (pendingList.length === 0) {
      document.getElementById('wTitle').textContent = 'Semua agenda beres! 🎉';
      document.getElementById('wCountdown').textContent = '100%';
      return;
    }

    // Urutkan berdasarkan dueDate
    pendingList.sort((a, b) => {
      const timeA = new Date(`${a.dueDate}T${a.dueTime || '23:59:00'}`).getTime();
      const timeB = new Date(`${b.dueDate}T${b.dueTime || '23:59:00'}`).getTime();
      return timeA - timeB;
    });

    const nearest = pendingList[0];
    document.getElementById('wTitle').textContent = nearest.title;
    document.getElementById('wCountdown').textContent = nearest.horizonLabel || 'Mendatang';
  } catch (err) {
    console.error('Widget error:', err);
  }
}

document.getElementById('btnOpen').addEventListener('click', () => {
  window.tempoAPI.showMainWindow();
});

// Update otomatis saat pertama kali dibuka dan setiap 15 detik
updateWidget();
setInterval(updateWidget, 15000);

if (window.tempoAPI && window.tempoAPI.onActivitiesUpdated) {
  window.tempoAPI.onActivitiesUpdated(() => {
    updateWidget();
  });
}
