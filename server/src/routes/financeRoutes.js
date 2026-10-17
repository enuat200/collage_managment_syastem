import { Router } from "express";
import {
  listFeeStructures,
  createFeeStructure,
  listInvoices,
  getInvoice,
  createInvoice,
  recordPayment,
  listPayments,
  getFinancialSummary,
} from "../controllers/financeController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

// Fee structures
router.get("/fee-structures", listFeeStructures);
router.post("/fee-structures", authorize("SUPER_ADMIN", "COLLEGE_ADMIN", "ACCOUNTANT"), createFeeStructure);

// Invoices
router.get("/invoices", listInvoices);
router.get("/invoices/:id", getInvoice);
router.post("/invoices", authorize("SUPER_ADMIN", "COLLEGE_ADMIN", "ACCOUNTANT"), createInvoice);

// Payments
router.get("/payments", authorize("SUPER_ADMIN", "COLLEGE_ADMIN", "ACCOUNTANT"), listPayments);
router.post("/payments", authorize("SUPER_ADMIN", "COLLEGE_ADMIN", "ACCOUNTANT"), recordPayment);

// Financial reports
router.get("/summary", authorize("SUPER_ADMIN", "COLLEGE_ADMIN", "ACCOUNTANT"), getFinancialSummary);

export default router;
