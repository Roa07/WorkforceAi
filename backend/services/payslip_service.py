import io
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from models import Employee, PayrollItem, PayrollRun

def generate_payslip_pdf(employee: Employee, month: int, year: int, payroll_item: PayrollItem = None) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        textColor=colors.HexColor('#1e1b4b'),
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=colors.HexColor('#64748b'),
        spaceAfter=15
    )

    h2_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        textColor=colors.HexColor('#334155'),
        spaceBefore=10,
        spaceAfter=6
    )

    elements = []

    # Header
    elements.append(Paragraph("NexHR Technologies Inc.", title_style))
    elements.append(Paragraph(f"Official Monthly Payslip & Earnings Statement — {month:02d} / {year}", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#4f46e5'), spaceAfter=15))

    # Employee Information Table
    emp_info_data = [
        [
            Paragraph("<b>Employee Name:</b>", styles['Normal']),
            Paragraph(f"{employee.first_name} {employee.last_name}", styles['Normal']),
            Paragraph("<b>Employee ID:</b>", styles['Normal']),
            Paragraph(employee.employee_code, styles['Normal'])
        ],
        [
            Paragraph("<b>Department:</b>", styles['Normal']),
            Paragraph(employee.department, styles['Normal']),
            Paragraph("<b>Designation:</b>", styles['Normal']),
            Paragraph(employee.designation, styles['Normal'])
        ],
        [
            Paragraph("<b>Pay Period:</b>", styles['Normal']),
            Paragraph(f"{month:02d}/{year}", styles['Normal']),
            Paragraph("<b>Date of Issue:</b>", styles['Normal']),
            Paragraph(datetime.now().strftime("%Y-%m-%d"), styles['Normal'])
        ]
    ]

    t_info = Table(emp_info_data, colWidths=[100, 160, 100, 160])
    t_info.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    elements.append(t_info)
    elements.append(Spacer(1, 15))

    # Earnings & Deductions Breakdown
    basic = payroll_item.basic_salary if payroll_item else employee.basic_salary
    allowances = payroll_item.allowances if payroll_item else employee.allowances
    deductions = payroll_item.deductions if payroll_item else employee.standard_deductions
    payable = payroll_item.payable_salary if payroll_item else (basic + allowances - deductions)

    breakdown_data = [
        [Paragraph("<b>EARNINGS COMPONENT</b>", styles['Normal']), Paragraph("<b>AMOUNT (USD)</b>", styles['Normal']),
         Paragraph("<b>DEDUCTIONS COMPONENT</b>", styles['Normal']), Paragraph("<b>AMOUNT (USD)</b>", styles['Normal'])],
        [Paragraph("Basic Salary", styles['Normal']), Paragraph(f"${basic:,.2f}", styles['Normal']),
         Paragraph("Standard Deductions (Tax/Benefit)", styles['Normal']), Paragraph(f"${employee.standard_deductions:,.2f}", styles['Normal'])],
        [Paragraph("Performance Allowances", styles['Normal']), Paragraph(f"${allowances:,.2f}", styles['Normal']),
         Paragraph("Attendance Penalties / Absences", styles['Normal']), Paragraph(f"${max(0.0, deductions - employee.standard_deductions):,.2f}", styles['Normal'])],
        [Paragraph("<b>Gross Earnings:</b>", styles['Normal']), Paragraph(f"<b>${(basic + allowances):,.2f}</b>", styles['Normal']),
         Paragraph("<b>Total Deductions:</b>", styles['Normal']), Paragraph(f"<b>${deductions:,.2f}</b>", styles['Normal'])]
    ]

    t_breakdown = Table(breakdown_data, colWidths=[150, 110, 150, 110])
    t_breakdown.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (1,0), colors.HexColor('#eff6ff')),
        ('BACKGROUND', (2,0), (3,0), colors.HexColor('#fff1f2')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('PADDING', (0,0), (-1,-1), 7),
        ('ALIGN', (1,1), (1,-1), 'RIGHT'),
        ('ALIGN', (3,1), (3,-1), 'RIGHT'),
    ]))
    elements.append(t_breakdown)
    elements.append(Spacer(1, 15))

    # Net Salary Highlight Box
    net_data = [
        [
            Paragraph("<b>NET DISBURSED SALARY:</b>", ParagraphStyle('NetL', parent=styles['Normal'], fontSize=11, fontName='Helvetica-Bold', textColor=colors.HexColor('#1e1b4b'))),
            Paragraph(f"<b>${payable:,.2f}</b>", ParagraphStyle('NetR', parent=styles['Normal'], fontSize=14, fontName='Helvetica-Bold', textColor=colors.HexColor('#059669'), alignment=2))
        ]
    ]
    t_net = Table(net_data, colWidths=[300, 220])
    t_net.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#ecfdf5')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#10b981')),
        ('PADDING', (0,0), (-1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    elements.append(t_net)
    elements.append(Spacer(1, 25))

    # Footer Notes
    elements.append(Paragraph("<b>Notice:</b> This is an official computer-generated statement verified by NexHR Autonomous HRMS Engine.", ParagraphStyle('Foot', parent=styles['Normal'], fontSize=8, textColor=colors.HexColor('#94a3b8'))))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
