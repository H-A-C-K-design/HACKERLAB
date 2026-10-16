import { Router, Request, Response } from 'express';

export const uploadsRouter = Router();

// Dev mock upload handler for local test / development without live R2 credentials
uploadsRouter.put('/dev-mock-upload', (req: Request, res: Response) => {
  const { key } = req.query;
  return res.status(200).json({
    success: true,
    message: 'Mock file uploaded successfully to local storage.',
    key,
  });
});
