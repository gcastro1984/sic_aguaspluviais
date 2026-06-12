import nodemailer from 'nodemailer';

// ─── Mapeamento de níveis para nomes e cores ──────────────────────────────
const NIVEL_INFO = {
    1: { nome: 'Verde',     emoji: '🟢' },
    2: { nome: 'Amarelo',   emoji: '🟡' },
    3: { nome: 'Laranja',   emoji: '🟠' },
    4: { nome: 'Vermelho',  emoji: '🔴' },
};

// ─── Transporter ──────────────────────────────────────────────────────────
// Padrão do PDF: nodemailer.createTransport({ service, auth })
// Configuração adaptada por variáveis de ambiente para suportar vários serviços:
//
//   Microsoft 365:  host=smtp.office365.com  | port=587 | requireTLS=true
//                   NOTA: requer que SMTP AUTH esteja activado na conta (pode estar
//                   desactivado em contas institucionais — contactar administrador)
//
//   Gmail:          host=smtp.gmail.com       | port=587
//                   NOTA: requer App Password (conta > Segurança > Passwords de aplicação)
//
//   Mailtrap:       host=sandbox.smtp.mailtrap.io | port=2525
//                   Ideal para testes — captura emails sem os enviar de verdade
const transporter = nodemailer.createTransport({
    host:    process.env.EMAIL_HOST,
    port:    Number(process.env.EMAIL_PORT) || 587,
    secure:  false,         // false = STARTTLS; true = SSL directo (porta 465)
    requireTLS: process.env.EMAIL_HOST === 'smtp.office365.com', // obrigatório apenas no M365
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ─── Função principal de envio ────────────────────────────────────────────
// Segue o padrão do PDF: prepara mensagem → chama transporter.sendMail()
// Erros possíveis:
//   err.code === 'EENVELOPE' → endereço de email inválido
//   err.code === 'EAUTH'     → credenciais do servidor inválidas
export async function enviarEmailAlerta({ email, nome, idalerta, nivel, mensagem, score_risco }) {
    const info = NIVEL_INFO[nivel] || { nome: `Nível ${nivel}`, emoji: '⚠️' };

    // HTML template do email (recomendado: usar HTML em vez de texto simples)
    const htmlBody = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
      <div style="background:#1F3864;padding:20px 24px">
        <h2 style="color:#fff;margin:0;font-size:18px">
          ${info.emoji} Alerta SIC Águas Pluviais — Nível ${info.nome}
        </h2>
      </div>
      <div style="padding:24px">
        <p style="color:#374151;margin:0 0 12px">Olá <strong>${nome || email}</strong>,</p>
        <p style="color:#374151;margin:0 0 16px">
          Foi activado um alerta de nível <strong>${info.nome}</strong> no sistema SIC Águas Pluviais.
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px">
          <tr style="background:#f3f4f6">
            <td style="padding:8px 12px;color:#6b7280;width:40%">ID do Alerta</td>
            <td style="padding:8px 12px;color:#111827"><strong>#${idalerta}</strong></td>
          </tr>
          <tr>
            <td style="padding:8px 12px;color:#6b7280">Nível</td>
            <td style="padding:8px 12px;color:#111827"><strong>${info.emoji} ${info.nome}</strong></td>
          </tr>
          <tr style="background:#f3f4f6">
            <td style="padding:8px 12px;color:#6b7280">Score de Risco</td>
            <td style="padding:8px 12px;color:#111827"><strong>${score_risco ?? '—'} / 100</strong></td>
          </tr>
          <tr>
            <td style="padding:8px 12px;color:#6b7280">Descrição</td>
            <td style="padding:8px 12px;color:#111827">${mensagem || '—'}</td>
          </tr>
          <tr style="background:#f3f4f6">
            <td style="padding:8px 12px;color:#6b7280">Data</td>
            <td style="padding:8px 12px;color:#111827">${new Date().toLocaleString('pt-PT')}</td>
          </tr>
        </table>
        <p style="color:#6b7280;font-size:12px;margin:0">
          Este email foi gerado automaticamente pelo sistema SIC Águas Pluviais.<br>
          Não responda a este email.
        </p>
      </div>
    </div>`;

    // sendMail — padrão do PDF: { from, to, subject, html }
    await transporter.sendMail({
        from:    `"SIC Águas Pluviais" <${process.env.EMAIL_USER}>`,
        to:      email,
        subject: `${info.emoji} [SIC] Alerta Nível ${info.nome} — #${idalerta}`,
        html:    htmlBody,
        // texto simples como fallback para clientes sem suporte a HTML
        text: `Alerta SIC Águas Pluviais — Nível ${info.nome}\n\nID: #${idalerta}\nScore: ${score_risco ?? '—'}/100\nDescrição: ${mensagem || '—'}\nData: ${new Date().toLocaleString('pt-PT')}`
    });
}

// ─── Email de calibração / manutenção ─────────────────────────────────────────
export async function enviarEmailCalibracao({ email, idsensor, tipo, localizacao, data_proxima_manutencao, observacoes }) {
    const htmlBody = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
      <div style="background:#0F172A;padding:20px 24px">
        <h2 style="color:#fff;margin:0;font-size:18px">🔧 SIC Águas Pluviais — Calibração de Sensor</h2>
      </div>
      <div style="padding:24px">
        <p style="color:#374151;margin:0 0 16px">
          Foi registada uma operação de calibração/manutenção no seguinte sensor:
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px">
          <tr style="background:#f3f4f6">
            <td style="padding:8px 12px;color:#6b7280;width:40%">Sensor</td>
            <td style="padding:8px 12px;color:#111827"><strong>#${idsensor} — ${tipo}</strong></td>
          </tr>
          <tr>
            <td style="padding:8px 12px;color:#6b7280">Localização</td>
            <td style="padding:8px 12px;color:#111827">${localizacao}</td>
          </tr>
          <tr style="background:#f3f4f6">
            <td style="padding:8px 12px;color:#6b7280">Próxima Manutenção</td>
            <td style="padding:8px 12px;color:#111827"><strong>${data_proxima_manutencao || 'Não definida'}</strong></td>
          </tr>
          ${observacoes ? `<tr>
            <td style="padding:8px 12px;color:#6b7280">Observações</td>
            <td style="padding:8px 12px;color:#111827">${observacoes}</td>
          </tr>` : ''}
          <tr style="background:#f3f4f6">
            <td style="padding:8px 12px;color:#6b7280">Data do registo</td>
            <td style="padding:8px 12px;color:#111827">${new Date().toLocaleString('pt-PT')}</td>
          </tr>
        </table>
        <p style="color:#6b7280;font-size:12px;margin:0">
          Este email foi gerado automaticamente pelo sistema SIC Águas Pluviais.<br>
          Não responda a este email.
        </p>
      </div>
    </div>`;

    await transporter.sendMail({
        from:    `"SIC Águas Pluviais" <${process.env.EMAIL_USER}>`,
        to:      email,
        subject: `🔧 [SIC] Calibração do Sensor #${idsensor} — ${tipo}`,
        html:    htmlBody,
        text:    `Calibração registada — Sensor #${idsensor} (${tipo})\nLocalização: ${localizacao}\nPróxima Manutenção: ${data_proxima_manutencao || 'Não definida'}\nObservações: ${observacoes || '—'}\nData: ${new Date().toLocaleString('pt-PT')}`
    });
}
