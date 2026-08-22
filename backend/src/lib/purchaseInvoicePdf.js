import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  PDFDocument,
  rgb,
  StandardFonts,
} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generatePurchaseInvoicePdf = async (order) => {
  try {
    const customer = order.customer || {};
    const device = order.device || {};
    const payment = order.payment || {};


    // FILE PATHS


    const letterheadPath = path.resolve(
      __dirname,
      "../../assets/excart-letterhead.pdf"
    );

    const fontPath = path.resolve(
      __dirname,
      "../../assets/fonts/DejaVuSans.ttf"
    );


    // CHECK FILES


    if (!fs.existsSync(letterheadPath)) {
      throw new Error(
        `ExCart letterhead PDF not found: ${letterheadPath}`
      );
    }

    if (!fs.existsSync(fontPath)) {
      throw new Error(
        `DejaVuSans.ttf not found: ${fontPath}`
      );
    }


    // LOAD LETTERHEAD PDF


    const letterheadBytes = fs.readFileSync(
      letterheadPath
    );

    const letterheadPdf = await PDFDocument.load(
      letterheadBytes
    );

    // Use first page only
    const letterheadPage =
      letterheadPdf.getPage(0);


    // CREATE NEW PDF


    const pdfDoc = await PDFDocument.create();

    // Required for custom TTF fonts
    pdfDoc.registerFontkit(fontkit);


    // CREATE PAGE USING LETTERHEAD SIZE


    const width = letterheadPage.getWidth();
    const height = letterheadPage.getHeight();

    const page = pdfDoc.addPage([
      width,
      height,
    ]);


    // EMBED LETTERHEAD AS BACKGROUND


    const embeddedLetterhead =
      await pdfDoc.embedPage(letterheadPage);

    page.drawPage(embeddedLetterhead, {
      x: 0,
      y: 0,
      width,
      height,
    });


    // FONTS


    const fontBytes = fs.readFileSync(fontPath);

    const dejavuFont =
      await pdfDoc.embedFont(fontBytes);

    const helvetica =
      await pdfDoc.embedFont(
        StandardFonts.Helvetica
      );

    const helveticaBold =
      await pdfDoc.embedFont(
        StandardFonts.HelveticaBold
      );


    // COLORS


    const navy = rgb(
      0.08,
      0.14,
      0.23
    );

    const orange = rgb(
      0.95,
      0.35,
      0.08
    );

    const gray = rgb(
      0.22,
      0.26,
      0.32
    );

    const lightGray = rgb(
      0.96,
      0.97,
      0.98
    );

    const border = rgb(
      0.84,
      0.86,
      0.89
    );

    const green = rgb(
      0.08,
      0.50,
      0.22
    );

    const white = rgb(
      1,
      1,
      1
    );


    // HELPERS


    const formatDate = (date) => {
      if (!date) return "-";

      const parsedDate = new Date(date);

      if (Number.isNaN(parsedDate.getTime())) {
        return "-";
      }

      return parsedDate.toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }
      );
    };

    const formatAmount = (amount) => {
      return Number(amount || 0).toLocaleString(
        "en-IN"
      );
    };

    const formatPaymentMethod = (method) => {
      if (!method) return "-";

      return method
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) =>
          char.toUpperCase()
        );
    };

    const drawText = (
      text,
      x,
      y,
      size = 9,
      font = helvetica,
      color = gray
    ) => {
      page.drawText(
        String(text ?? "-"),
        {
          x,
          y,
          size,
          font,
          color,
        }
      );
    };

    const drawCenteredText = (
      text,
      y,
      size,
      font,
      color
    ) => {
      const textWidth = font.widthOfTextAtSize(
        String(text),
        size
      );

      drawText(
        text,
        (width - textWidth) / 2,
        y,
        size,
        font,
        color
      );
    };

    const drawLabelValue = (
      label,
      value,
      x,
      y,
      labelWidth = 95
    ) => {
      drawText(
        label,
        x,
        y,
        8.5,
        helveticaBold,
        navy
      );

      drawText(
        value || "-",
        x + labelWidth,
        y,
        8.5,
        helvetica,
        gray
      );
    };

    const drawSectionTitle = (
      title,
      y
    ) => {
      drawText(
        title,
        margin,
        y,
        10.5,
        helveticaBold,
        navy
      );

      page.drawLine({
        start: {
          x: margin,
          y: y - 5,
        },
        end: {
          x: width - margin,
          y: y - 5,
        },
        thickness: 0.7,
        color: border,
      });
    };


    // LAYOUT


    const margin = 55;

    let y = height - 175;


    // TITLE


    drawCenteredText(
      "PURCHASE INVOICE",
      y,
      18,
      helveticaBold,
      navy
    );

    // Orange line
    page.drawRectangle({
      x: width / 2 - 45,
      y: y - 10,
      width: 90,
      height: 3,
      color: orange,
    });

    y -= 38;


    // INVOICE SUMMARY BOX


    const summaryHeight = 55;

    page.drawRectangle({
      x: margin,
      y: y - summaryHeight,
      width: width - margin * 2,
      height: summaryHeight,
      color: white,
      borderColor: border,
      borderWidth: 0.7,
    });

    const invoiceNumber =
      order.invoiceNumber ||
      `PINV-${Date.now()}`;

    drawLabelValue(
      "Invoice No",
      invoiceNumber,
      margin + 12,
      y - 18,
      65
    );

    drawLabelValue(
      "Invoice Date",
      formatDate(
        payment.paidAt ||
          order.createdAt
      ),
      margin + 12,
      y - 38,
      65
    );

    drawLabelValue(
      "Order No",
      order.orderNumber,
      margin + 285,
      y - 18,
      55
    );

    drawLabelValue(
      "Payment",
      (
        payment.status ||
        "Pending"
      ).toUpperCase(),
      margin + 285,
      y - 38,
      55
    );

    y -= 75;


    // CUSTOMER DETAILS


    drawSectionTitle(
      "CUSTOMER DETAILS",
      y
    );

    y -= 25;

    page.drawRectangle({
      x: margin,
      y: y - 52,
      width: width - margin * 2,
      height: 52,
      color: lightGray,
    });

    drawLabelValue(
      "Name",
      customer.fullName,
      margin + 12,
      y - 16,
      45
    );

    drawLabelValue(
      "Phone",
      customer.phone,
      margin + 285,
      y - 16,
      45
    );

    drawLabelValue(
      "Email",
      customer.email,
      margin + 12,
      y - 36,
      45
    );

    y -= 72;


    // DEVICE DETAILS


    drawSectionTitle(
      "DEVICE DETAILS",
      y
    );

    y -= 25;

    const deviceRows = [
      [
        "Brand",
        device.brand || "-",
      ],
      [
        "Model",
        device.model || "-",
      ],
      [
        "Variant",
        device.variant || "-",
      ],
      [
        "Storage",
        device.storage || "-",
      ],
      [
        "Color",
        device.color || "-",
      ],
      [
        "IMEI 1",
        device.imei1 || "-",
      ],
      [
        "IMEI 2",
        device.imei2 || "-",
      ],
      [
        "Serial Number",
        device.serialNumber || "-",
      ],
    ];

    const rowHeight = 19;
    const labelWidth = 110;

    deviceRows.forEach(
      ([label, value], index) => {
        const rowY =
          y - index * rowHeight;

        if (index % 2 === 0) {
          page.drawRectangle({
            x: margin,
            y: rowY - 5,
            width: width - margin * 2,
            height: rowHeight,
            color: lightGray,
          });
        }

        drawText(
          label,
          margin + 8,
          rowY + 1,
          8.2,
          helveticaBold,
          navy
        );

        drawText(
          value,
          margin + labelWidth,
          rowY + 1,
          8.2,
          helvetica,
          gray
        );
      }
    );

    y -=
      deviceRows.length *
      rowHeight;

    y -= 25;


    // PURCHASE DETAILS


    drawSectionTitle(
      "PURCHASE DETAILS",
      y
    );

    y -= 28;

    const purchaseHeight = 72;

    page.drawRectangle({
      x: margin,
      y: y - purchaseHeight,
      width: width - margin * 2,
      height: purchaseHeight,
      color: lightGray,
      borderColor: border,
      borderWidth: 0.7,
    });

    drawLabelValue(
      "Payment Method",
      formatPaymentMethod(
        payment.paymentMethod
      ),
      margin + 15,
      y - 18,
      90
    );

    drawLabelValue(
      "Transaction ID",
      payment.transactionId,
      margin + 15,
      y - 39,
      90
    );

    drawLabelValue(
      "Payment Status",
      (
        payment.status ||
        "-"
      ).toUpperCase(),
      margin + 15,
      y - 60,
      90
    );

    y -= 92;


    // TOTAL PURCHASE VALUE


    const totalHeight = 58;

    page.drawRectangle({
      x: margin,
      y: y - totalHeight,
      width: width - margin * 2,
      height: totalHeight,
      color: rgb(
        1,
        0.97,
        0.93
      ),
      borderColor: rgb(
        0.98,
        0.78,
        0.60
      ),
      borderWidth: 0.7,
    });

    drawText(
      "TOTAL PURCHASE VALUE",
      margin + 15,
      y - 20,
      9,
      helveticaBold,
      navy
    );

    // IMPORTANT:
    // Use DejaVuSans here because Helvetica
    // does not support the ₹ symbol.

    drawText(
      `₹${formatAmount(
        payment.finalAmount
      )}`,
      margin + 15,
      y - 43,
      16,
      dejavuFont,
      orange
    );


    // PAYMENT STATUS BADGE


    const paymentStatus =
      (
        payment.status ||
        ""
      ).toLowerCase();

    if (
      paymentStatus ===
      "completed"
    ) {
      const badgeWidth = 85;
      const badgeHeight = 20;

      page.drawRectangle({
        x:
          width -
          margin -
          badgeWidth -
          15,
        y: y - 42,
        width: badgeWidth,
        height: badgeHeight,
        color: rgb(
          0.86,
          0.96,
          0.89
        ),
      });

      drawCenteredText(
        "COMPLETED",
        y - 36,
        7,
        helveticaBold,
        green
      );
    }

    y -= 82;


    // FOOTER MESSAGE


    drawCenteredText(
      "This is a system-generated purchase invoice.",
      y,
      7.5,
      helvetica,
      rgb(
        0.42,
        0.45,
        0.50
      )
    );


    // SAVE PDF


    const outputBytes =
      await pdfDoc.save();

    return Buffer.from(
      outputBytes
    );
  } catch (error) {
    console.error(
      "Purchase invoice PDF generation failed:",
      error
    );

    throw error;
  }
};