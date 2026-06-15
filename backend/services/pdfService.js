const pdf = require('html-pdf-node');

class PDFService {
    constructor() {
        this.options = {
            format: 'A4',
            margin: {
                top: '10mm',
                bottom: '10mm',
                left: '8mm',
                right: '8mm'
            },
            printBackground: true,
            preferCSSPageSize: false,  // Change to false to allow scaling
            fitToPage: true,           // Fit content to one page
            pageRanges: '1'            // Force single page
        };

        this.landscapeOptions = {
            ...this.options,
            format: 'A4',
            landscape: true,
            margin: {
                top: '8mm',
                bottom: '8mm',
                left: '6mm',
                right: '6mm'
            }
        };
    }

    async generatePDF(htmlContent, options = {}) {
        const { landscape = false } = options;
        
        const pdfOptions = landscape ? this.landscapeOptions : this.options;
        
        const file = { content: htmlContent };
        
        try {
            const pdfBuffer = await pdf.generatePdf(file, pdfOptions);
            return pdfBuffer;
        } catch (error) {
            console.error('PDF Generation Error:', error);
            throw error;
        }
    }
}

module.exports = new PDFService();