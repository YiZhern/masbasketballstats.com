function showPercentiles(playerName, stats) {
  const ctx = document.getElementById('percentileChart').getContext('2d');

  const labels = ['PTS', 'AS', 'TR', 'ST', 'BS', 'Min'];
  const values = [stats.PTS, stats.AS, stats.TR, stats.ST, stats.BS, stats.Min];

  if (window.percentileChart) {
    window.percentileChart.destroy();
  }

  window.percentileChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
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
          beginAtZero: true,
          title: {
            display: true,
            text: 'Avg Per Game'
          }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });

  document.getElementById('percentileSection').style.display = 'block';
}
