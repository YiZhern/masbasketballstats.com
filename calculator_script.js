let originalData = [];

// Utility to safely divide
function safeDivide(n, d) {
  return d === 0 ? 0 : n / d;
}

// Fetch and parse CSV data
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
      pts: +r.PTS,
      fg: safeDivide(+r.FGM, +r.FGA),
      fg2: safeDivide(+r['2FGM'], +r['2FGA']),
      fg3: safeDivide(+r['3FGM'], +r['3FGA']),
      ft: safeDivide(+r.FTM, +r.FTA)
    }));
    populateCompetitionOptions();
  })
  .catch(err => {
    console.error("Error loading CSV:", err);
    alert("Failed to load player data.");
  });

function populateCompetitionOptions() {
  const sel = document.getElementById('competitionSelect');
  sel.innerHTML = '<option>All</option>';
  [...new Set(originalData.map(p => p.competition))].forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    sel.appendChild(opt);
  });
}

function getSelectValues(sel) {
  return [...sel.selectedOptions].map(o => o.value);
}

function getSelectedStats() {
  return [...document.querySelectorAll('input[name="stat"]:checked')].map(c => c.value);
}

function renderSliders() {
  const stats = getSelectedStats();
  const container = document.getElementById('sliderContainer');
  container.innerHTML = '';
  if (!stats.length) return;

  container.innerHTML = '<h3>Weight Allocation</h3>';
  stats.forEach(s => {
    const init = Math.floor(100 / stats.length);
    container.insertAdjacentHTML('beforeend', `
      <label>
        <span class="slider-title">${s.toUpperCase()}</span>
        <input type="range" name="w_${s}" min="0" max="100" value="${init}" oninput="rebalance('${s}')">
        <span class="slider-value">${init}%</span>
      </label>
    `);
  });
  container.style.display = 'block';
  updateLabels();
}

function rebalance(changed) {
  const sliders = document.querySelectorAll('#sliderContainer input[type="range"]');
  const changedSlider = document.querySelector(`[name="w_${changed}"]`);
  const changedVal = +changedSlider.value;
  const others = [...sliders].filter(slider => slider !== changedSlider);
  let remaining = 100 - changedVal;
  const sumOthers = others.reduce((sum, s) => sum + +s.value, 0);

  if (sumOthers === 0) {
    const even = Math.floor(remaining / others.length);
    others.forEach(s => s.value = even);
  } else {
    others.forEach(s => {
      const ratio = +s.value / sumOthers;
      s.value = Math.round(ratio * remaining);
    });
  }

  const total = [...sliders].reduce((sum, s) => sum + +s.value, 0);
  if (total !== 100) {
    const delta = 100 - total;
    others[0].value = +others[0].value + delta;
  }

  updateLabels();
}

function updateLabels() {
  document.querySelectorAll('#sliderContainer input[type="range"]').forEach(inp => {
    inp.nextElementSibling.textContent = inp.value;
  });
}

function generateRanking() {
  const comps = getSelectValues(document.getElementById('competitionSelect'));
  const years = getSelectValues(document.getElementById('yearSelect'));
  const stats = getSelectedStats();

  if (!stats.length) return alert('Select at least one stat.');

  const weights = {};
  document.querySelectorAll('#sliderContainer input[type=range]').forEach(inp => {
    const stat = inp.name.replace('w_', '');
    weights[stat] = (stat === 'to' || stat === 'pf') ? -inp.value / 100 : +inp.value / 100;
  });

  const filtered = originalData.filter(p =>
    p.gp > 0 &&
    (!comps.includes('All') ? comps.includes(p.competition) : true) &&
    (!years.includes('All') ? years.includes(p.year) : true)
  );

  const results = filtered.map(p => ({
    player: p.player,
    team: p.team,
    score: stats.reduce((sum, s) => sum + (p[s] || 0) * weights[s] / p.gp, 0)
  }))
  .sort((a, b) => b.score - a.score)
  .slice(0, 10);

  document.getElementById('rankingTitle').textContent =
    document.getElementById('allocName').value.trim() || 'Ranking';

  const tbody = document.querySelector('#rankingTable tbody');
  tbody.innerHTML = results
    .map(r => `<tr><td>${r.player}</td><td>${r.team}</td><td>${r.score.toFixed(2)}</td></tr>`)
    .join('');
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.chip').forEach(chip => {
    const value = chip.dataset.value;
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'stat';
    checkbox.value = value;
    checkbox.style.display = 'none';
    chip.appendChild(checkbox);

    chip.addEventListener('click', () => {
      chip.classList.toggle('selected');
      checkbox.checked = chip.classList.contains('selected');
      renderSliders();
    });
  });

  document.getElementById('generateBtn').addEventListener('click', generateRanking);
});
