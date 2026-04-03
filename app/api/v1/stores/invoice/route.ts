import { connectDb } from "@/lib/db/db";
import { Store, Membership } from "@/models";
import { getPartnerFromRequest } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

// ─── helpers ────────────────────────────────────────────────────────────────

const toTitle = (s: string) =>
  s.replace(
    /\w\S*/g,
    (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
  );

const fmtDate = (d: any) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "N/A";

const fmtINR = (n: number) =>
  "INR " +
  n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// ─── route ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const partner = getPartnerFromRequest(req);
    if (!partner)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDb();

    const storeId = req.nextUrl.searchParams.get("storeId");
    if (!storeId || !Types.ObjectId.isValid(storeId))
      return NextResponse.json(
        { message: "Invalid store ID" },
        { status: 400 },
      );

    const store = (await Store.findById(storeId)
      .select("-password")
      .lean()) as any;
    if (!store)
      return NextResponse.json({ message: "Store not found" }, { status: 404 });

    if (store.partnerUserId?.toString() !== partner.id)
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const membership = (await Membership.findOne({
      storeId: new Types.ObjectId(storeId),
    })
      .sort({ payment_date: -1 })
      .lean()) as any;

    if (!membership)
      return NextResponse.json(
        { message: "No payment found for this store" },
        { status: 404 },
      );

    // ── data ─────────────────────────────────────────────────
    const addr = store.address || {};
    const addrParts = [
      addr.addressLine1,
      addr.addressLine2,
      addr.locality,
      addr.pincode && addr.state
        ? `${addr.pincode}, ${addr.state}`
        : addr.pincode || addr.state,
    ].filter(Boolean) as string[];

    const storeName = toTitle(store.name || "");
    const invoiceNo = `MFLX-${String(membership._id).slice(-8).toUpperCase()}`;
    const issueDate = fmtDate(membership.payment_date);
    const validUntil = fmtDate(membership.subscription_end_date);
    const duration = membership.duration || 365;
    const amountPaid = membership.amount_paid || 0;
    const discount = membership.discount || 0;
    const payMode = toTitle(membership.payment_mode || "N/A");
    const licenseNo = (store.licenseNumber || "N/A").toUpperCase();

    // ── colours ──────────────────────────────────────────────
    const C = {
      teal: "#008080",
      tealDark: "#005f5f",
      tealLight: "#e0f2f1",
      ink: "#111827",
      slate: "#374151",
      muted: "#6b7280",
      hairline: "#e5e7eb",
      offwhite: "#f9fafb",
      white: "#ffffff",
      green: "#15803d",
      greenBg: "#dcfce7",
    };

    // ── build pdf ────────────────────────────────────────────
    const chunks: Buffer[] = [];

    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({
        margin: 0,
        size: "A4",
        info: {
          Title: `Invoice ${invoiceNo} — ${storeName}`,
          Author: "MediFlux Partner Portal",
        },
      });

      doc.on("data", (c) => chunks.push(c));
      doc.on("end", resolve);
      doc.on("error", reject);

      const W = doc.page.width; // 595.28
      const H = doc.page.height; // 841.89
      const LM = 52; // left margin
      const RM = W - 52; // right edge
      const CW = RM - LM; // content width

      // ════════════════════════════════════════════════════════
      // 1. FULL-PAGE BACKGROUND
      // ════════════════════════════════════════════════════════
      doc.rect(0, 0, W, H).fillColor(C.white).fill();

      // Left teal sidebar stripe
      doc.rect(0, 0, 5, H).fillColor(C.teal).fill();

      // ════════════════════════════════════════════════════════
      // 2. HEADER  (logo left · invoice meta right)
      // ════════════════════════════════════════════════════════
      const headerTop = 44;

      // Logo
      const logoPath = path.join(process.cwd(), "public", "image.png");
      const logoH = 44;
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, LM, headerTop, { width: logoH, height: logoH });
      }

      // Brand name + tagline immediately beside logo (8px gap)
      const brandX = LM + logoH + 4;
      const nameY = headerTop + 4;
      const tagY = headerTop + logoH - 14;

      doc
        .fontSize(34)
        .fillColor(C.teal)
        .font("Helvetica-Bold")
        .text("MEDIFLUX", brandX, nameY);
      doc
        .fontSize(8)
        .fillColor(C.muted)
        .font("Helvetica")
        .text("Har Smart Pharmacy Ki Pehchaan", brandX, tagY);

      // Right side — INVOICE label + meta
      doc
        .fontSize(32)
        .fillColor(C.ink)
        .font("Helvetica-Bold")
        .text("INVOICE", 0, headerTop + 4, { align: "right", width: RM });

      doc
        .fontSize(8.5)
        .fillColor(C.muted)
        .font("Helvetica")
        .text(`Invoice No.   ${invoiceNo}`, 0, headerTop + 46, {
          align: "right",
          width: RM,
        })
        .text(`Issue Date     ${issueDate}`, 0, headerTop + 59, {
          align: "right",
          width: RM,
        });

      // Hairline separator
      const sepY = headerTop + 84;
      doc
        .moveTo(LM, sepY)
        .lineTo(RM, sepY)
        .strokeColor(C.teal)
        .lineWidth(1.5)
        .stroke();

      // ════════════════════════════════════════════════════════
      // 3. BILLED TO  +  INVOICE DETAILS
      // ════════════════════════════════════════════════════════
      const infoY = sepY + 24;
      const colW = CW / 2 - 12;
      const c2X = LM + colW + 24;

      // ── Billed To ─────────────────────────────────────────
      doc
        .fontSize(7)
        .fillColor(C.teal)
        .font("Helvetica-Bold")
        .text("BILLED TO", LM, infoY);

      doc
        .fontSize(13)
        .fillColor(C.ink)
        .font("Helvetica-Bold")
        .text(storeName, LM, infoY + 12, { width: colW });

      let ly = infoY + 30;
      if (store.email) {
        doc
          .fontSize(8.5)
          .fillColor(C.slate)
          .font("Helvetica")
          .text(store.email.toLowerCase(), LM, ly, { width: colW });
        ly += 13;
      }
      if (store.phone) {
        doc
          .fontSize(8.5)
          .fillColor(C.slate)
          .font("Helvetica")
          .text(store.phone, LM, ly, { width: colW });
        ly += 13;
      }
      if (addrParts.length) {
        ly += 4;
        addrParts.forEach((line) => {
          doc
            .fontSize(8)
            .fillColor(C.muted)
            .font("Helvetica")
            .text(toTitle(line), LM, ly, { width: colW });
          ly += 12;
        });
      }
      if (store.gstin) {
        ly += 2;
        doc
          .fontSize(7.5)
          .fillColor(C.muted)
          .font("Helvetica")
          .text(`GSTIN: ${store.gstin.toUpperCase()}`, LM, ly, { width: colW });
      }

      // ── Invoice Details ────────────────────────────────────
      doc
        .fontSize(7)
        .fillColor(C.teal)
        .font("Helvetica-Bold")
        .text("INVOICE DETAILS", c2X, infoY);

      const kv = (label: string, value: string, y: number) => {
        doc
          .fontSize(7.5)
          .fillColor(C.muted)
          .font("Helvetica")
          .text(label, c2X, y, { width: colW });
        doc
          .fontSize(9.5)
          .fillColor(C.ink)
          .font("Helvetica-Bold")
          .text(value, c2X, y + 10, { width: colW });
      };

      kv("LICENSE NUMBER", licenseNo, infoY + 12);
      kv("VALID FROM", issueDate, infoY + 40);
      kv("VALID UNTIL", validUntil, infoY + 68);
      kv("DURATION", `${duration} Days`, infoY + 96);

      // PAID badge
      const bW = 52;
      const bH = 20;
      const bX = RM - bW;
      const bY = infoY + 96;
      doc.roundedRect(bX, bY, bW, bH, 10).fillColor(C.greenBg).fill();
      doc
        .fontSize(8.5)
        .fillColor(C.green)
        .font("Helvetica-Bold")
        .text("PAID", bX, bY + 5, { width: bW, align: "center" });

      // ════════════════════════════════════════════════════════
      // 4. LINE ITEMS TABLE
      // ════════════════════════════════════════════════════════
      const tableY = infoY + 136;

      // Column definitions
      const COL = {
        desc: { x: LM, w: 200 },
        period: { x: LM + 200, w: 90 },
        mode: { x: LM + 290, w: 100 },
        amount: { x: LM + 390, w: CW - 390 },
      };

      // Header row
      const thH = 28;
      doc.rect(LM, tableY, CW, thH).fillColor(C.teal).fill();

      const th = (t: string, x: number, w: number) =>
        doc
          .fontSize(7.5)
          .fillColor(C.white)
          .font("Helvetica-Bold")
          .text(t, x + 10, tableY + 9, { width: w - 10 });

      th("DESCRIPTION", COL.desc.x, COL.desc.w);
      th("PERIOD", COL.period.x, COL.period.w);
      th("PAYMENT MODE", COL.mode.x, COL.mode.w);
      th("AMOUNT", COL.amount.x, COL.amount.w);

      // Item row
      const rowH = 36;
      const r1Y = tableY + thH;
      doc.rect(LM, r1Y, CW, rowH).fillColor(C.offwhite).fill();
      doc
        .moveTo(LM, r1Y + rowH)
        .lineTo(RM, r1Y + rowH)
        .strokeColor(C.hairline)
        .lineWidth(0.5)
        .stroke();

      const td = (t: string, x: number, w: number, y: number, bold = false) =>
        doc
          .fontSize(9)
          .fillColor(C.ink)
          .font(bold ? "Helvetica-Bold" : "Helvetica")
          .text(t, x + 10, y + 12, { width: w - 10 });

      td("MediFlux Annual Subscription", COL.desc.x, COL.desc.w, r1Y);
      td(`${duration} Days`, COL.period.x, COL.period.w, r1Y);
      td(payMode, COL.mode.x, COL.mode.w, r1Y);
      td(fmtINR(amountPaid), COL.amount.x, COL.amount.w, r1Y, true);

      let nextY = r1Y + rowH;

      // Discount row
      if (discount > 0) {
        doc.rect(LM, nextY, CW, 30).fillColor(C.white).fill();
        doc
          .fontSize(9)
          .fillColor(C.slate)
          .font("Helvetica")
          .text(
            `Discount${membership.discount_reason ? ` — ${toTitle(membership.discount_reason)}` : ""}`,
            COL.desc.x + 10,
            nextY + 9,
            { width: COL.desc.w + COL.period.w + COL.mode.w - 10 },
          );
        doc
          .fontSize(9)
          .fillColor(C.green)
          .font("Helvetica-Bold")
          .text(`- ${fmtINR(discount)}`, COL.amount.x + 10, nextY + 9, {
            width: COL.amount.w - 10,
          });
        doc
          .moveTo(LM, nextY + 30)
          .lineTo(RM, nextY + 30)
          .strokeColor(C.hairline)
          .lineWidth(0.5)
          .stroke();
        nextY += 30;
      }

      // Total row
      const totH = 44;
      doc.rect(LM, nextY, CW, totH).fillColor(C.ink).fill();
      doc.rect(LM, nextY, 4, totH).fillColor(C.teal).fill();

      doc
        .fontSize(9)
        .fillColor(C.white)
        .font("Helvetica-Bold")
        .text("TOTAL AMOUNT PAID", COL.desc.x + 14, nextY + 10);
      doc
        .fontSize(8)
        .fillColor(C.white)
        .font("Helvetica")
        .text("Inclusive of all applicable taxes", COL.desc.x + 14, nextY + 24);
      doc
        .fontSize(16)
        .fillColor(C.white)
        .font("Helvetica-Bold")
        .text(`INR  ${amountPaid}`, COL.amount.x + 10, nextY + 13, {
          width: COL.amount.w - 10,
        });

      nextY += totH;

      // ════════════════════════════════════════════════════════
      // 5. NOTE
      // ════════════════════════════════════════════════════════
      const noteY = nextY + 28;
      doc.rect(LM, noteY, CW, 50).fillColor(C.tealLight).fill();
      doc.rect(LM, noteY, 3, 50).fillColor(C.teal).fill();

      doc
        .fontSize(7.5)
        .fillColor(C.tealDark)
        .font("Helvetica-Bold")
        .text("NOTE", LM + 14, noteY + 10);
      doc
        .fontSize(8)
        .fillColor(C.slate)
        .font("Helvetica")
        .text(
          "This is a system-generated invoice and is valid without a physical signature. " +
            "For any billing queries, please quote the invoice number and reach out to our support team.",
          LM + 14,
          noteY + 22,
          { width: CW - 28 },
        );

      // ════════════════════════════════════════════════════════
      // 6. FOOTER
      // ════════════════════════════════════════════════════════
      const footerH = 64;
      const footerY = H - footerH;

      doc.rect(0, footerY, W, footerH).fillColor(C.ink).fill();
      doc.rect(0, footerY, W, 2).fillColor(C.teal).fill();

      // Left — brand
      doc
        .fontSize(10)
        .fillColor(C.white)
        .font("Helvetica-Bold")
        .text("MediFlux", LM, footerY + 14);
      doc
        .fontSize(8.5)
        .fillColor(C.white)
        .font("Helvetica")
        .text("Har Smart Pharmacy Ki Pehchaan", LM, footerY + 28)
        .text("www.mediflux.in", LM, footerY + 41);

      // Centre — contact
      doc
        .fontSize(8.5)
        .fillColor(C.white)
        .font("Helvetica")
        .text("support@mflx.in", 0, footerY + 20, { align: "center", width: W })
        .text("+91 91036 67857", 0, footerY + 34, {
          align: "center",
          width: W,
        });

      // Right — invoice ref
      doc
        .fontSize(8.5)
        .fillColor(C.white)
        .font("Helvetica")
        .text(invoiceNo, 0, footerY + 20, { align: "right", width: RM })
        .text(
          `Generated ${new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })} IST`,
          0,
          footerY + 34,
          { align: "right", width: RM },
        );

      doc.end();
    });

    const pdfBuffer = Buffer.concat(chunks);
    const safeName = storeName
      .replace(/[^a-zA-Z0-9]/g, "-")
      .replace(/-+/g, "-");
    const filename = `MediFlux-Invoice-${invoiceNo}-${safeName}.pdf`;

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
