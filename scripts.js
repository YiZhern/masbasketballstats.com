let currentPage = 1;
const rowsPerPage = 30;
let filteredData = []; // will hold filtered results

function calculate() {
  const made = parseInt(document.getElementById("made").value);
  const attempted = parseInt(document.getElementById("attempted").value);

  if (isNaN(made) || isNaN(attempted) || attempted === 0) {
    document.getElementById("result").textContent = "Please enter valid numbers.";
    return;
  }

  const percentage = ((made / attempted) * 100).toFixed(2);
  document.getElementById("result").textContent = `Free Throw %: ${percentage}%`;
}

// Render a sample shot chart using Chart.js
const ctx = document.getElementById("shotChart").getContext("2d");
new Chart(ctx, {
  type: "bar",
  data: {
    labels: ["3PT", "2PT", "FT"],
    datasets: [{
      label: "Shots Made",
      data: [3, 7, 5],
      backgroundColor: ["#ff6b6b", "#6bc2ff", "#7fd184"],
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
