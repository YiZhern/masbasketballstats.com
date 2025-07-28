function showPercentiles(playerName) {
      const ctx = document.getElementById('percentileChart').getContext('2d');

      const labels = ['PTS', 'AS', 'TR', 'ST', 'BS', 'Min'];
      const data = [88, 74, 66, 70, 62, 80]; // Replace with real percentiles

      if (window.percentileChart) {
        window.percentileChart.destroy();
      }

      window.percentileChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: `${playerName} Percentile Rank`,
            data: data,
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
              max: 100,
              title: {
                display: true,
                text: 'Percentile'
              }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => `${context.parsed.y}%`
              }
            }
          }
        }
      });

      document.getElementById('percentileSection').style.display = 'block';
    }
