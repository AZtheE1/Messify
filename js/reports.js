export async function generatePDFReport(cycleData) {
  try {
    const template = document.getElementById('pdf-report-template');
    
    // Build HTML content
    let html = `
      <div style="padding: 20px; font-family: sans-serif; color: #333;">
        <h1 style="color: #5A34A6; margin-bottom: 5px;">Messify</h1>
        <h3 style="margin-top: 0; color: #666;">Monthly Expense Reconciliation - ${cycleData.yearMonth}</h3>
        <p style="font-size: 12px; color: #999;">Generated on: ${new Date().toLocaleString()}</p>
        
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <tr style="background: #f8f9fa;">
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Total Deposited</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Total Spent</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Remaining Balance</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Meal Rate</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Total Meals</th>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">৳ ${cycleData.totalDeposited.toFixed(2)}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">৳ ${cycleData.totalBazarSpent.toFixed(2)}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">৳ ${cycleData.remainingBalance.toFixed(2)}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">৳ ${cycleData.mealRate.toFixed(2)}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${cycleData.totalMealsCount}</td>
          </tr>
        </table>

        <h4>Member Ledger</h4>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <tr style="background: #f8f9fa;">
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Member</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Total Meals</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Deposited</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Cost</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Balance</th>
          </tr>
    `;

    if (cycleData.memberStats && cycleData.memberStats.length > 0) {
      cycleData.memberStats.forEach(stat => {
        html += `
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">${stat.name}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${stat.meals}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">৳ ${stat.deposited.toFixed(2)}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">৳ ${stat.cost.toFixed(2)}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">৳ ${stat.balance.toFixed(2)}</td>
          </tr>
        `;
      });
    } else {
      html += `<tr><td colspan="5" style="padding: 10px; border: 1px solid #ddd; text-align: center;">No member data available</td></tr>`;
    }

    html += `
        </table>
      </div>
    `;

    template.innerHTML = html;
    template.style.display = 'block';

    const opt = {
      margin:       1,
      filename:     `messify-report-${cycleData.yearMonth}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    await html2pdf().from(template).set(opt).save();
    template.style.display = 'none';
    
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'PDF Downloaded', showConfirmButton: false, timer: 3000 });
  } catch (error) {
    console.error('PDF Generation Error:', error);
    Swal.fire('Error', 'Failed to generate PDF report', 'error');
  }
}
