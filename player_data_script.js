function calculatePercentiles(playerStats) {
  const statsKeys = Object.keys(playerStats);
  const percentiles = {};

  const statFieldMap = {
    'PTS': 'pts',
    '3FGM': 'fgm3',
    'BLK': 'bs',
    'STL': 'st',
    'AST': 'as',
    'REB': 'tr'
  };

  statsKeys.forEach(key => {
    const field = statFieldMap[key];
    const allValues = originalData.reduce((arr, row) => {
      if (row.gp > 0 && row[field] != null) arr.push(row[field]);
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

  showOgiveChart('PTS', stats.PTS);
}

function showOgiveChart(statKey, playerValue) {
  console.log("Ogive: comparing", statKey, "value:", playerValue);

  const fieldMap = {
    'PTS': 'pts',
    '3FGM': 'fgm3',
    'BLK': 'bs',
    'STL': 'st',
    'AST': 'as',
    'REB': 'tr'
  };
  const field = fieldMap[statKey];
  if (!field) return console.error("Unknown statKey:", statKey);

  const values = originalData
    .filter(r => r.gp > 0)
    .map(r => r.gp > 0 ? r[field] / r.gp : 0)
    .filter(v => v != null)
    .sort((a, b) => a - b);

  console.log("Values array length:", values.length, values.slice(0,5));

  const cumulative = values.map((v, i) => ({
    x: v,
    y: ((i + 1) / values.length) * 100
  }));

  const playerPct = cumulative.find(d => d.x >= playerValue)?.y ?? 100;

  const canvas = document.getElementById('ogiveChart');
  if (!canvas) return console.error("canvas#ogiveChart not found");

  const ctx = canvas.getContext('2d');
  if (!ctx) return console.error("Cannot getContext for ogiveChart");

  if (window.ogiveChart?.destroy) window.ogiveChart.destroy();

  window.ogiveChart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: `CDF of ${statKey}`,
          data: cumulative,
          borderColor: 'blue',
          backgroundColor: 'rgba(0,0,255,0.1)',
          tension: 0.3,
          pointRadius: 0
        },
        {
          label: 'Player',
          data: [{ x: playerValue, y: playerPct }],
          backgroundColor: 'red',
          pointRadius: 6,
          type: 'scatter'
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: statKey } },
        y: { beginAtZero: true, max: 100, title: { display: true, text: 'Percentile (%)' } }
      }
    }
  });

  document.getElementById('ogiveSection').style.display = 'block';
}
