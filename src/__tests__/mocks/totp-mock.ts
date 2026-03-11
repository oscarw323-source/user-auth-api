export const totpService = {
  generateSecret: jest.fn().mockReturnValue("MOCKSECRET"),
  generateQRCode: jest.fn().mockResolvedValue("data:image/png;base64,mock"),
  verifyCode: jest.fn().mockReturnValue(true),
  getSecret: jest.fn().mockReturnValue("MOCKSECRET"),
};
