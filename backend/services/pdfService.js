/**
 * PDF generation service
 * - Local (Windows/macOS): uses html-pdf-node / bundled Puppeteer Chrome
 * - AWS Elastic Beanstalk / Linux: uses @sparticuz/chromium + puppeteer-core
 *   (EB does not ship Chrome; stock puppeteer fails with "Could not find expected browser")
 *
 * Note: @sparticuz/chromium v149+ is ESM-only — load it with dynamic import(),
 * not require(). Do not assign chromium.setGraphicsMode on the frozen namespace.
 */

const isLinuxServer =
  process.platform === 'linux' ||
  process.env.USE_SPARTICUZ_CHROMIUM === 'true' ||
  Boolean(process.env.AWS_EXECUTION_ENV) ||
  Boolean(process.env.ELASTIC_BEANSTALK_ENVIRONMENT);

class PDFService {
  constructor() {
    this.options = {
      format: 'A4',
      margin: {
        top: '10mm',
        bottom: '10mm',
        left: '8mm',
        right: '8mm',
      },
      printBackground: true,
      preferCSSPageSize: false,
      pageRanges: '1',
    };

    this.landscapeOptions = {
      ...this.options,
      landscape: true,
      margin: {
        top: '8mm',
        bottom: '8mm',
        left: '6mm',
        right: '6mm',
      },
    };
  }

  async generatePDF(htmlContent, options = {}) {
    const { landscape = false } = options;
    const pdfOptions = landscape ? this.landscapeOptions : this.options;

    if (isLinuxServer) {
      return this.generateWithSparticuzChromium(htmlContent, pdfOptions);
    }

    return this.generateWithHtmlPdfNode(htmlContent, pdfOptions);
  }

  async generateWithHtmlPdfNode(htmlContent, pdfOptions) {
    const pdf = require('html-pdf-node');
    try {
      return await pdf.generatePdf({ content: htmlContent }, pdfOptions);
    } catch (error) {
      console.error('PDF Generation Error (html-pdf-node):', error);
      if (process.platform === 'linux') {
        return this.generateWithSparticuzChromium(htmlContent, pdfOptions);
      }
      throw error;
    }
  }

  async loadSparticuzChromium() {
    const mod = await import('@sparticuz/chromium');
    return mod.default || mod;
  }

  async generateWithSparticuzChromium(htmlContent, pdfOptions) {
    const chromium = await this.loadSparticuzChromium();
    const puppeteer = require('puppeteer-core');

    let browser;
    try {
      const executablePath = await chromium.executablePath();
      const args = Array.isArray(chromium.args) ? chromium.args : [];

      browser = await puppeteer.launch({
        args: [
          ...args,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--font-render-hinting=none',
          '--single-process',
        ],
        defaultViewport: chromium.defaultViewport || { width: 1280, height: 720 },
        executablePath,
        headless: chromium.headless ?? true,
        ignoreHTTPSErrors: true,
      });

      const page = await browser.newPage();
      await page.setContent(htmlContent, {
        waitUntil: ['domcontentloaded', 'networkidle0'],
        timeout: 60000,
      });

      const pdfBuffer = await page.pdf({
        format: pdfOptions.format || 'A4',
        landscape: Boolean(pdfOptions.landscape),
        printBackground: pdfOptions.printBackground !== false,
        preferCSSPageSize: Boolean(pdfOptions.preferCSSPageSize),
        pageRanges: pdfOptions.pageRanges || undefined,
        margin: pdfOptions.margin || {
          top: '10mm',
          bottom: '10mm',
          left: '8mm',
          right: '8mm',
        },
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error('PDF Generation Error (sparticuz/chromium):', error);
      throw error;
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch (closeErr) {
          console.warn('PDF browser close warning:', closeErr.message);
        }
      }
    }
  }
}

module.exports = new PDFService();
