import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { resumeParserRouter } from './routes/resumeParserRouter';
import { isMetaforgeParserAvailable } from './metaforgeParser';
import { getAiModelLabel } from './ai/config';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api/resume', resumeParserRouter);
app.use('/', resumeParserRouter);

export const server = app.listen(port, () => {
  const aiAvailable = isMetaforgeParserAvailable();
  console.log(`=======================================================`);
  console.log(`Resume Parser Service is running on http://localhost:${port}`);
  console.log(`AI Engine: ${aiAvailable ? `${getAiModelLabel()} (Active)` : 'Local Deterministic Fallback'}`);
  console.log(`Health Check: http://localhost:${port}/health`);
  console.log(`Endpoints:`);
  console.log(`  POST http://localhost:${port}/api/resume/parse      (form-data field: "resume")`);
  console.log(`  POST http://localhost:${port}/api/resume/parse/bulk (form-data field: "resumes")`);
  console.log(`=======================================================`);
});

export default app;
