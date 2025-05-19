import { exportUserData } from './exportController.js';
import { generateExport } from '../services/s3Service.js';

// Mock the s3Service module
jest.mock('../services/s3Service.js');

describe('exportUserData', () => {
  let mockRequest, mockResponse;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create mock request and response objects
    mockRequest = {};
    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
  });

  it('should return download URL when export is successful', async () => {
    // Mock the successful response from generateExport
    const mockDownloadUrl = 'https://example.com/export.csv';
    generateExport.mockResolvedValue({ downloadUrl: mockDownloadUrl });

    await exportUserData(mockRequest, mockResponse);

    // Verify the response
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      downloadUrl: mockDownloadUrl,
      expiresIn: '60'
    });
    
    // Verify the service was called
    expect(generateExport).toHaveBeenCalled();
    
    // Verify status was not set (defaults to 200)
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should handle errors and return 500 status', async () => {
    // Mock a failed export
    const mockError = new Error('S3 service unavailable');
    generateExport.mockRejectedValue(mockError);

    await exportUserData(mockRequest, mockResponse);

    // Verify error response
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Export failed',
      details: 'S3 service unavailable'
    });
  });

  it('should handle unexpected error structure', async () => {
    // Mock an error without a message property
    generateExport.mockRejectedValue({ some: 'unexpected error' });

    await exportUserData(mockRequest, mockResponse);

    // Verify error response handles unexpected error format
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Export failed',
      details: undefined // No message property in the error
    });
  });

  // Edge case: empty download URL
  it('should handle empty download URL', async () => {
    generateExport.mockResolvedValue({ downloadUrl: '' });

    await exportUserData(mockRequest, mockResponse);

    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      downloadUrl: '',
      expiresIn: '60'
    });
  });
});