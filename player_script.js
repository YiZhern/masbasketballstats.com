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
      gp: +r.GP || 0,
      min: +r.Min || 0,
      pts: +r.PTS || 0,
      as: +r.AS || 0,
      tr: +r.TR || 0,
      st: +r.ST || 0,
      bs: +r.BS || 0
    }));
  });

function showSuggestions() {
  const input = document.getElementById('searchPlayer').value.toLowerCase();
  const suggestionsDiv = document.getElementById('suggestions');
  suggestionsDiv.innerHTML = '';

  if (input.length === 0) return;

  const players = [...new Set(originalData.map(r => r.player))];
  const matches = players.filter(name => name.toLowerCase().includes(input));

  matches.forEach(name => {
    const div = document.createElement('div');
    div.textContent = name;
    div.onclick = () => {
      document.getElementById('searchPlayer').value = name;
      suggestionsDiv.innerHTML = '';
      searchPlayer();
    };
    suggestionsDiv.appendChild(div);
  });
}

function searchPlayer() {
  const name = document.getElementById('searchPlayer').value.trim().toLowerCase();
  const filtered = originalData.filter(r => r.player.toLowerCase() === name);

  if (filtered.length === 0) {
    document.getElementById('tableContainer').style.display = 'none';
    return;
  }

  const tbody = document.querySelector('#playerStatsTable tbody');
  const tfoot = document.querySelector('#playerStatsTable tfoot');
  tbody.innerHTML = '';

  let totals = { gp: 0, min: 0, pts: 0, as: 0, tr: 0, st: 0, bs: 0 };

  filtered.forEach(r => {
    tbody.innerHTML += `
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

  document.getElementById('tableContainer').style.display = 'block';
}
