import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { requireUser } from '../middleware';
import { lookupShipment, publicView } from './tracking';

const router = Router();
router.use(requireUser);

// All shipments belonging to the signed-in customer only
router.get('/shipments', async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT s.*, 
            (SELECT count(*)::int FROM shipment_charges c WHERE c.shipment_id = s.id AND c.status = 'pending') AS pending_charges
     FROM shipments s WHERE s.user_id = $1 ORDER BY s.created_at DESC`,
    [req.userId]
  );
  res.json({ shipments: result.rows });
});

router.get('/shipments/:id', async (req: Request, res: Response) => {
  const shipment = await pool.query(
    'SELECT * FROM shipments WHERE id = $1 AND user_id = $2',
    [req.params.id, req.userId]
  );
  if (!shipment.rowCount) return res.status(404).json({ error: 'Shipment not found' });
  res.json({ shipment: await publicView(shipment.rows[0], true) });
});

// Pending documented charges across the customer's shipments
router.get('/charges', async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT c.id, c.description, c.amount, c.currency, c.status, c.created_at, s.tracking_number
     FROM shipment_charges c JOIN shipments s ON s.id = c.shipment_id
     WHERE s.user_id = $1 ORDER BY c.created_at DESC`,
    [req.userId]
  );
  res.json({ charges: result.rows });
});

// The customer's own tracking activity
router.get('/activity', async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT tracking_number, found, created_at FROM tracking_searches
     WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [req.userId]
  );
  res.json({ activity: result.rows });
});

router.get('/summary', async (req: Request, res: Response) => {
  const counts = await pool.query(
    `SELECT
       count(*)::int AS total,
       count(*) FILTER (WHERE status IN ('In Transit','Customs Clearance','Out for Delivery','Arrived at Sorting Facility'))::int AS in_transit,
       count(*) FILTER (WHERE status = 'Delivered')::int AS delivered,
       count(*) FILTER (WHERE status = 'On Hold')::int AS on_hold
     FROM shipments WHERE user_id = $1`,
    [req.userId]
  );
  res.json(counts.rows[0]);
});

export default router;
