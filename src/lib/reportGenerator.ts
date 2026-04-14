import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Client } from '@/data/mockData';
import { escapeHtml, sanitizeNumber } from './htmlSanitizer';

export async function generateClientReport(client: Client, period: string) {
  try {
    // Calculate client totals from channels - this should be the most up-to-date data
    const totalContacts = client.channels.reduce((sum, ch) => sum + ch.contacts, 0);
    const totalLeads = client.channels.reduce((sum, ch) => sum + ch.qualifiedLeads, 0);
    const totalMeetings = client.channels.reduce((sum, ch) => sum + ch.meetings, 0);
    const totalProposals = client.channels.reduce((sum, ch) => sum + ch.proposals, 0);
    const totalSales = client.channels.reduce((sum, ch) => sum + ch.sales, 0);
    const totalRevenue = client.channels.reduce((sum, ch) => sum + ch.revenue, 0);
    
    // Create a temporary div for the report
    const reportElement = document.createElement('div');
    reportElement.style.width = '794px'; // A4 width in pixels at 96 DPI
    reportElement.style.minHeight = '1123px'; // A4 height in pixels at 96 DPI
    reportElement.style.backgroundColor = '#ffffff'; // White background
    reportElement.style.color = '#000000';
    reportElement.style.fontFamily = 'Arial, sans-serif';
    reportElement.style.position = 'absolute';
    reportElement.style.left = '-9999px';
    reportElement.style.top = '0';
    
    const periodLabel = {
      monthly: 'Mensal',
      quarterly: 'Trimestral', 
      yearly: 'Anual'
    }[period] || 'Mensal';

    reportElement.innerHTML = `
      <div style="padding: 40px; height: 100%; display: flex; flex-direction: column;">
        <!-- Header -->
        <div style="background: #000000; display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 2px solid #000000; padding: 20px; border-radius: 12px;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <img src="/src/assets/bp-group-logo-final.png" alt="BP Group Logo" style="height: 48px; object-fit: contain;" />
            <div>
              <h1 style="color: #ffffff; font-size: 32px; margin: 0; font-weight: bold;">BP GROUP</h1>
              <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 16px;">Relatório ${escapeHtml(periodLabel)}</p>
            </div>
          </div>
          <div style="text-align: right;">
            <p style="color: #94a3b8; margin: 0; font-size: 14px;">${new Date().toLocaleDateString('pt-BR')}</p>
            <p style="color: #ffffff; margin: 4px 0 0 0; font-size: 18px; font-weight: bold;">${escapeHtml(client.name)}</p>
          </div>
        </div>

        <!-- KPIs Section -->
        <div style="margin-bottom: 40px;">
          <h2 style="color: #000000; font-size: 24px; margin: 0 0 20px 0;">Indicadores de Performance</h2>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
            <div style="background: linear-gradient(135deg, #f8fafc, #e2e8f0); padding: 20px; border-radius: 12px; border: 1px solid #cbd5e1;">
              <div style="color: #000000; font-size: 14px; margin-bottom: 8px;">LEADS GERADOS</div>
              <div style="color: #1e293b; font-size: 24px; font-weight: bold;">${sanitizeNumber(totalLeads)}</div>
              <div style="color: #10b981; font-size: 12px;">+${sanitizeNumber(client.conversionRate)}%</div>
            </div>
            <div style="background: linear-gradient(135deg, #f8fafc, #e2e8f0); padding: 20px; border-radius: 12px; border: 1px solid #cbd5e1;">
              <div style="color: #000000; font-size: 14px; margin-bottom: 8px;">PROPOSTAS</div>
              <div style="color: #1e293b; font-size: 24px; font-weight: bold;">${sanitizeNumber(totalProposals)}</div>
              <div style="color: #10b981; font-size: 12px;">Negociações</div>
            </div>
            <div style="background: linear-gradient(135deg, #f8fafc, #e2e8f0); padding: 20px; border-radius: 12px; border: 1px solid #cbd5e1;">
              <div style="color: #000000; font-size: 14px; margin-bottom: 8px;">VENDAS</div>
              <div style="color: #1e293b; font-size: 24px; font-weight: bold;">${sanitizeNumber(totalSales)}</div>
              <div style="color: #10b981; font-size: 12px;">Taxa de Conversão</div>
            </div>
            <div style="background: linear-gradient(135deg, #f8fafc, #e2e8f0); padding: 20px; border-radius: 12px; border: 1px solid #cbd5e1;">
              <div style="color: #000000; font-size: 14px; margin-bottom: 8px;">FATURAMENTO</div>
              <div style="color: #1e293b; font-size: 24px; font-weight: bold;">R$ ${totalRevenue.toLocaleString('pt-BR')}</div>
              <div style="color: #10b981; font-size: 12px;">Crescimento mensal</div>
            </div>
          </div>
        </div>

        <!-- Charts Section -->
        <div style="margin-bottom: 40px;">
          <h2 style="color: #000000; font-size: 24px; margin: 0 0 20px 0;">Gráficos de Performance</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
            <!-- Revenue Chart -->
            <div style="background: linear-gradient(135deg, #f8fafc, #e2e8f0); padding: 20px; border-radius: 12px; border: 1px solid #cbd5e1;">
              <h3 style="color: #000000; font-size: 18px; margin: 0 0 15px 0;">Receita por Canal</h3>
              <div style="height: 200px; display: flex; align-items: end; justify-content: space-around; border-bottom: 1px solid #cbd5e1;">
                ${client.channels.map((channel, index) => {
                  const barHeight = Math.max(20, (channel.revenue / Math.max(...client.channels.map(c => c.revenue))) * 150);
                  return `
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                      <div style="background: linear-gradient(180deg, #00bfff, #0080cc); width: 40px; height: ${sanitizeNumber(barHeight)}px; border-radius: 4px 4px 0 0;"></div>
                      <div style="color: #64748b; font-size: 10px; text-align: center; max-width: 50px; word-wrap: break-word;">${escapeHtml(channel.name)}</div>
                      <div style="color: #1e293b; font-size: 12px; font-weight: bold;">R$ ${(channel.revenue / 1000).toFixed(0)}k</div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
            
            <!-- Leads Chart -->
            <div style="background: linear-gradient(135deg, #f8fafc, #e2e8f0); padding: 20px; border-radius: 12px; border: 1px solid #cbd5e1;">
              <h3 style="color: #000000; font-size: 18px; margin: 0 0 15px 0;">Leads por Canal</h3>
              <div style="height: 200px; display: flex; align-items: end; justify-content: space-around; border-bottom: 1px solid #cbd5e1;">
                ${client.channels.map((channel, index) => {
                  const barHeight = Math.max(20, (channel.qualifiedLeads / Math.max(...client.channels.map(c => c.qualifiedLeads))) * 150);
                  return `
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                      <div style="background: linear-gradient(180deg, #10b981, #059669); width: 40px; height: ${sanitizeNumber(barHeight)}px; border-radius: 4px 4px 0 0;"></div>
                      <div style="color: #64748b; font-size: 10px; text-align: center; max-width: 50px; word-wrap: break-word;">${escapeHtml(channel.name)}</div>
                      <div style="color: #1e293b; font-size: 12px; font-weight: bold;">${sanitizeNumber(channel.qualifiedLeads)}</div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- Status and Analysis -->
        <div style="margin-bottom: 40px;">
          <h2 style="color: #000000; font-size: 24px; margin: 0 0 20px 0;">Análise do Cliente</h2>
          <div style="background: linear-gradient(135deg, #f8fafc, #e2e8f0); padding: 30px; border-radius: 12px; border: 1px solid #cbd5e1;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
              <div>
                <h3 style="color: #000000; font-size: 18px; margin: 0 0 15px 0;">Status Atual</h3>
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                  <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${client.status === 'active' ? '#10b981' : client.status === 'warning' ? '#f59e0b' : '#ef4444'};"></div>
                  <span style="color: #1e293b; text-transform: capitalize;">${client.status === 'active' ? 'Ativo' : client.status === 'warning' ? 'Atenção' : 'Crítico'}</span>
                </div>
                <p style="color: #64748b; margin: 15px 0 0 0; line-height: 1.5;">
                  Cliente ${escapeHtml(client.name)} apresenta ${sanitizeNumber(totalLeads)} leads qualificados, ${sanitizeNumber(totalSales)} vendas realizadas 
                  e faturamento total de R$ ${totalRevenue.toLocaleString('pt-BR')}.
                </p>
              </div>
              <div>
                <h3 style="color: #000000; font-size: 18px; margin: 0 0 15px 0;">Canais Principais</h3>
                <div style="space-y: 8px;">
                  ${client.channels.slice(0, 3).map(channel => `
                    <div style="color: #64748b; margin-bottom: 8px;">• ${escapeHtml(channel.name)}</div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="margin-top: auto; padding-top: 20px; border-top: 1px solid #cbd5e1; text-align: center;">
          <p style="color: #64748b; font-size: 12px; margin: 0;">
            Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} • BP Group Dashboard
          </p>
        </div>
      </div>
    `;

    // Add to DOM temporarily
    document.body.appendChild(reportElement);

    // Convert to canvas
    const canvas = await html2canvas(reportElement, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true
    });

    // Remove from DOM
    document.body.removeChild(reportElement);

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`relatorio-${escapeHtml(client.name).toLowerCase().replace(/\s+/g, '-')}-${escapeHtml(period)}.pdf`);

  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    throw error;
  }
}