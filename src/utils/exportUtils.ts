import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BorrowRequest } from '../types';

export const ExportUtils = {
  /**
   * Export requests to Excel (.xlsx)
   */
  exportToExcel(requests: BorrowRequest[], filename = 'IT_Equipment_Borrow_Report.xlsx') {
    const rows = requests.map(req => {
      const itemsText = req.items.map(i => `${i.equipmentName} (${i.quantity} ชิ้น)`).join(', ');
      const totalQty = req.items.reduce((sum, i) => sum + i.quantity, 0);

      const statusMapTh: Record<string, string> = {
        Pending: 'รออนุมัติ',
        Approved: 'อนุมัติแล้ว (รอรับของ)',
        Rejected: 'ไม่อนุมัติ',
        InUse: 'กำลังยืมใช้งาน',
        Returned: 'ส่งคืนเรียบร้อย',
        Overdue: 'เกินกำหนดส่งคืน',
        Cancelled: 'ยกเลิกคำขอ',
      };

      return {
        'รหัสคำขอ': req.id,
        'ชื่อผู้ขอยืม': req.requester.name,
        'แผนก': req.requester.department,
        'อีเมล': req.requester.email,
        'เบอร์ติดต่อ': req.requester.phone || '-',
        'รายการอุปกรณ์ที่ยืม': itemsText,
        'จำนวนรวม': totalQty,
        'วันที่เริ่มยืม': req.borrowDate,
        'กำหนดวันคืน': req.returnDate,
        'สถานะ': statusMapTh[req.status] || req.status,
        'วัตถุประสงค์ / เหตุผล': req.reason,
        'วันที่ยื่นคำขอ': new Date(req.createdAt).toLocaleDateString('th-TH'),
        'ผู้อนุมัติ': req.approver?.name || '-',
        'วันที่อนุมัติ': req.approver?.decidedAt ? new Date(req.approver.decidedAt).toLocaleDateString('th-TH') : '-',
        'ความเห็นผู้อนุมัติ': req.approver?.comment || '-',
        'ผู้ส่งมอบ': req.handover?.handedBy || '-',
        'วันที่ส่งมอบ': req.handover?.handedAt ? new Date(req.handover.handedAt).toLocaleDateString('th-TH') : '-',
        'ผู้รับคืน': req.returnInfo?.receivedBy || '-',
        'วันที่รับคืน': req.returnInfo?.returnedAt ? new Date(req.returnInfo.returnedAt).toLocaleDateString('th-TH') : '-',
        'สภาพอุปกรณ์เมื่อคืน': req.returnInfo?.condition || '-',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Set column widths
    const columnWidths = [
      { wch: 16 }, // รหัสคำขอ
      { wch: 22 }, // ชื่อผู้ขอยืม
      { wch: 20 }, // แผนก
      { wch: 25 }, // อีเมล
      { wch: 14 }, // เบอร์ติดต่อ
      { wch: 35 }, // รายการอุปกรณ์
      { wch: 10 }, // จำนวนรวม
      { wch: 14 }, // วันที่เริ่มยืม
      { wch: 14 }, // กำหนดวันคืน
      { wch: 18 }, // สถานะ
      { wch: 35 }, // เหตุผล
      { wch: 15 }, // วันที่ยื่น
      { wch: 22 }, // ผู้อนุมัติ
      { wch: 15 }, // วันที่อนุมัติ
      { wch: 25 }, // ความเห็น
      { wch: 20 }, // ผู้ส่งมอบ
      { wch: 15 }, // วันที่ส่งมอบ
      { wch: 20 }, // ผู้รับคืน
      { wch: 15 }, // วันที่รับคืน
      { wch: 18 }, // สภาพ
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Borrow_Requests');
    XLSX.writeFile(workbook, filename);
  },

  /**
   * Export requests to CSV with UTF-8 BOM for Thai language support in Excel
   */
  exportToCSV(requests: BorrowRequest[], filename = 'IT_Equipment_Borrow_Report.csv') {
    const headers = [
      'RequestID',
      'RequesterName',
      'Department',
      'Email',
      'Items',
      'BorrowDate',
      'ReturnDate',
      'Status',
      'Reason',
      'Approver',
      'ApprovedDate',
    ];

    const rows = requests.map(req => {
      const itemsText = req.items.map(i => `${i.equipmentName} (${i.quantity})`).join('; ');
      return [
        `"${req.id}"`,
        `"${req.requester.name}"`,
        `"${req.requester.department}"`,
        `"${req.requester.email}"`,
        `"${itemsText}"`,
        `"${req.borrowDate}"`,
        `"${req.returnDate}"`,
        `"${req.status}"`,
        `"${req.reason.replace(/"/g, '""')}"`,
        `"${req.approver?.name || ''}"`,
        `"${req.approver?.decidedAt ? new Date(req.approver.decidedAt).toISOString().slice(0, 10) : ''}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Export formal borrowing slip to PDF
   */
  exportRequestToPDF(req: BorrowRequest) {
    const doc = new jsPDF();

    // Header
    doc.setFillColor(37, 99, 235); // Blue
    doc.rect(0, 0, 210, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('IT EQUIPMENT BORROWING & HANDOVER FORM', 14, 18);

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.text(`Request No: ${req.id}`, 14, 38);
    doc.text(`Date Created: ${new Date(req.createdAt).toLocaleDateString()}`, 150, 38);

    // Requester Info Box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 44, 182, 32, 2, 2, 'FD');

    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text('Borrower Information (ข้อมูลผู้ยืม):', 18, 52);

    doc.setFontSize(9);
    doc.text(`Name: ${req.requester.name}`, 18, 60);
    doc.text(`Department: ${req.requester.department}`, 105, 60);
    doc.text(`Email: ${req.requester.email}`, 18, 68);
    doc.text(`Phone: ${req.requester.phone || '-'}`, 105, 68);

    // Period & Status
    doc.roundedRect(14, 80, 182, 22, 2, 2, 'FD');
    doc.text(`Borrow Date: ${req.borrowDate}`, 18, 88);
    doc.text(`Expected Return Date: ${req.returnDate}`, 105, 88);
    doc.text(`Status: ${req.status.toUpperCase()}`, 18, 96);
    doc.text(`Reason: ${req.reason.substring(0, 55)}`, 60, 96);

    // Table of Items
    const tableData = req.items.map((item, index) => [
      index + 1,
      item.equipmentName,
      item.category,
      item.quantity,
      item.assetTag || 'Pending Handover',
    ]);

    autoTable(doc, {
      startY: 108,
      head: [['#', 'Equipment Item', 'Category', 'Qty', 'Asset Tag / Serial No.']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 70 },
        2: { cellWidth: 35 },
        3: { cellWidth: 18 },
        4: { cellWidth: 49 },
      },
    });

    // Signatures
    // @ts-expect-error autoTable adds lastAutoTable to doc
    const finalY = doc.lastAutoTable?.finalY || 160;
    const signY = Math.max(finalY + 25, 185);

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);

    // Borrower sign
    doc.line(18, signY, 70, signY);
    doc.text(`(${req.requester.name})`, 25, signY + 6);
    doc.text('Borrower / ผู้ขอยืม', 30, signY + 12);
    doc.text('Date: ____/____/____', 25, signY + 18);

    // Approver sign
    doc.line(80, signY, 132, signY);
    doc.text(`(${req.approver?.name || 'IT Manager'})`, 85, signY + 6);
    doc.text('Approver / ผู้อนุมัติ', 92, signY + 12);
    doc.text('Date: ____/____/____', 88, signY + 18);

    // IT Handover sign
    doc.line(142, signY, 194, signY);
    doc.text(`(${req.handover?.handedBy || 'IT Officer'})`, 147, signY + 6);
    doc.text('Handover Officer / ผู้ส่งมอบ', 148, signY + 12);
    doc.text('Date: ____/____/____', 150, signY + 18);

    // Footer note
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Terms: The borrower agrees to take reasonable care of the equipment and return on schedule in good condition.', 14, 280);

    doc.save(`Borrow_Slip_${req.id}.pdf`);
  },
};
