let originalData = [];
let currentPage = 1;
const pageSize = 25;

// Fetch and parse CSV
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
      min: +r.Min,
      fga: +r.FGA,
      fgm: +r.FGM,
      fga2: +r['2FGA'],
      fgm2: +r['2FGM'],
      fga3: +r['3FGA'],
      fgm3: +r['3FGM'],
      fta: +r.FTA,
      ftm: +r.FTM,
      oreb: +r.OR,
      dreb: +r.DR,
      treb: +r.TR,
      as: +r.AS,
      to: +r.TO,
      st: +r.ST,
      bs: +r.BS,
      pf: +r.PF,
      fd: +r.FD,
      pts: +r.PTS
    }));
    //renderTable();
  })
  .catch(err => {
    console.error("Failed to load data", err);
    alert("Could not load box score data.");
});

function getFilteredData() {
  const comp = document.getElementById('competitionSelect').value;
  const year = document.getElementById('yearSelect').value;
  const playerName = document.getElementById('playerInput').value.trim().toLowerCase();

  return originalData.filter(row =>
    (comp === 'All' || row.competition === comp) &&
    (year === 'All' || row.year === year) &&
    (!playerName || row.player.toLowerCase().includes(playerName))
  );
}

function renderTable() {
  const data = getFilteredData();
  const stat = document.getElementById('sortSelect').value;
  const statKey = stat === 'reb' ? 'treb' : stat;

  const sorted = [...data].sort((a, b) => (b[statKey] || 0) - (a[statKey] || 0));
  const start = (currentPage - 1) * pageSize;
  const paged = sorted.slice(start, start + pageSize);

  const tbody = document.querySelector('#statsTable tbody');
  tbody.innerHTML = paged.map(r => `
    <tr>
      <td>${r.player}</td><td>${r.competition}</td><td>${r.year}</td><td>${r.team}</td>
      <td>${r.gp}</td><td>${r.min}</td><td>${r.fga}</td><td>${r.fgm}</td>
      <td>${r.fga2}</td><td>${r.fgm2}</td><td>${r.fga3}</td><td>${r.fgm3}</td>
      <td>${r.fta}</td><td>${r.ftm}</td><td>${r.oreb}</td><td>${r.dreb}</td><td>${r.treb}</td>
      <td>${r.as}</td><td>${r.to}</td><td>${r.st}</td><td>${r.bs}</td>
      <td>${r.pf}</td><td>${r.fd}</td><td>${r.pts}</td>
    </tr>
  `).join('');

  document.getElementById('tableContainer').style.display = 'block';
  document.getElementById('pageInfo').textContent = `Page ${currentPage}`;
}

function changePage(delta) {
  const data = getFilteredData();
  const totalPages = Math.ceil(data.length / pageSize);
  currentPage = Math.max(1, Math.min(totalPages, currentPage + delta));
  renderTable();
}

function sortByStat() {
  currentPage = 1;
  renderTable();
}

function filterByCompetition(){
  currentPage = 1;
  renderTable();
  document.getElementById('tableContainer').style.display = 'block';
}

// Setup dynamic filters
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('competitionSelect').addEventListener('change', filterByCompetition);
  document.getElementById('yearSelect').addEventListener('change', filterByCompetition);
  document.getElementById('playerInput').addEventListener('input', filterByCompetition);
});
