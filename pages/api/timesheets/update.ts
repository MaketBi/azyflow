import { NextApiRequest, NextApiResponse } from 'next';
import { TimesheetService } from '../../../lib/services/timesheets';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { timesheetId, status } = req.body;

    // Validate input
    if (!timesheetId || typeof timesheetId !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing or invalid timesheetId' });
    }

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Missing or invalid status (must be "approved" or "rejected")' });
    }

    // Call the appropriate service method
    if (status === 'approved') {
      await TimesheetService.approve(timesheetId);
    } else if (status === 'rejected') {
      await TimesheetService.reject(timesheetId);
    }

    // Success response
    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error updating timesheet status:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}