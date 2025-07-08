const PDFDocument = require('pdfkit');
const sharp = require('sharp');

async function generatePDF(canvasData, filename = 'canvas') {
  return new Promise(async (resolve, reject) => {
    try {
      const { canvas, dimensions } = canvasData;
      
      // Convert canvas to buffer
      const canvasBuffer = canvas.toBuffer('image/png');
      
      // Optimize image with sharp
      const optimizedBuffer = await sharp(canvasBuffer)
        .png({ quality: 85, compressionLevel: 9 })
        .toBuffer();
      
      // Create PDF document
      const doc = new PDFDocument({
        size: [dimensions.width, dimensions.height],
        margin: 0,
        info: {
          Title: filename,
          Author: 'Canvas Builder',
          Subject: 'Canvas Export',
          CreationDate: new Date()
        }
      });
      
      // Collect PDF data
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });
      
      doc.on('error', reject);
      
      // Add the optimized image to PDF
      doc.image(optimizedBuffer, 0, 0, {
        width: dimensions.width,
        height: dimensions.height
      });
      
      // Add metadata
      doc.info.Title = filename;
      doc.info.Creator = 'Canvas Builder API';
      
      // Finalize the PDF
      doc.end();
      
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generatePDF };