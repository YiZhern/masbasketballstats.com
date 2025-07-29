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

    totals.gp += Number(r.gp);
    totals.min += Number(r.min);
    totals.pts += Number(r.pts);
    totals.as += Number(r.as);
    totals.tr += Number(r.tr);
    totals.st += Number(r.st);
    totals.bs += Number(r.bs);
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
    const avgStats = {
      PTS: totals.pts / totals.gp,
      AS: totals.as / totals.gp,
      TR: totals.tr / totals.gp,
      ST: totals.st / totals.gp,
      BS: totals.bs / totals.gp,
      Min: totals.min / totals.gp,
    };
    
    console.log('Calling showPercentiles with:', filtered[0].player, avgStats);
    showPercentiles(filtered[0].player, avgStats);
  }
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

  const values = [stats.PTS, stats.AS, stats.TR, stats.ST, stats.BS, stats.Min];
  console.log(`Drawing chart for ${playerName} with values:`, values);

  if (window.percentileChart instanceof Chart) {
    window.percentileChart.destroy();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  window.percentileChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['PTS', 'AS', 'TR', 'ST', 'BS', 'Min'],
      datasets: [{
        label: `${playerName} (Avg Per Game)`,
        data: values,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  document.getElementById('percentileSection').style.display = 'block';
}
