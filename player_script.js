let originalData = [];

fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vTdFDyDmOtmFl1uhz2ZJkhb0rb6BjWabVdhvrwn6DZ9DRAhEdwKhvkZ_dGQVwBrs1qrTtJQiHf-JEyU/pub?output=csv')
  .then(r => r.text())
  .then(csv => {
    originalData = Papa.parse(csv, { header: true, skipEmptyLines: true }).data;
  })
  .catch(e => console.error('CSV load error', e));

document.getElementById('searchBtn').addEventListener('click', () => {
  const search = document.getElementById('playerNameInput').value.trim().toLowerCase();
  if (!search) return;
  const filtered = originalData.filter(r => r.Player.toLowerCase().includes(search));
  if (!filtered.length) return alert('No data found');

  const tbody = document.querySelector('#playerStatsTable tbody');
  tbody.innerHTML = '';
  let totals = { GP:0, Min:0, PTS:0, AS:0, TR:0, ST:0, BS:0};

  filtered.forEach(r => {
    const gp = +r.GP || 0;
    const min = +r.Min || 0;
    const tr = +r.TR || 0;
    const row = `<tr>
      <td>${r.Player}</td><td>${r.Competition}</td><td>${r.Year}</td><td>${r.Team}</td>
      <td>${gp}</td><td>${min}</td><td>${+r.PTS}</td><td>${+r.AS}</td>
      <td>${tr}</td><td>${+r.ST}</td><td>${+r.BS}</td>
    </tr>`;
    tbody.insertAdjacentHTML('beforeend', row);

    totals.GP += gp;
    totals.Min += min;
    totals.PTS += +r.PTS || 0;
    totals.AS += +r.AS || 0;
    totals.TR += tr;
    totals.ST += +r.ST || 0;
    totals.BS += +r.BS || 0;
  });

  document.getElementById('tot-gp').textContent = totals.GP;
  document.getElementById('tot-min').textContent = totals.Min;
  document.getElementById('tot-pts').textContent = totals.PTS;
  document.getElementById('tot-as').textContent = totals.AS;
  document.getElementById('tot-tr').textContent = totals.TR;
  document.getElementById('tot-st').textContent = totals.ST;
  document.getElementById('tot-bs').textContent = totals.BS;

  document.getElementById('tableContainer').style.display = 'block';
});

function showSuggestions() {
  const input = document.getElementById('searchPlayer');
  const list = document.getElementById('suggestions');
  const value = input.value.toLowerCase();

  if (value.length < 1) return list.innerHTML = '';

  const uniqueNames = [...new Set(originalData.map(r => r.player))];
  const filtered = uniqueNames.filter(name => name.toLowerCase().includes(value));

  list.innerHTML = '';
  filtered.forEach(name => {
    const div = document.createElement('div');
    div.textContent = name;
    div.onclick = () => {
      input.value = name;
      list.innerHTML = '';
      searchPlayer();
    };
    list.appendChild(div);
  });
}

