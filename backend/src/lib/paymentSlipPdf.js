import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generatePaymentSlipPdf = async (order) => {
  try {
    const customer = order.customer || {};
    const device = order.device || {};
    const payment = order.payment || {};

   
    // Load ExCart Letterhead PDF
   

    const letterheadPath = path.resolve(
      __dirname,
      "../../assets/excart-letterhead.pdf"
    );

    if (!fs.existsSync(letterheadPath)) {
      throw new Error(
        `ExCart letterhead PDF not found: ${letterheadPath}`
      );
    }

    const letterheadBytes = fs.readFileSync(letterheadPath);

    const letterheadPdf = await PDFDocument.load(letterheadBytes);

    // Use ONLY the first page
    const [letterheadPage] = await letterheadPdf.copyPages(
      letterheadPdf,
      [0]
    );

    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const page = pdfDoc.addPage([
      letterheadPage.getWidth(),
      letterheadPage.getHeight(),
    ]);

    const { width, height } = page.getSize();

   
    // Embed letterhead page as background
   

    const embeddedPage = await pdfDoc.embedPage(letterheadPage);

    page.drawPage(embeddedPage, {
      x: 0,
      y: 0,
      width,
      height,
    });

   
    // Fonts
   

const fontPath = path.resolve(
  __dirname,
  "../../assets/fonts/DejaVuSans.ttf"
);

if (!fs.existsSync(fontPath)) {
  throw new Error(`DejaVuSans.ttf not found: ${fontPath}`);
}

const fontBytes = fs.readFileSync(fontPath);

const regularFont = await pdfDoc.embedFont(fontBytes);
const boldFont = regularFont;

   
    // Colors
   

    const navy = rgb(0.08, 0.14, 0.23);
    const orange = rgb(0.95, 0.35, 0.08);
    const gray = rgb(0.30, 0.34, 0.40);
    const lightGray = rgb(0.96, 0.97, 0.98);
    const border = rgb(0.84, 0.86, 0.89);
    const green = rgb(0.08, 0.50, 0.22);
    const white = rgb(1, 1, 1);

    const margin = 55;

   
    // Helpers
   

    const formatDate = (date) => {
      if (!date) return "-";

      return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    };

    const formatAmount = (amount) => {
      return Number(amount || 0).toLocaleString("en-IN");
    };

    const formatPaymentMethod = (method) => {
      if (!method) return "-";

      return method
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const drawText = (
      text,
      x,
      y,
      size = 10,
      font = regularFont,
      color = gray
    ) => {
      page.drawText(String(text ?? "-"), {
        x,
        y,
        size,
        font,
        color,
      });
    };

    const drawLabelValue = (
      label,
      value,
      x,
      y,
      labelWidth = 100
    ) => {
      drawText(
        label,
        x,
        y,
        9,
        boldFont,
        navy
      );

      drawText(
        value || "-",
        x + labelWidth,
        y,
        9,
        regularFont,
        gray
      );
    };

    const drawSectionTitle = (title, y) => {
      drawText(
        title,
        margin,
        y,
        11,
        boldFont,
        navy
      );

      page.drawLine({
        start: {
          x: margin,
          y: y - 6,
        },
        end: {
          x: width - margin,
          y: y - 6,
        },
        thickness: 0.7,
        color: border,
      });
    };

   
    // TITLE
   

    let y = height - 175;

    drawText(
      "PAYMENT RECEIPT",
      margin,
      y,
      20,
      boldFont,
      navy
    );

    // Orange line under title
    page.drawRectangle({
      x: margin,
      y: y - 10,
      width: 90,
      height: 3,
      color: orange,
    });

    y -= 40;

   
    // ORDER SUMMARY
   

    page.drawRectangle({
      x: margin,
      y: y - 55,
      width: width - margin * 2,
      height: 65,
      color: lightGray,
      borderColor: border,
      borderWidth: 0.7,
    });

    drawLabelValue(
      "Order Number",
      order.orderNumber,
      margin + 12,
      y - 20
    );

    drawLabelValue(
      "Payment Date",
      formatDate(payment.paidAt),
      margin + 12,
      y - 42
    );

    drawLabelValue(
      "Transaction ID",
      payment.transactionId,
      margin + 285,
      y - 20,
      85
    );

    drawLabelValue(
      "Status",
      (payment.status || "-").toUpperCase(),
      margin + 285,
      y - 42,
      85
    );

    y -= 85;

   
    // CUSTOMER DETAILS
   

    drawSectionTitle("CUSTOMER DETAILS", y);

    y -= 28;

    drawLabelValue(
      "Name",
      customer.fullName,
      margin,
      y
    );

    drawLabelValue(
      "Phone",
      customer.phone,
      margin + 285,
      y,
      45
    );

    y -= 22;

    drawLabelValue(
      "Email",
      customer.email,
      margin,
      y
    );

    y -= 38;

   
    // DEVICE DETAILS
   

    drawSectionTitle("DEVICE DETAILS", y);

    y -= 28;

    drawLabelValue(
      "Device",
      `${device.brand || ""} ${device.model || ""}`.trim(),
      margin,
      y
    );

    drawLabelValue(
      "Variant",
      device.variant,
      margin + 285,
      y,
      55
    );

    y -= 22;

    drawLabelValue(
      "Storage",
      device.storage,
      margin,
      y
    );

    drawLabelValue(
      "Color",
      device.color,
      margin + 285,
      y,
      45
    );

    y -= 22;

    drawLabelValue(
      "IMEI 1",
      device.imei1,
      margin,
      y
    );

    y -= 22;

    drawLabelValue(
      "IMEI 2",
      device.imei2,
      margin,
      y
    );

    y -= 22;

    drawLabelValue(
      "Serial Number",
      device.serialNumber,
      margin,
      y
    );

    y -= 38;

   
    // PAYMENT DETAILS
   

    drawSectionTitle("PAYMENT DETAILS", y);

    y -= 30;

    // Payment box

    page.drawRectangle({
      x: margin,
      y: y - 105,
      width: width - margin * 2,
      height: 115,
      color: lightGray,
      borderColor: border,
      borderWidth: 0.7,
    });

    drawLabelValue(
      "Payment Method",
      formatPaymentMethod(payment.paymentMethod),
      margin + 15,
      y - 22
    );

    drawLabelValue(
      "Transaction ID",
      payment.transactionId,
      margin + 15,
      y - 45
    );

    drawLabelValue(
      "Payment Status",
      (payment.status || "-").toUpperCase(),
      margin + 15,
      y - 68
    );

    // Status badge
    const status =
      (payment.status || "").toLowerCase();

    if (status === "completed") {
      page.drawRectangle({
        x: width - margin - 100,
        y: y - 76,
        width: 85,
        height: 20,
        color: rgb(0.86, 0.96, 0.89),
      });

      drawText(
        "COMPLETED",
        width - margin - 93,
        y - 70,
        7.5,
        boldFont,
        green
      );
    }

    // Amount
    drawText(
      "AMOUNT PAID",
      width - margin - 190,
      y - 22,
      8,
      boldFont,
      navy
    );

    drawText(
      `₹ ${formatAmount(payment.finalAmount)}`,
      width - margin - 190,
      y - 47,
      17,
      boldFont,
      orange
    );

    y -= 135;

   
    // CONFIRMATION
   

    drawText(
      "This payment receipt confirms that the payment for the",
      margin,
      y,
      9,
      regularFont,
      gray
    );

    drawText(
      "above device has been successfully processed by ExCart.",
      margin,
      y - 14,
      9,
      regularFont,
      gray
    );

   
    // FOOTER
   

    drawText(
      "Generated by ExCart",
      margin,
      55,
      8,
      regularFont,
      gray
    );

    drawText(
      "This is a computer-generated payment receipt.",
      margin,
      42,
      7,
      regularFont,
      gray
    );

   
    // Save
   

    const outputBytes = await pdfDoc.save();

    return Buffer.from(outputBytes);
  } catch (error) {
    console.error(
      "Payment slip PDF generation failed:",
      error
    );

    throw error;
  }
};