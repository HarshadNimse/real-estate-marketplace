const { sendEmail } = require("./emailService");

function buildInquiryEmailHtml({ propertyTitle, buyerName, message, dashboardUrl }) {
  return `
    <div style="font-family:sans-serif;max-width:560px">
      <h2 style="color:#4f46e5">New inquiry on your listing</h2>
      <p><strong>Property:</strong> ${propertyTitle}</p>
      <p><strong>From:</strong> ${buyerName}</p>
      <p><strong>Message:</strong></p>
      <blockquote style="border-left:4px solid #e2e8f0;padding-left:12px;color:#334155">${message}</blockquote>
      <p><a href="${dashboardUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">View seller dashboard</a></p>
    </div>
  `;
}

async function notifySellerOfInquiry({ sellerEmail, propertyTitle, buyerName, message }) {
  const frontendBase = process.env.FRONTEND_URL || "http://localhost:5500";
  const dashboardUrl = `${frontendBase}/frontend/pages/seller-dashboard.html`;
  const html = buildInquiryEmailHtml({
    propertyTitle,
    buyerName,
    message,
    dashboardUrl,
  });
  await sendEmail({
    to: sellerEmail,
    subject: `EstateHub — New inquiry: ${propertyTitle}`,
    html,
  });
}

module.exports = { notifySellerOfInquiry };
