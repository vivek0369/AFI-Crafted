import { Response } from 'express';
import Report from '../models/Report';
import { AuthRequest } from '../middleware/auth';
import { generateReportPDF } from '../services/pdfService';

export const createReport = async (req: AuthRequest, res: Response) => {
  try {
    const report = new Report({
      ...req.body,
      userId: req.user?.id,
    });
    await report.save();
    res.status(201).json(report);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getReports = async (req: AuthRequest, res: Response) => {
  try {
    const reports = await Report.find({ userId: req.user?.id }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getReportById = async (req: AuthRequest, res: Response) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, userId: req.user?.id });
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateReport = async (req: AuthRequest, res: Response) => {
  try {
    const report = await Report.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?.id },
      req.body,
      { new: true }
    );
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteReport = async (req: AuthRequest, res: Response) => {
  try {
    const report = await Report.findOneAndDelete({ _id: req.params.id, userId: req.user?.id });
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.json({ message: 'Report deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const downloadReportPDF = async (req: AuthRequest, res: Response) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, userId: req.user?.id });
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const pdfBuffer = await generateReportPDF(report);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=estimate_${report._id}.pdf`);
    res.send(pdfBuffer);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
