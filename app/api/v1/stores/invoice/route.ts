import { connectDb } from "@/lib/db/db";
import { Store, Membership } from "@/models";
import { getPartnerFromRequest } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

function formatDate(date: any) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export async function GET(req: NextRequest) {
  try {
    const partner = getPartnerFromRequest(req);
    if (!partner) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    const storeId = req.nextUrl.searchParams.get("storeId");
    if (!storeId || !Types.ObjectId.isValid(storeId)) {
      return NextResponse.json(
        { message: "Invalid store ID" },
        { status: 400 },
      );
    }

    const store = (await Store.findById(storeId)
      .select("-password")
      .lean()) as any;
    if (!store) {
      return NextResponse.json({ message: "Store not found" }, { status: 404 });
    }

    if (store.partnerUserId?.toString() !== partner.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const membership = (await Membership.findOne({
      storeId: new Types.ObjectId(storeId),
    })
      .sort({ payment_date: -1 })
      .lean()) as any;

    if (!membership) {
      return NextResponse.json(
        { message: "No payment found for this store" },
        { status: 404 },
      );
    }

    const addr = store.address || {};
    const addressLines = [
      addr.addressLine1,
      addr.addressLine2,
      addr.locality,
      addr.pincode && addr.state
        ? `${addr.pincode}, ${addr.state}`
        : addr.pincode || addr.state,
    ].filter(Boolean) as string[];

    const paymentDate = formatDate(membership.payment_date);
    const endDate = formatDate(membership.subscription_end_date);
    const amountPaid = (membership.amount_paid || 0).toLocaleString("en-IN");
    const discount = membership.discount || 0;

    // ── Palette ──────────────────────────────────────────────
    const INK = "#0f172a"; // near-black
    const TEAL = "#008080"; // brand teal
    const TEAL_DARK = "#006666";
    const MUTED = "#64748b";
    const LIGHT_BG = "#f8fafc";
    const BORDER = "#e2e8f0";
    const WHITE = "#ffffff";
    const GREEN_BG = "#dcfce7";
    const GREEN_FG = "#15803d";

    const chunks: Buffer[] = [];

    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 0, size: "A4" });
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", resolve);
      doc.on("error", reject);

      const W = doc.page.width; // 595.28
      const H = doc.page.height; // 841.89
      const PAD = 48;

      // ── Hero header band ─────────────────────────────────────
      doc.rect(0, 0, W, 160).fillColor(INK).fill();

      // Decorative teal accent bar (left edge)
      doc.rect(0, 0, 6, 160).fillColor(TEAL).fill();

      // Logo
      const logoPath = path.join(process.cwd(), "public", "image.png");
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, PAD, 38, { height: 64, fit: [160, 64] });
      } else {
        doc
          .fontSize(26)
          .fillColor(WHITE)
          .font("Helvetica-Bold")
          .text("Mediflux", PAD, 44);
      }

      // Tagline
      doc
        .fontSize(10)
        .fillColor(TEAL)
        .font("Helvetica")
        .text("Subscription Invoice", PAD, 112);

      // "INVOICE" label on the right
      doc
        .fontSize(36)
        .fillColor(WHITE)
        .font("Helvetica-Bold")
        .text("INVOICE", 0, 40, { align: "right", width: W - PAD });

      // Invoice meta (right-aligned)
      const invoiceNo = `INV-${String(store._id).slice(-6).toUpperCase()}`;
      doc
        .fontSize(9)
        .fillColor(MUTED)
        .font("Helvetica")
        .text(`Invoice No: ${invoiceNo}`, 0, 84, {
          align: "right",
          width: W - PAD,
        })
        .text(`Date: ${paymentDate}`, 0, 98, {
          align: "right",
          width: W - PAD,
        });

      // ── Teal accent strip below header ───────────────────────
      doc.rect(0, 160, W, 4).fillColor(TEAL).fill();

      // ── Body background ──────────────────────────────────────
      doc
        .rect(0, 164, W, H - 164)
        .fillColor(LIGHT_BG)
        .fill();

      // ── Two-column info section ───────────────────────────────
      const infoY = 192;
      const col1X = PAD;
      const col2X = W / 2 + 12;
      const colW = W / 2 - PAD - 12;

      // Card backgrounds
      doc.roundedRect(col1X, infoY, colW, 148, 8).fillColor(WHITE).fill();
      doc.roundedRect(col2X, infoY, colW, 148, 8).fillColor(WHITE).fill();

      // Left card — Billed To
      doc
        .fontSize(8)
        .fillColor(TEAL)
        .font("Helvetica-Bold")
        .text("BILLED TO", col1X + 16, infoY + 16);
      doc
        .moveTo(col1X + 16, infoY + 28)
        .lineTo(col1X + colW - 16, infoY + 28)
        .strokeColor(BORDER)
        .lineWidth(1)
        .stroke();

      doc
        .fontSize(14)
        .fillColor(INK)
        .font("Helvetica-Bold")
        .text(store.name, col1X + 16, infoY + 36, { width: colW - 32 });
      doc
        .fontSize(10)
        .fillColor(MUTED)
        .font("Helvetica")
        .text(store.email || "", col1X + 16, infoY + 56, { width: colW - 32 });
      if (store.phone)
        doc.text(store.phone, col1X + 16, infoY + 70, { width: colW - 32 });

      let addrY = infoY + (store.phone ? 86 : 72);
      addressLines.forEach((line) => {
        doc
          .fontSize(9)
          .fillColor(MUTED)
          .text(line, col1X + 16, addrY, { width: colW - 32 });
        addrY += 13;
      });
      if (store.gstin)
        doc
          .fontSize(8)
          .fillColor(MUTED)
          .text(`GSTIN: ${store.gstin}`, col1X + 16, addrY, {
            width: colW - 32,
          });

      // Right card — Subscription Details
      doc
        .fontSize(8)
        .fillColor(TEAL)
        .font("Helvetica-Bold")
        .text("SUBSCRIPTION DETAILS", col2X + 16, infoY + 16);
      doc
        .moveTo(col2X + 16, infoY + 28)
        .lineTo(col2X + colW - 16, infoY + 28)
        .strokeColor(BORDER)
        .lineWidth(1)
        .stroke();

      const detail = (label: string, value: string, y: number) => {
        doc
          .fontSize(8)
          .fillColor(MUTED)
          .font("Helvetica")
          .text(label, col2X + 16, y);
        doc
          .fontSize(11)
          .fillColor(INK)
          .font("Helvetica-Bold")
          .text(value, col2X + 16, y + 11, { width: colW - 32 });
      };

      detail("LICENSE NUMBER", store.licenseNumber || "N/A", infoY + 36);
      detail("VALID FROM", paymentDate, infoY + 72);
      detail("VALID UNTIL", endDate, infoY + 108);

      // PAID badge
      const badgeX = col2X + colW - 72;
      const badgeY = infoY + 112;
      doc.roundedRect(badgeX, badgeY, 56, 20, 10).fillColor(GREEN_BG).fill();
      doc
        .fontSize(9)
        .fillColor(GREEN_FG)
        .font("Helvetica-Bold")
        .text("✓  PAID", badgeX, badgeY + 5, { width: 56, align: "center" });

      // ── Items table ───────────────────────────────────────────
      const tableY = infoY + 164;
      const tableW = W - PAD * 2;
      const cols = {
        desc: { x: PAD, w: 220 },
        dur: { x: PAD + 220, w: 90 },
        mode: { x: PAD + 310, w: 110 },
        amount: { x: PAD + 420, w: tableW - 420 },
      };

      // Table header
      doc.rect(PAD, tableY, tableW, 32).fillColor(INK).fill();
      doc.rect(PAD, tableY, 4, 32).fillColor(TEAL).fill(); // left accent

      const thStyle = () =>
        doc.fontSize(9).fillColor(WHITE).font("Helvetica-Bold");
      thStyle().text("DESCRIPTION", cols.desc.x + 12, tableY + 10);
      thStyle().text("DURATION", cols.dur.x + 8, tableY + 10);
      thStyle().text("PAYMENT MODE", cols.mode.x + 8, tableY + 10);
      thStyle().text("AMOUNT", cols.amount.x + 8, tableY + 10);

      // Row 1
      const row1Y = tableY + 32;
      doc.rect(PAD, row1Y, tableW, 36).fillColor(WHITE).fill();
      const tdStyle = () => doc.fontSize(10).fillColor(INK).font("Helvetica");
      tdStyle().text("Mediflux Subscription", cols.desc.x + 12, row1Y + 12);
      tdStyle().text(
        `${membership.duration || 365} days`,
        cols.dur.x + 8,
        row1Y + 12,
      );
      tdStyle().text(
        (membership.payment_mode || "N/A").replace(/^\w/, (c: string) =>
          c.toUpperCase(),
        ),
        cols.mode.x + 8,
        row1Y + 12,
      );
      doc
        .fontSize(10)
        .fillColor(INK)
        .font("Helvetica-Bold")
        .text(`Rs. ${amountPaid}`, cols.amount.x + 8, row1Y + 12);
      doc
        .moveTo(PAD, row1Y + 36)
        .lineTo(PAD + tableW, row1Y + 36)
        .strokeColor(BORDER)
        .lineWidth(0.5)
        .stroke();

      let nextY = row1Y + 36;

      // Discount row
      if (discount > 0) {
        doc.rect(PAD, nextY, tableW, 32).fillColor(LIGHT_BG).fill();
        doc
          .fontSize(10)
          .fillColor(MUTED)
          .font("Helvetica")
          .text(
            `Discount${membership.discount_reason ? ` — ${membership.discount_reason}` : ""}`,
            cols.desc.x + 12,
            nextY + 10,
            { width: cols.desc.w + cols.dur.w + cols.mode.w - 12 },
          );
        doc
          .fontSize(10)
          .fillColor(GREEN_FG)
          .font("Helvetica-Bold")
          .text(
            `-Rs. ${discount.toLocaleString("en-IN")}`,
            cols.amount.x + 8,
            nextY + 10,
          );
        doc
          .moveTo(PAD, nextY + 32)
          .lineTo(PAD + tableW, nextY + 32)
          .strokeColor(BORDER)
          .lineWidth(0.5)
          .stroke();
        nextY += 32;
      }

      // Total row
      const totalH = 44;
      doc.rect(PAD, nextY, tableW, totalH).fillColor(TEAL).fill();
      doc.rect(PAD, nextY, 4, totalH).fillColor(TEAL_DARK).fill();
      doc
        .fontSize(12)
        .fillColor(WHITE)
        .font("Helvetica-Bold")
        .text("TOTAL PAID (inc. of taxes)", cols.desc.x + 12, nextY + 14);
      doc
        .fontSize(16)
        .fillColor(WHITE)
        .font("Helvetica-Bold")
        .text(`Rs. ${amountPaid}`, cols.amount.x + 8, nextY + 12);

      nextY += totalH;

      // ── Notes / Thank-you strip ───────────────────────────────
      const noteY = nextY + 32;
      doc.roundedRect(PAD, noteY, tableW, 48, 8).fillColor(WHITE).fill();
      doc
        .fontSize(9)
        .fillColor(MUTED)
        .font("Helvetica")
        .text(
          "Thank you for partnering with Mediflux. This is a computer-generated invoice and does not require a signature.",
          PAD + 16,
          noteY + 16,
          { width: tableW - 32, align: "center" },
        );

      // ── Footer bar ────────────────────────────────────────────
      doc
        .rect(0, H - 40, W, 40)
        .fillColor(INK)
        .fill();
      doc
        .rect(0, H - 40, W, 3)
        .fillColor(TEAL)
        .fill();
      doc
        .fontSize(8)
        .fillColor(MUTED)
        .font("Helvetica")
        .text("mediflux.in  ·  support@mediflux.in", 0, H - 22, {
          align: "center",
          width: W,
        });

      doc.end();
    });

    const pdfBuffer = Buffer.concat(chunks);
    const filename = `invoice-${store.name.replace(/\s+/g, "-")}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to generate invoice",
      },
      { status: 500 },
    );
  }
}
