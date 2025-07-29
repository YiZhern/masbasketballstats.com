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
      bs: +r.BS || 0,
      fgm3: +r['3FGM'] || 0
    }));
  });

window.showSuggestions = function() {
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

window.searchPlayer = function () {
  const nameInput = document.getElementById('searchPlayer').value.trim().toLowerCase();
  const filtered = originalData.filter(r => r.player.toLowerCase() === nameInput);

  if (filtered.length === 0) {
    document.getElementById('tableContainer').style.display = 'none';
    document.getElementById('percentileSection').style.display = 'none';
    return;
  }

  const tbody = document.querySelector('#playerStatsTable tbody');
  tbody.innerHTML = '';

  let totals = { gp: 0, min: 0, pts: 0, as: 0, tr: 0, st: 0, bs: 0, fgm3: 0};

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

    totals.gp += Number(r.gp);
    totals.min += Number(r.min);
    totals.pts += Number(r.pts);
    totals.as += Number(r.as);
    totals.tr += Number(r.tr);
    totals.st += Number(r.st);
    totals.bs += Number(r.bs);
    totals.fgm3 += Number(r.fgm3);
  });

  document.getElementById('tot-gp').textContent = totals.gp;
  document.getElementById('tot-min').textContent = totals.min;
  document.getElementById('tot-pts').textContent = totals.pts;
  document.getElementById('tot-as').textContent = totals.as;
  document.getElementById('tot-tr').textContent = totals.tr;
  document.getElementById('tot-st').textContent = totals.st;
  document.getElementById('tot-bs').textContent = totals.bs;

  document.getElementById('tableContainer').style.display = 'block';

  // Only generate chart if there are games
  if (totals.gp > 0) {
    const playerStats = {
      PTS: totals.pts,
      AS: totals.as,
      TR: totals.tr,
      ST: totals.st,
      BS: totals.bs,
      Min: totals.min,
    };
    
    const percentiles = calculatePercentiles(playerStats);
    showPercentiles(filtered[0].player, percentiles);
  }
}

function calculatePercentiles(playerStats) {
  const statsKeys = Object.keys(playerStats);
  const percentiles = {};

  statsKeys.forEach(key => {
    const allValues = originalData.reduce((arr, row) => {
      const total = +row.gp > 0 ? (key === '3FGM' ? row.fg3m : row[key.toLowerCase()]) : 0;
      if (total) arr.push(total);
      return arr;
    }, []);

    allValues.sort((a, b) => a - b);
    const rank = allValues.findIndex(v => v >= playerStats[key]);
    const percentile = rank === -1 ? 100 : Math.round((rank / allValues.length) * 100);
    percentiles[key] = percentile;
  });

  return percentiles;
}

window.showPercentiles = function (playerName, stats) {
  const canvas = document.getElementById('percentileChart');
  if (!canvas) {
    alert('Canvas for percentileChart not found.');
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    alert('Canvas context could not be created.');
    return;
  }

  const labels = ['PTS', '3FGM', 'BLK', 'STL', 'AST', 'REB'];
  const values = [stats.PTS, stats['3FGM'], stats.BLK, stats.STL, stats.AST, stats.REB];

  if (window.percentileChart && typeof window.percentileChart.destroy === 'function') {
    window.percentileChart.destroy();
  }
  window.percentileChart = null;

  window.percentileChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: labels,
      datasets: [{
        label: `${playerName} - Percentile Rank`,
        data: values,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(255, 99, 132, 1)'
      }]
    },
    options: {
      responsive: true,
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: { stepSize: 20 },
          pointLabels: { font: { size: 14 } }
        }
      }
    }
  });

  document.getElementById('percentileSection').style.display = 'block';
}
