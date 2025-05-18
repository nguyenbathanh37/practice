import { generateExport } from "../services/s3Service.js";

export const exportUserData = async (req, res) => {
  try {
    const { downloadUrl } = await generateExport();
    
    res.json({
      success: true,
      downloadUrl,
      expiresIn: '60',
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Export failed',
      details: error.message 
    });
  }
};

export const apiDocument = async (req, res) => {
  const filePath = path.join(__dirname, 'private', 'report.html');
  try {
    const html = fs.readFileSync(filePath, 'utf8');
    res.type('text/html').send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('Can not read HTML file');
  }
};