let doughnutChart = null;

export function updateBazarChart(bazarLogs) {
  const ctx = document.getElementById('bazarDoughnutChart');
  if (!ctx) return;

  const shopperTotals = {};
  bazarLogs.forEach(log => {
    const shopper = log.shopperName || 'Unknown';
    shopperTotals[shopper] = (shopperTotals[shopper] || 0) + log.totalCost;
  });

  const labels = Object.keys(shopperTotals);
  const data = Object.values(shopperTotals);
  const bgColors = [
    '#5A34A6', '#00F2FE', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6'
  ];

  if (doughnutChart) {
    doughnutChart.data.labels = labels;
    doughnutChart.data.datasets[0].data = data;
    doughnutChart.update();
  } else {
    doughnutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: bgColors,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: getComputedStyle(document.documentElement).getPropertyValue('--color-text-main') } },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.label || '';
                if (label) { label += ': '; }
                if (context.parsed !== null) { label += '৳ ' + context.parsed.toFixed(2); }
                return label;
              }
            }
          }
        }
      }
    });
  }
}
