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
  console.log("=== showOgiveChart called ===");
  console.log("Stat:", statKey, "Player Value:", playerValue);

  const canvas = document.getElementById('ogiveChart');
  if (!canvas) {
    console.error("Canvas #ogiveChart not found.");
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error("Could not get canvas context.");
    return;
  }

  // Extract per-game values based on statKey
  const rawValues = originalData
    .filter(p => p.gp > 0)
    .map(p => {
      if (statKey === '3FGM') return p.fgm3 / p.gp;
      if (statKey === 'BLK') return p.bs / p.gp;
      if (statKey === 'STL') return p.st / p.gp;
      if (statKey === 'AST') return p.as / p.gp;
      if (statKey === 'REB') return p.tr / p.gp;
      return p.pts / p.gp;
    });

  console.log("Raw values (first 10):", rawValues.slice(0, 10));

  // Clean and sort values
  const values = rawValues.filter(v => !isNaN(v)).sort((a, b) => a - b);
  console.log("Sorted values (first 10):", values.slice(0, 10));

  if (values.length === 0) {
    console.warn("No values available for ogive.");
    return;
  }

  // Generate cumulative distribution
  const cumulative = values.map((v, i) => ({
    x: v,
    y: ((i + 1) / values.length) * 100
  }));

  console.log("Cumulative points (first 10):", cumulative.slice(0, 10));

  const playerPercentile = cumulative.find(d => d.x >= playerValue)?.y || 100;
  console.log("Player percentile location:", playerPercentile);

  // Destroy old chart
  if (window.ogiveChart && typeof window.ogiveChart.destroy === 'function') {
    window.ogiveChart.destroy();
  }

  // Create ogive chart
  window.ogiveChart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: `CDF of ${statKey}`,
          data: cumulative,
          borderColor: 'blue',
          borderWidth: 2,
          fill: false,
          pointRadius: 0
        },
        {
          label: 'Player',
          data: [{ x: playerValue, y: playerPercentile }],
          backgroundColor: 'red',
          borderColor: 'red',
          type: 'scatter',
          pointRadius: 6,
          pointHoverRadius: 8
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: `${statKey} (Per Game)`
          },
          beginAtZero: true
        },
        y: {
          title: {
            display: true,
            text: 'Percentile (%)'
          },
          beginAtZero: true,
          max: 100
        }
      }
    }
  });

  document.getElementById('ogiveSection').style.display = 'block';
}

