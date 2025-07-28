window.addEventListener('DOMContentLoaded', () => {
  const ctx = document.getElementById('testChart').getContext('2d');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['PTS', 'AS', 'TR', 'ST', 'BS', 'Min'],
      datasets: [{
        label: 'Avg Per Game',
        data: [22, 6.5, 9.1, 2.8, 1.0, 32],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
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
});
