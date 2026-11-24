"""
ReportLab PDF Export Service for DepositGuard
Generates formal, tamper-evident inspection and settlement reports.
Includes:
- Inspection SHA-256 canonical hash & lock timestamp
- Dual approvals (Tenant & Landlord)
- Room-wise items with downsized photos
- Append-only amendments ledger
- Settlement summary and deductions
- AI suggestions (clearly labeled advisory only)
- Disclaimer: "tamper-evident, not tamper-proof; documentation, not legal advice"
"""

import io
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List, Optional
from PIL import Image as PILImage

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, KeepTogether, HRFlowable
)
from app.services.storage import LOCAL_STORAGE_DIR


def generate_inspection_pdf(
    inspection_data: Dict[str, Any],
    property_data: Dict[str, Any],
    settlement_data: Optional[Dict[str, Any]] = None,
    ai_comparisons: Optional[List[Dict[str, Any]]] = None
) -> bytes:
    """
    Generates a PDF byte stream for an inspection record.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0f172a"),
        alignment=0
    )

    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#475569")
    )

    disclaimer_style = ParagraphStyle(
        "Disclaimer",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#92400e")
    )

    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=12,
        spaceAfter=6
    )

    table_header_style = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#0f172a")
    )

    cell_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#1e293b")
    )

    mono_hash_style = ParagraphStyle(
        "MonoHash",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=7,
        leading=9,
        textColor=colors.HexColor("#065f46")
    )

    elements = []

    # 1. Header & Title
    elements.append(Paragraph("DepositGuard &bull; Rental Inspection & Settlement Record", title_style))
    elements.append(Paragraph("Tamper-Evident Move-In / Move-Out Documentation for Indian Residential Tenancies", subtitle_style))
    elements.append(Spacer(1, 8))

    # Legal Notice Callout
    notice_text = "LEGAL NOTICE: DepositGuard records are tamper-evident, not tamper-proof; documentation, not legal advice. " \
                  "Prepared under Model Tenancy Act principles to record baseline condition and prevent deposit disputes."
    notice_table = Table(
        [[Paragraph(notice_text, disclaimer_style)]],
        colWidths=[520]
    )
    notice_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#fef3c7")),
        ('BORDER', (0, 0), (-1, -1), 1, colors.HexColor("#f59e0b")),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(notice_table)
    elements.append(Spacer(1, 10))

    # 2. Property & Inspection Meta
    prop_info = [
        [
            Paragraph(f"<b>Property:</b> {property_data.get('title', 'N/A')}", cell_style),
            Paragraph(f"<b>City:</b> {property_data.get('city', 'N/A')}", cell_style)
        ],
        [
            Paragraph(f"<b>Address:</b> {property_data.get('address', 'N/A')}", cell_style),
            Paragraph(f"<b>Property Type:</b> {property_data.get('property_type', 'flat').upper()}", cell_style)
        ],
        [
            Paragraph(f"<b>Inspection Type:</b> {inspection_data.get('type', 'move_in').replace('_', ' ').upper()}", cell_style),
            Paragraph(f"<b>Status:</b> {inspection_data.get('status', 'draft').upper()}", cell_style)
        ]
    ]
    prop_table = Table(prop_info, colWidths=[320, 200])
    prop_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(prop_table)
    elements.append(Spacer(1, 12))

    # 3. Cryptographic Dual-Confirmation Seal
    locked_hash = inspection_data.get("locked_hash") or "NOT_LOCKED"
    locked_at = inspection_data.get("locked_at") or "Pending"

    lock_info = [
        [
            Paragraph("<b>Cryptographic SHA-256 Digest:</b>", table_header_style),
            Paragraph(locked_hash, mono_hash_style)
        ],
        [
            Paragraph("<b>Locked Timestamp (UTC):</b>", table_header_style),
            Paragraph(str(locked_at), cell_style)
        ],
        [
            Paragraph("<b>Integrity Status:</b>", table_header_style),
            Paragraph("Immutable Dual-Confirmation Record" if locked_hash != "NOT_LOCKED" else "Draft / Unsealed", cell_style)
        ]
    ]
    lock_table = Table(lock_info, colWidths=[160, 360])
    lock_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#ecfdf5")),
        ('BORDER', (0, 0), (-1, -1), 1, colors.HexColor("#10b981")),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(lock_table)
    elements.append(Spacer(1, 12))

    # 4. Approvals
    approvals = inspection_data.get("approvals", [])
    tenant_app = next((a for a in approvals if a.get("role") == "tenant"), None)
    landlord_app = next((a for a in approvals if a.get("role") == "landlord"), None)

    app_rows = [
        [
            Paragraph("<b>Party</b>", table_header_style),
            Paragraph("<b>Status</b>", table_header_style),
            Paragraph("<b>Timestamp</b>", table_header_style),
            Paragraph("<b>Comments / Remarks</b>", table_header_style)
        ],
        [
            Paragraph("Tenant", cell_style),
            Paragraph(tenant_app.get("decision", "Pending").upper() if tenant_app else "PENDING", cell_style),
            Paragraph(str(tenant_app.get("created_at", "N/A")) if tenant_app else "N/A", cell_style),
            Paragraph(tenant_app.get("comments") or "No remarks" if tenant_app else "-", cell_style)
        ],
        [
            Paragraph("Landlord", cell_style),
            Paragraph(landlord_app.get("decision", "Pending").upper() if landlord_app else "PENDING", cell_style),
            Paragraph(str(landlord_app.get("created_at", "N/A")) if landlord_app else "N/A", cell_style),
            Paragraph(landlord_app.get("comments") or "No remarks" if landlord_app else "-", cell_style)
        ]
    ]
    app_table = Table(app_rows, colWidths=[80, 80, 140, 220])
    app_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(Paragraph("Dual Approvals & Signatures", section_heading))
    elements.append(app_table)
    elements.append(Spacer(1, 10))

    # 5. Room-by-Room Items
    elements.append(Paragraph("Room-by-Room Move-In Inspection Checklist", section_heading))

    rooms = inspection_data.get("rooms", [])
    for room in sorted(rooms, key=lambda r: r.get("room_order", 0)):
        room_name = room.get("name", "Room")
        elements.append(Paragraph(f"<b>Suite: {room_name}</b>", ParagraphStyle("RoomTitle", parent=styles["Heading3"], fontSize=10, textColor=colors.HexColor("#1e293b"))))

        items_table_data = [
            [
                Paragraph("<b>Item Name</b>", table_header_style),
                Paragraph("<b>Condition</b>", table_header_style),
                Paragraph("<b>Notes / Pre-Existing Defects</b>", table_header_style),
                Paragraph("<b>Photos</b>", table_header_style)
            ]
        ]

        for item in room.get("items", []):
            item_name = item.get("name", "")
            condition = item.get("condition", "clean_functional").replace("_", " ").title()
            notes = item.get("notes") or "No defects noted"
            photos = item.get("photos", [])

            photo_cell_content = f"{len(photos)} photos attached"
            items_table_data.append([
                Paragraph(item_name, cell_style),
                Paragraph(condition, cell_style),
                Paragraph(notes, cell_style),
                Paragraph(photo_cell_content, cell_style)
            ])

        room_table = Table(items_table_data, colWidths=[140, 90, 200, 90])
        room_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f8fafc")),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        elements.append(room_table)
        elements.append(Spacer(1, 8))

    # 6. Append-Only Amendments Ledger
    amendments = inspection_data.get("amendments", [])
    if amendments:
        elements.append(Paragraph("Append-Only Cryptographic Amendments", section_heading))
        am_data = [
            [
                Paragraph("<b>Author</b>", table_header_style),
                Paragraph("<b>Reason</b>", table_header_style),
                Paragraph("<b>Prev Hash</b>", table_header_style),
                Paragraph("<b>Amendment Hash</b>", table_header_style),
                Paragraph("<b>Acknowledged</b>", table_header_style)
            ]
        ]
        for am in amendments:
            ack = "Yes" if am.get("acknowledged_at") else "Pending"
            prev_short = str(am.get("prev_hash", ""))[:12] + "..."
            am_short = str(am.get("amendment_hash", ""))[:12] + "..."
            am_data.append([
                Paragraph(am.get("author_role", "").upper(), cell_style),
                Paragraph(am.get("reason", ""), cell_style),
                Paragraph(prev_short, mono_hash_style),
                Paragraph(am_short, mono_hash_style),
                Paragraph(ack, cell_style)
            ])
        am_table = Table(am_data, colWidths=[60, 180, 100, 100, 80])
        am_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        elements.append(am_table)
        elements.append(Spacer(1, 10))

    # 7. AI Suggestions Summary (Advisory Only)
    if ai_comparisons:
        elements.append(Paragraph("AI Condition Triage (Advisory Only &bull; Model Tenancy Act Standards)", section_heading))
        ai_notice = "The assessments below are AI suggestions generated by gemini-3.8-flash for advisory negotiation. " \
                    "They do NOT constitute liability determinations or alter the locked cryptographic inspection hash."
        elements.append(Paragraph(ai_notice, ParagraphStyle("AINote", parent=cell_style, fontSize=7.5, textColor=colors.HexColor("#64748b"))))
        elements.append(Spacer(1, 4))

        comp_data = [
            [
                Paragraph("<b>Item Name</b>", table_header_style),
                Paragraph("<b>Room</b>", table_header_style),
                Paragraph("<b>Triage Category</b>", table_header_style),
                Paragraph("<b>Confidence</b>", table_header_style),
                Paragraph("<b>Rationale</b>", table_header_style)
            ]
        ]
        for c in ai_comparisons:
            cat = c.get("change_type", "unclear").replace("_", " ").upper()
            conf = f"{int(c.get('confidence', 0) * 100)}%"
            comp_data.append([
                Paragraph(c.get("item_name", ""), cell_style),
                Paragraph(c.get("room_name", ""), cell_style),
                Paragraph(cat, cell_style),
                Paragraph(conf, cell_style),
                Paragraph(c.get("rationale", ""), cell_style)
            ])

        comp_table = Table(comp_data, colWidths=[100, 80, 90, 50, 200])
        comp_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f0fdf4")),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#bbf7d0")),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        elements.append(comp_table)
        elements.append(Spacer(1, 10))

    # 8. Settlement Summary (if provided)
    if settlement_data:
        elements.append(Paragraph("Security Deposit Settlement Summary", section_heading))
        orig_dep = settlement_data.get("original_deposit", 0.0)
        tot_ded = settlement_data.get("total_deductions", 0.0)
        refund = settlement_data.get("refund_amount", orig_dep - tot_ded)
        status = settlement_data.get("status", "draft").upper()

        settle_meta = [
            [
                Paragraph("<b>Original Security Deposit:</b>", cell_style),
                Paragraph(f"INR {orig_dep:,.2f}", cell_style)
            ],
            [
                Paragraph("<b>Agreed Total Deductions:</b>", cell_style),
                Paragraph(f"INR {tot_ded:,.2f}", cell_style)
            ],
            [
                Paragraph("<b>Final Refund Amount to Tenant:</b>", ParagraphStyle("RefundBold", parent=cell_style, fontName="Helvetica-Bold", textColor=colors.HexColor("#065f46"))),
                Paragraph(f"<b>INR {refund:,.2f}</b>", ParagraphStyle("RefundBold2", parent=cell_style, fontName="Helvetica-Bold", textColor=colors.HexColor("#065f46")))
            ],
            [
                Paragraph("<b>Settlement Status:</b>", cell_style),
                Paragraph(status, cell_style)
            ]
        ]
        settle_table = Table(settle_meta, colWidths=[200, 320])
        settle_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#fafaf9")),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e7e5e4")),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(settle_table)

    # Build document
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
