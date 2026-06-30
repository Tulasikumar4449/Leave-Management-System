document.addEventListener('DOMContentLoaded', () => {
  const yearChart = document.getElementById('leaveYearChart');
  const trendChart = document.getElementById('monthlyTrendChart');
  const typeChart = document.getElementById('typeDistributionChart');

  if (yearChart) {
    new Chart(yearChart, {
      type: 'bar',
      data: {
        labels: ['Used Days'],
        datasets: [{
          label: 'Leave Days Used',
          data: [Number(yearChart.dataset.used)],
          backgroundColor: ['rgba(67, 56, 202, 0.85)']
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  if (trendChart) {
    const labels = JSON.parse(trendChart.dataset.labels);
    const values = JSON.parse(trendChart.dataset.values);
    new Chart(trendChart, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Monthly Trend',
          data: values,
          borderColor: '#4338ca',
          backgroundColor: 'rgba(67, 56, 202, 0.16)',
          fill: true,
          tension: 0.35,
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  if (typeChart) {
    const labels = JSON.parse(typeChart.dataset.labels);
    const values = JSON.parse(typeChart.dataset.values);
    new Chart(typeChart, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: ['#4338ca', '#2563eb', '#f59e0b', '#16a34a'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, padding: 16 } }
        }
      }
    });
  }
});