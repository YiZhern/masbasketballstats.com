function showPercentiles(playerName, stats) {
  console.log('showPercentiles called with:', playerName, stats);

  const canvas = document.getElementById('percentileChart');
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Unable to get canvas context');
    return;
  }

  const labels = ['PTS', 'AS', 'TR', 'ST', 'BS', 'Min'];
  const values = [stats.PTS, stats.AS, stats.TR, stats.ST, stats.BS, stats.Min];
  console.log('Chart values:', values);

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
