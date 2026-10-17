import { Router } from "express";
import {
  listBooks,
  createBook,
  updateBook,
  deleteBook,
  listLoans,
  borrowBook,
  returnBook,
} from "../controllers/libraryController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

// Catalog
router.get("/books", listBooks);
router.post("/books", authorize("SUPER_ADMIN", "COLLEGE_ADMIN", "LIBRARIAN"), createBook);
router.put("/books/:id", authorize("SUPER_ADMIN", "COLLEGE_ADMIN", "LIBRARIAN"), updateBook);
router.delete("/books/:id", authorize("SUPER_ADMIN", "COLLEGE_ADMIN", "LIBRARIAN"), deleteBook);

// Loans
router.get("/loans", listLoans);
router.post("/loans", authorize("SUPER_ADMIN", "COLLEGE_ADMIN", "LIBRARIAN"), borrowBook);
router.put("/loans/:id/return", authorize("SUPER_ADMIN", "COLLEGE_ADMIN", "LIBRARIAN"), returnBook);

export default router;
