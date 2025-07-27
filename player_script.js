let originalData = [];

fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vTdFDyDmOtmFl1uhz2ZJkhb0rb6BjWabVdhvrwn6DZ9DRAhEdwKhvkZ_dGQVwBrs1qrTtJQiHf-JEyU/pub?output=csv')
  .then(r => r.text())
  .then(csv => {
    const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true }).data;
    originalData = parsed.map(r => ({
      player: r.Player,
      competition: r.Competition,
      year: r.Year,
      team: r.Team,
      gp: +r.GP,
      min: +r.Min || 0,
      pts: +r.PTS,
      as: +r.AS,
      tr: +r.TR,
      st: +r.ST,
      bs: +r.BS,
    }));
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

function searchPlayer() {
  const player = document.getElementById('searchPlayer').value.trim().toLowerCase();
  const results = originalData.filter(r => r.player.toLowerCase() === player);
  const tableBody = document.querySelector('#playerStatsTable tbody');
  const table = document.getElementById('tableContainer');

  if (results.length === 0) {
    table.style.display = 'none';
    return;
  }

  tableBody.innerHTML = '';
  let totals = { gp: 0, min: 0, pts: 0, as: 0, tr: 0, st: 0, bs: 0 };

  results.forEach(r => {
    tableBody.innerHTML += `
      <tr>
        <td>${r.player}</td>
        <td>${r.competition}</td>
        <td>${r.year}</td>
        <td>${r.team}</td>
        <td>${r.gp}</td>
        <td>${r.min}</td>
        <td>${r.pts}</td>
        <td>${r.as}</td>
        <td>${r.tr}</td>
        <td>${r.st}</td>
        <td>${r.bs}</td>
      </tr>
    `;

    totals.gp += r.gp;
    totals.min += r.min;
    totals.pts += r.pts;
    totals.as += r.as;
    totals.tr += r.tr;
    totals.st += r.st;
    totals.bs += r.bs;
  });

  document.getElementById('tot-gp').textContent = totals.gp;
  document.getElementById('tot-min').textContent = totals.min;
  document.getElementById('tot-pts').textContent = totals.pts;
  document.getElementById('tot-as').textContent = totals.as;
  document.getElementById('tot-tr').textContent = totals.tr;
  document.getElementById('tot-st').textContent = totals.st;
  document.getElementById('tot-bs').textContent = totals.bs;

  table.style.display = 'block';
}
