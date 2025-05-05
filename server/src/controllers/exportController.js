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