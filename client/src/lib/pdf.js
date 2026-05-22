import { format } from 'date-fns';

export const generateReceiptPDF = (order, items, payments) => {
  const totalCost = items.reduce((sum, item) => sum + (item.total_price || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const balance = totalCost - totalPaid;

  const html = `
    <!DOCTYPE html>
    <html lang="uk">
    <head>
      <meta charset="UTF-8">
      <title>Квитанція №${order.order_number}</title>
      <style>
        body { font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #000; padding: 20px; font-size: 14px; line-height: 1.5; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 24px; }
        .company-info { text-align: right; font-size: 12px; }
        .section { margin-bottom: 20px; }
        .section-title { font-weight: bold; border-bottom: 1px solid #ccc; margin-bottom: 10px; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { text-align: left; padding: 8px; border-bottom: 1px solid #eee; }
        th { font-weight: bold; }
        .totals { text-align: right; margin-top: 10px; }
        .totals p { margin: 5px 0; }
        .totals .bold { font-weight: bold; font-size: 16px; }
        .footer { margin-top: 50px; font-size: 12px; text-align: center; }
        .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
        .signature-line { width: 45%; border-top: 1px solid #000; text-align: center; padding-top: 5px; }
        @media print {
          @page { margin: 1cm; }
          body { -webkit-print-color-adjust: exact; padding: 0; }
        }
      </style>
    </head>
    <body onload="window.print(); window.onafterprint = function(){ window.close(); }">
      <div class="header">
        <div>
          <h1>Квитанція / Invoice</h1>
          <p>№ ${order.order_number} від ${format(new Date(order.created_at), 'dd.MM.yyyy')}</p>
        </div>
        <div class="company-info">
          <strong>LabRepair Shop</strong><br/>
          support@labrepair.ua<br/>
          +380 (50) 123-45-67
        </div>
      </div>

      <div class="section" style="display: flex; justify-content: space-between;">
        <div>
          <div class="section-title">Пристрій:</div>
          <p><strong>${order.brand} ${order.model}</strong></p>
          <p>S/N: ${order.serial_or_model || 'Не вказано'}</p>
        </div>
        <div style="text-align: right;">
          <div class="section-title">Клієнт:</div>
          <p><strong>${order.first_name || ''} ${order.last_name || ''}</strong></p>
          <p>${order.phone || ''}</p>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Послуги та Деталі</div>
        <table>
          <thead>
            <tr>
              <th>Найменування</th>
              <th style="text-align: right;">Кіл-ть</th>
              <th style="text-align: right;">Ціна (₴)</th>
              <th style="text-align: right;">Сума (₴)</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td style="text-align: right;">${item.quantity}</td>
                <td style="text-align: right;">${item.unit_price}</td>
                <td style="text-align: right;">${item.total_price}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="totals">
          <p class="bold">Загальна сума: ${totalCost} ₴</p>
        </div>
      </div>

      ${payments.length > 0 ? `
      <div class="section">
        <div class="section-title">Історія платежів</div>
        <table>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Метод</th>
              <th style="text-align: right;">Сума (₴)</th>
            </tr>
          </thead>
          <tbody>
            ${payments.map(p => `
              <tr>
                <td>${format(new Date(p.paid_at), 'dd.MM.yyyy')}</td>
                <td>${{cash: 'Готівка', card: 'Картка', transfer: 'Переказ'}[p.method] || p.method}</td>
                <td style="text-align: right;">${p.amount}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="totals">
          <p class="bold">Сплачено: ${totalPaid} ₴</p>
          ${balance > 0 ? `<p class="bold" style="color: #ef4444;">До сплати: ${balance} ₴</p>` : ''}
        </div>
      </div>
      ` : ''}

      <div class="signatures">
        <div class="signature-line">Підпис майстра</div>
        <div class="signature-line">Підпис клієнта</div>
      </div>

      <div class="footer">
        Дякуємо, що обрали LabRepair!
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    alert("Будь ласка, дозвольте спливаючі вікна для друку квитанції.");
  }
};
