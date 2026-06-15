// const PDFDocument = require('pdfkit');
// const fs = require('fs');
// const path = require('path');

// class BlockMaintenancePdfService {
//   static async generateBlockReport(blockData, hotelDetails) {
//     return new Promise((resolve, reject) => {
//       try {
//         const doc = new PDFDocument({ 
//           margin: 50, 
//           size: 'A4',
//           info: {
//             Title: `Block Room Report - ${blockData.room_number}`,
//             Author: hotelDetails.name,
//             Subject: 'Room Block Report',
//             Keywords: 'block,room,hotel,management',
//             Creator: 'Hotel Management System'
//           }
//         });
        
//         const chunks = [];
        
//         doc.on('data', chunk => chunks.push(chunk));
//         doc.on('end', () => resolve(Buffer.concat(chunks)));
        
//         // ===========================================
//         // HEADER WITH HOTEL INFO
//         // ===========================================
//         doc.fontSize(20).font('Helvetica-Bold')
//           .text('ROOM BLOCK REPORT', { align: 'center' });
        
//         doc.moveDown(0.5);
        
//         // Hotel Information
//         doc.fontSize(10).font('Helvetica')
//           .text(`Hotel: ${hotelDetails.name || 'Hotel'}`, 50, 100);
//         doc.text(`Address: ${hotelDetails.address || 'N/A'}`, 50, 115);
//         doc.text(`Phone: ${hotelDetails.phone || 'N/A'}`, 50, 130);
        
//         // Report Information
//         doc.text(`Report Date: ${new Date().toLocaleDateString('en-IN')}`, 350, 100);
//         doc.text(`Report ID: BLK-${blockData.id || '0000'}`, 350, 115);
        
//         // Horizontal line
//         doc.moveTo(50, 150).lineTo(550, 150).stroke();
//         doc.moveDown(2);
        
//         // ===========================================
//         // BLOCK DETAILS - FOCUS ON OPERATIONAL ASPECTS
//         // ===========================================
//         doc.fontSize(14).font('Helvetica-Bold')
//           .text('BLOCK DETAILS', { underline: true });
//         doc.moveDown(1);
        
//         const fromDate = new Date(blockData.from_date);
//         const toDate = new Date(blockData.to_date);
//         const duration = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24));
        
//         doc.fontSize(11).font('Helvetica')
//           .text(`Block ID: ${blockData.id}`, 50, 200);
//         doc.text(`Room Number: ${blockData.room_number || 'N/A'}`, 50, 215);
//         doc.text(`Room Type: ${blockData.room_type || 'Not specified'}`, 50, 230);
//         doc.text(`From Date: ${fromDate.toLocaleDateString('en-IN')}`, 50, 245);
//         doc.text(`To Date: ${toDate.toLocaleDateString('en-IN')}`, 50, 260);
//         doc.text(`Duration: ${duration} day(s)`, 50, 275);
//         doc.text(`Block Reason: ${blockData.special_requests || 'Not specified'}`, 50, 290);
//         doc.text(`Blocked By: ${blockData.referral_by || 'Admin'}`, 50, 305);
//         doc.text(`Created On: ${new Date(blockData.created_at).toLocaleDateString('en-IN')}`, 50, 320);
        
//         // ===========================================
//         // OPERATIONAL IMPACT
//         // ===========================================
//         doc.moveDown(3);
//         doc.fontSize(12).font('Helvetica-Bold')
//           .text('OPERATIONAL IMPACT ANALYSIS:', 50, 370);
//         doc.moveDown(0.5);
        
//         doc.fontSize(10).font('Helvetica')
//           .text('• Room Inventory: -1 available room', 50, 395)
//           .text(`• Duration: ${duration} day(s) of unavailability`, 50, 410)
//           .text('• Revenue Impact: No bookings possible', 50, 425)
//           .text('• Housekeeping: No cleaning required', 50, 440)
//           .text('• Maintenance: Regular checks suspended', 50, 455);
        
//         // ===========================================
//         // APPROVAL SECTION
//         // ===========================================
//         doc.moveDown(3);
//         doc.fontSize(12).font('Helvetica-Bold')
//           .text('APPROVAL & AUTHORIZATION:', 50, 500);
        
//         const pageHeight = doc.page.height;
        
//         // Approval Signatures
//         doc.moveDown(1);
//         doc.text('___________________________', 50, 530);
//         doc.fontSize(9).text('Blocked By', 50, 545);
        
//         doc.text('___________________________', 250, 530);
//         doc.text('Department Head', 250, 545);
        
//         doc.text('___________________________', 400, 530);
//         doc.text('Hotel Manager', 400, 545);
        
//         // ===========================================
//         // FOOTER
//         // ===========================================
//         doc.fontSize(9)
//           .text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 50, pageHeight - 50)
//           .text(`Hotel Management System | ${hotelDetails.name}`, 350, pageHeight - 50, { align: 'right' });
        
//         doc.end();
//       } catch (error) {
//         reject(error);
//       }
//     });
//   }

//   static async generateMaintenanceReport(maintenanceData, hotelDetails) {
//   return new Promise((resolve, reject) => {
//     try {
//       const doc = new PDFDocument({ 
//         margin: 50, 
//         size: 'A4',
//         info: {
//           Title: `Maintenance Report - ${maintenanceData.room_number}`,
//           Author: hotelDetails.name,
//           Subject: 'Room Maintenance Report',
//           Keywords: 'maintenance,repair,hotel,room',
//           Creator: 'Hotel Management System'
//         }
//       });
      
//       const chunks = [];
      
//       doc.on('data', chunk => chunks.push(chunk));
//       doc.on('end', () => resolve(Buffer.concat(chunks)));
      
//       // ===========================================
//       // HEADER
//       // ===========================================
//       doc.fontSize(20).font('Helvetica-Bold')
//         .text('MAINTENANCE REPORT', { align: 'center' });
      
//       doc.moveDown(0.5);
      
//       // Hotel Information
//       doc.fontSize(10).font('Helvetica')
//         .text(`Hotel: ${hotelDetails.name || 'Hotel'}`, 50, 100);
//       doc.text(`Address: ${hotelDetails.address || 'N/A'}`, 50, 115);
//       doc.text(`Phone: ${hotelDetails.phone || 'N/A'}`, 50, 130);
      
//       // Report Information
//       const reportDate = new Date().toLocaleDateString('en-IN');
//       doc.text(`Report Date: ${reportDate}`, 350, 100);
//       doc.text(`Report ID: MNT-${maintenanceData.id || '0000'}`, 350, 115);
      
//       // Horizontal line
//       doc.moveTo(50, 150).lineTo(550, 150).stroke();
//       doc.moveDown(2);
      
//       // ===========================================
//       // MAINTENANCE DETAILS
//       // ===========================================
//       doc.fontSize(14).font('Helvetica-Bold')
//         .text('MAINTENANCE DETAILS', { underline: true });
//       doc.moveDown(1);
      
//       // Parse dates
//       const fromDate = maintenanceData.from_date ? new Date(maintenanceData.from_date) : new Date();
//       const toDate = maintenanceData.to_date ? new Date(maintenanceData.to_date) : new Date();
//       const duration = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24));
      
//       // Use parsed fields directly instead of parsing special_requests
//       const maintenanceType = maintenanceData.maintenance_type || 'General Repair';
//       const priority = maintenanceData.priority || 'Medium';
//       const assignedTo = maintenanceData.assigned_to || 'Maintenance Team';
//       const problemDescription = maintenanceData.description || 'No detailed description provided';
//       const estimatedCost = maintenanceData.total || maintenanceData.estimatedCost || 0;
      
//       let yPos = 200;
//       doc.fontSize(11).font('Helvetica')
//         .text(`Maintenance ID: ${maintenanceData.id}`, 50, yPos);
//       yPos += 15;
//       doc.text(`Room Number: ${maintenanceData.room_number || 'N/A'}`, 50, yPos);
//       yPos += 15;
//       doc.text(`Room Type: ${maintenanceData.room_type || 'Not specified'}`, 50, yPos);
//       yPos += 15;
//       doc.text(`From Date: ${fromDate.toLocaleDateString('en-IN')}`, 50, yPos);
//       yPos += 15;
//       doc.text(`To Date: ${toDate.toLocaleDateString('en-IN')}`, 50, yPos);
//       yPos += 15;
//       doc.text(`Estimated Duration: ${duration} day(s)`, 50, yPos);
//       yPos += 15;
//       doc.text(`Maintenance Type: ${maintenanceType}`, 50, yPos);
//       yPos += 15;
//       doc.text(`Priority: ${priority}`, 50, yPos);
//       yPos += 15;
//       doc.text(`Assigned To: ${assignedTo}`, 50, yPos);
//       yPos += 15;
//       doc.text(`Estimated Cost: ₹${parseFloat(estimatedCost).toFixed(2)}`, 50, yPos);
      
//       // ===========================================
//       // PROBLEM DESCRIPTION
//       // ===========================================
//       yPos += 30;
//       doc.fontSize(12).font('Helvetica-Bold')
//         .text('PROBLEM DESCRIPTION:', 50, yPos);
      
//       yPos += 20;
//       doc.fontSize(10).font('Helvetica')
//         .text(problemDescription, 50, yPos, {
//           width: 500,
//           align: 'left'
//         });
      
//       // ===========================================
//       // MAINTENANCE CHECKLIST
//       // ===========================================
//       yPos += 40;
//       doc.fontSize(12).font('Helvetica-Bold')
//         .text('MAINTENANCE CHECKLIST:', 50, yPos);
      
//       yPos += 20;
//       const checklist = [
//         'Room inspected for issues',
//         'Required tools/materials available',
//         'Safety precautions implemented',
//         'Work area secured',
//         'Estimated timeline confirmed',
//         'Alternate arrangements made if needed',
//         'Guests notified (if applicable)',
//         'Cleanup plan prepared'
//       ];
      
//       checklist.forEach((item) => {
//         doc.fontSize(10)
//           .text(`□ ${item}`, 50, yPos);
//         yPos += 15;
//       });
      
//       // ===========================================
//       // COST BREAKDOWN
//       // ===========================================
//       if (estimatedCost > 0) {
//         yPos += 20;
//         doc.fontSize(12).font('Helvetica-Bold')
//           .text('COST BREAKDOWN:', 50, yPos);
        
//         yPos += 20;
//         doc.fontSize(10)
//           .text(`Total Estimated Cost: ₹${parseFloat(estimatedCost).toFixed(2)}`, 50, yPos);
//         yPos += 15;
//         doc.text('Includes labor, materials, and other expenses', 50, yPos);
//       }
      
//       // ===========================================
//       // APPROVAL SECTION
//       // ===========================================
//       const pageHeight = doc.page.height;
//       yPos = pageHeight - 150;
//       doc.fontSize(12).font('Helvetica-Bold')
//         .text('APPROVAL & SIGNATURE:', 50, yPos);
      
//       // Signatures
//       yPos += 30;
//       doc.text('___________________________', 50, yPos);
//       doc.fontSize(9).text('Maintenance Supervisor', 50, yPos + 15);
      
//       doc.text('___________________________', 250, yPos);
//       doc.text('Department Head', 250, yPos + 15);
      
//       doc.text('___________________________', 400, yPos);
//       doc.text('Hotel Manager', 400, yPos + 15);
      
//       // ===========================================
//       // FOOTER
//       // ===========================================
//       doc.fontSize(9)
//         .text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 50, pageHeight - 50)
//         .text(`Hotel Management System | ${hotelDetails.name}`, 350, pageHeight - 50, { align: 'right' });
      
//       doc.end();
//     } catch (error) {
//       reject(error);
//     }
//   });
// }
const PDFDocument = require('pdfkit');

class BlockMaintenancePdfService {
  static async generateBlockReport(blockData, hotelDetails) {
    return new Promise((resolve, reject) => {
      try {
        // Create PDF document
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          bufferPages: true,
          autoFirstPage: true
        });
        
        // Collect buffers
        const buffers = [];
        
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          console.log(`✅ PDF generated successfully (${pdfData.length} bytes)`);
          resolve(pdfData);
        });
        
        doc.on('error', (error) => {
          console.error('❌ PDF generation error:', error);
          reject(error);
        });
        
        // =========== SIMPLE HEADER ===========
        // Hotel name at top
        doc.fontSize(18)
          .font('Helvetica-Bold')
          .text(hotelDetails.name || 'Hotel', {
            align: 'center'
          });
        
        doc.moveDown(0.5);
        
        // Report title
        doc.fontSize(16)
          .font('Helvetica-Bold')
          .text('ROOM BLOCK REPORT', {
            align: 'center',
            underline: true
          });
        
        doc.moveDown(1);
        
        // =========== REPORT INFO ===========
        doc.fontSize(10)
          .font('Helvetica')
          .text(`Report Date: ${new Date().toLocaleDateString('en-IN')}`, 50, 150);
        doc.text(`Report ID: BLK-${blockData.id || '000'}`, 350, 150);
        
        // =========== BLOCK DETAILS ===========
        doc.moveDown(3);
        doc.fontSize(14)
          .font('Helvetica-Bold')
          .text('BLOCK DETAILS:', 50, 200);
        
        doc.moveDown(1);
        doc.fontSize(10)
          .font('Helvetica')
          .text(`Block ID: ${blockData.id}`, 50, 230)
          .text(`Room Number: ${blockData.room_number || 'N/A'}`, 50, 245)
          .text(`Room Type: ${blockData.room_type || 'Standard'}`, 50, 260);
        
        // Dates
        const fromDate = blockData.from_date ? new Date(blockData.from_date) : new Date();
        const toDate = blockData.to_date ? new Date(blockData.to_date) : new Date();
        const duration = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24));
        
        doc.text(`From Date: ${fromDate.toLocaleDateString('en-IN')}`, 50, 275)
          .text(`To Date: ${toDate.toLocaleDateString('en-IN')}`, 50, 290)
          .text(`Duration: ${duration} day(s)`, 50, 305)
          .text(`Reason: ${blockData.special_requests || 'Not specified'}`, 50, 320);
        
        // =========== FOOTER ===========
        const pageHeight = doc.page.height;
        doc.fontSize(9)
          .text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 50, pageHeight - 50)
          .text(`Hotel Management System`, 350, pageHeight - 50, { align: 'right' });
        
        // Finalize the PDF
        doc.end();
        
      } catch (error) {
        console.error('❌ Error in PDF generation:', error);
        reject(error);
      }
    });
  }

  static async generateMaintenanceReport(maintenanceData, hotelDetails) {
    return new Promise((resolve, reject) => {
      try {
        // Create PDF document
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          bufferPages: true,
          autoFirstPage: true
        });
        
        // Collect buffers
        const buffers = [];
        
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          console.log(`✅ Maintenance PDF generated successfully (${pdfData.length} bytes)`);
          resolve(pdfData);
        });
        
        doc.on('error', (error) => {
          console.error('❌ Maintenance PDF generation error:', error);
          reject(error);
        });
        
        // =========== SIMPLE HEADER ===========
        // Hotel name at top
        doc.fontSize(18)
          .font('Helvetica-Bold')
          .text(hotelDetails.name || 'Hotel', {
            align: 'center'
          });
        
        doc.moveDown(0.5);
        
        // Report title
        doc.fontSize(16)
          .font('Helvetica-Bold')
          .text('MAINTENANCE REPORT', {
            align: 'center',
            underline: true
          });
        
        doc.moveDown(1);
        
        // =========== REPORT INFO ===========
        doc.fontSize(10)
          .font('Helvetica')
          .text(`Report Date: ${new Date().toLocaleDateString('en-IN')}`, 50, 150);
        doc.text(`Report ID: MNT-${maintenanceData.id || '000'}`, 350, 150);
        
        // =========== MAINTENANCE DETAILS ===========
        doc.moveDown(3);
        doc.fontSize(14)
          .font('Helvetica-Bold')
          .text('MAINTENANCE DETAILS:', 50, 200);
        
        doc.moveDown(1);
        doc.fontSize(10)
          .font('Helvetica')
          .text(`Maintenance ID: ${maintenanceData.id}`, 50, 230)
          .text(`Room Number: ${maintenanceData.room_number || 'N/A'}`, 50, 245)
          .text(`Room Type: ${maintenanceData.room_type || 'Standard'}`, 50, 260);
        
        // Dates
        const fromDate = maintenanceData.from_date ? new Date(maintenanceData.from_date) : new Date();
        const toDate = maintenanceData.to_date ? new Date(maintenanceData.to_date) : new Date();
        const duration = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24));
        
        doc.text(`From Date: ${fromDate.toLocaleDateString('en-IN')}`, 50, 275)
          .text(`To Date: ${toDate.toLocaleDateString('en-IN')}`, 50, 290)
          .text(`Duration: ${duration} day(s)`, 50, 305);
        
        // Parse maintenance details
        let problemDescription = 'No description provided';
        let maintenanceType = 'General Repair';
        let priority = 'Medium';
        let assignedTo = 'Maintenance Team';
        let estimatedCost = '0.00';
        
        if (maintenanceData.special_requests) {
          const lines = maintenanceData.special_requests.split('\n');
          lines.forEach(line => {
            if (line.includes('MAINTENANCE:')) {
              maintenanceType = line.replace('MAINTENANCE:', '').trim();
            } else if (line.includes('Description:')) {
              problemDescription = line.replace('Description:', '').trim();
            } else if (line.includes('Assigned to:')) {
              assignedTo = line.replace('Assigned to:', '').trim();
            } else if (line.includes('Priority:')) {
              priority = line.replace('Priority:', '').trim();
            } else if (line.includes('Estimated cost:')) {
              estimatedCost = line.replace('Estimated cost:', '').replace('₹', '').trim();
            }
          });
        }
        
        doc.text(`Maintenance Type: ${maintenanceType}`, 50, 320)
          .text(`Priority: ${priority}`, 50, 335)
          .text(`Assigned To: ${assignedTo}`, 50, 350)
          .text(`Estimated Cost: ₹${estimatedCost}`, 50, 365);
        
        // =========== PROBLEM DESCRIPTION ===========
        doc.moveDown(3);
        doc.fontSize(12)
          .font('Helvetica-Bold')
          .text('PROBLEM DESCRIPTION:', 50, 400);
        
        doc.fontSize(10)
          .font('Helvetica')
          .text(problemDescription, 50, 420, {
            width: 500,
            align: 'left'
          });
        
        // =========== FOOTER ===========
        const pageHeight = doc.page.height;
        doc.fontSize(9)
          .text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 50, pageHeight - 50)
          .text(`Hotel Management System`, 350, pageHeight - 50, { align: 'right' });
        
        // Finalize the PDF
        doc.end();
        
      } catch (error) {
        console.error('❌ Error in maintenance PDF generation:', error);
        reject(error);
      }
    });
  }
  static async generateCombinedReport(blockedRooms, maintenanceRooms, hotelDetails) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          margin: 50, 
          size: 'A4',
          info: {
            Title: 'Room Status Report - Blocked & Maintenance',
            Author: hotelDetails.name,
            Subject: 'Hotel Room Status Report',
            Keywords: 'report,status,blocked,maintenance,hotel',
            Creator: 'Hotel Management System'
          }
        });
        
        const chunks = [];
        
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        
        // ===========================================
        // COVER PAGE
        // ===========================================
        doc.fontSize(24).font('Helvetica-Bold')
          .text('ROOM STATUS REPORT', { align: 'center' });
        
        doc.moveDown(1);
        doc.fontSize(18)
          .text('Blocked & Maintenance Rooms', { align: 'center' });
        
        doc.moveDown(2);
        doc.fontSize(14)
          .text(hotelDetails.name || 'Hotel', { align: 'center' });
        doc.text(hotelDetails.address || '', { align: 'center' });
        
        doc.moveDown(3);
        doc.fontSize(12)
          .text(`Report Period: ${new Date().toLocaleDateString('en-IN')}`, { align: 'center' });
        doc.text(`Generated: ${new Date().toLocaleTimeString('en-IN')}`, { align: 'center' });
        
        doc.moveDown(4);
        doc.fontSize(10).font('Helvetica-Oblique')
          .text('This report contains operational information about', { align: 'center' })
          .text('blocked and maintenance rooms in the hotel', { align: 'center' });
        
        // Add page for summary
        doc.addPage();
        
        // ===========================================
        // EXECUTIVE SUMMARY
        // ===========================================
        doc.fontSize(16).font('Helvetica-Bold')
          .text('EXECUTIVE SUMMARY', { align: 'center' });
        
        doc.moveDown(1);
        
        const totalBlocked = blockedRooms.length;
        const totalMaintenance = maintenanceRooms.length;
        const totalUnavailable = totalBlocked + totalMaintenance;
        
        // Summary Statistics
        const yPos = 150;
        doc.fontSize(12).font('Helvetica')
          .text(`Total Blocked Rooms: ${totalBlocked}`, 100, yPos)
          .text(`Total Maintenance Rooms: ${totalMaintenance}`, 100, yPos + 25)
          .text(`Total Unavailable Rooms: ${totalUnavailable}`, 100, yPos + 50)
          .text(`Report Date: ${new Date().toLocaleDateString('en-IN')}`, 100, yPos + 75);
        
        // Impact Analysis
        doc.moveDown(3);
        doc.fontSize(14).font('Helvetica-Bold')
          .text('IMPACT ANALYSIS:', 100, yPos + 125);
        
        doc.fontSize(11)
          .text(`• Revenue Impact: ₹${(totalUnavailable * 5000).toLocaleString('en-IN')} (estimated)`, 100, yPos + 150)
          .text(`• Operational Impact: ${totalUnavailable > 5 ? 'High' : totalUnavailable > 2 ? 'Moderate' : 'Low'}`, 100, yPos + 170)
          .text(`• Housekeeping Impact: ${totalUnavailable} rooms not requiring service`, 100, yPos + 190);
        
        // ===========================================
        // BLOCKED ROOMS DETAIL
        // ===========================================
        doc.addPage();
        doc.fontSize(16).font('Helvetica-Bold')
          .text('BLOCKED ROOMS DETAIL', { align: 'center' });
        
        let currentY = 100;
        
        if (blockedRooms.length === 0) {
          doc.moveDown(2);
          doc.fontSize(12)
            .text('No blocked rooms found for this period.', { align: 'center' });
        } else {
          blockedRooms.forEach((room, index) => {
            if (currentY > 700) {
              doc.addPage();
              currentY = 100;
            }
            
            const fromDate = new Date(room.from_date);
            const toDate = new Date(room.to_date);
            const duration = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24));
            
            doc.fontSize(11).font('Helvetica-Bold')
              .text(`Room ${room.room_number}`, 50, currentY);
            
            doc.fontSize(10).font('Helvetica')
              .text(`Block ID: ${room.id}`, 50, currentY + 20)
              .text(`Period: ${fromDate.toLocaleDateString('en-IN')} to ${toDate.toLocaleDateString('en-IN')}`, 50, currentY + 35)
              .text(`Duration: ${duration} day(s)`, 50, currentY + 50)
              .text(`Reason: ${room.special_requests || 'Not specified'}`, 50, currentY + 65)
              .text(`Blocked By: ${room.referral_by || 'Admin'}`, 50, currentY + 80);
            
            currentY += 120;
          });
        }
        
        // ===========================================
        // MAINTENANCE ROOMS DETAIL
        // ===========================================
        doc.addPage();
        doc.fontSize(16).font('Helvetica-Bold')
          .text('MAINTENANCE ROOMS DETAIL', { align: 'center' });
        
        currentY = 100;
        
        if (maintenanceRooms.length === 0) {
          doc.moveDown(2);
          doc.fontSize(12)
            .text('No maintenance rooms found for this period.', { align: 'center' });
        } else {
          maintenanceRooms.forEach((room, index) => {
            if (currentY > 700) {
              doc.addPage();
              currentY = 100;
            }
            
            const details = this.parseMaintenanceDetails(room.special_requests);
            const fromDate = new Date(room.from_date);
            const toDate = new Date(room.to_date);
            const duration = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24));
            
            doc.fontSize(11).font('Helvetica-Bold')
              .text(`Room ${room.room_number}`, 50, currentY);
            
            doc.fontSize(10).font('Helvetica')
              .text(`Maintenance ID: ${room.id}`, 50, currentY + 20)
              .text(`Period: ${fromDate.toLocaleDateString('en-IN')} to ${toDate.toLocaleDateString('en-IN')}`, 50, currentY + 35)
              .text(`Duration: ${duration} day(s)`, 50, currentY + 50)
              .text(`Type: ${details.type || 'General'}`, 50, currentY + 65)
              .text(`Priority: ${details.priority || 'Medium'}`, 50, currentY + 80)
              .text(`Estimated Cost: ₹${parseFloat(room.total || 0).toFixed(2)}`, 50, currentY + 95);
            
            currentY += 130;
          });
        }
        
        // ===========================================
        // RECOMMENDATIONS PAGE
        // ===========================================
        doc.addPage();
        doc.fontSize(16).font('Helvetica-Bold')
          .text('RECOMMENDATIONS & ACTION ITEMS', { align: 'center' });
        
        doc.moveDown(2);
        doc.fontSize(12).font('Helvetica-Bold')
          .text('For Management Review:', 50, 150);
        
        const recommendations = [
          'Review blocked room reasons and durations',
          'Assess maintenance backlog and prioritize critical repairs',
          'Consider impact on revenue and guest satisfaction',
          'Plan for peak season room availability',
          'Review maintenance costs vs budget',
          'Update preventive maintenance schedules'
        ];
        
        recommendations.forEach((rec, index) => {
          const yPos = 180 + (index * 20);
          doc.fontSize(11)
            .text(`• ${rec}`, 50, yPos);
        });
        
        // ===========================================
        // FINAL FOOTER
        // ===========================================
        const pageHeight = doc.page.height;
        doc.fontSize(9)
          .text(`Report generated on: ${new Date().toLocaleString('en-IN')}`, 50, pageHeight - 50)
          .text(`Page ${doc.page.number} of ${doc.page.number}`, 450, pageHeight - 50, { align: 'right' })
          .text('Hotel Management System - Confidential', 200, pageHeight - 30, { align: 'center' });
        
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Helper methods
  static parseMaintenanceDetails(specialRequests) {
    if (!specialRequests) return {};
    
    const details = {};
    const lines = specialRequests.split('\n');
    
    lines.forEach(line => {
      if (line.includes('MAINTENANCE:')) {
        details.type = line.replace('MAINTENANCE:', '').trim();
      } else if (line.includes('Description:')) {
        details.description = line.replace('Description:', '').trim();
      } else if (line.includes('Assigned to:')) {
        details.assignedTo = line.replace('Assigned to:', '').trim();
      } else if (line.includes('Priority:')) {
        details.priority = line.replace('Priority:', '').trim();
      } else if (line.includes('Estimated cost:')) {
        details.estimatedCost = line.replace('Estimated cost:', '').replace('₹', '').trim();
      }
    });
    
    return details;
  }
}

module.exports = BlockMaintenancePdfService;