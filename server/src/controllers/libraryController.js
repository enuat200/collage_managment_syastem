import prisma from "../config/prisma.js";
import { createAuditLog } from "../middleware/audit.js";

export const listBooks = async (req, res) => {
  const { search, category } = req.query;
  const where = {};

  if (category) where.category = category;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { author: { contains: search, mode: "insensitive" } },
      { isbn: { contains: search, mode: "insensitive" } },
      { category: { contains: search, mode: "insensitive" } },
    ];
  }

  const books = await prisma.book.findMany({
    where,
    include: {
      copies: true,
      _count: { select: { loans: { where: { status: "BORROWED" } } } },
    },
    orderBy: { title: "asc" },
  });

  res.json(books);
};

export const createBook = async (req, res) => {
  const {
    isbn,
    title,
    author,
    publisher,
    publicationYear,
    category = "General",
    totalCopies = 1,
    shelfLocation,
    description,
  } = req.body;

  const existing = await prisma.book.findUnique({ where: { isbn } });
  if (existing) {
    return res.status(409).json({ message: "A book with this ISBN already exists in the catalog" });
  }

  const copiesCount = Math.max(1, Number(totalCopies) || 1);

  const book = await prisma.book.create({
    data: {
      isbn,
      title,
      author,
      publisher,
      publicationYear: publicationYear ? Number(publicationYear) : null,
      category,
      totalCopies: copiesCount,
      availableCopies: copiesCount,
      shelfLocation,
      description,
      copies: {
        create: Array.from({ length: copiesCount }).map((_, i) => ({
          barcode: `${isbn.replace(/[^0-9A-Z]/gi, "")}-C${i + 1}`,
          copyNumber: i + 1,
          status: "AVAILABLE",
        })),
      },
    },
    include: { copies: true },
  });

  await createAuditLog({
    userId: req.user.id,
    action: "ADD_BOOK",
    entity: "Book",
    entityId: String(book.id),
    details: { isbn, title, author, copies: copiesCount },
    req,
  });

  res.status(201).json(book);
};

export const updateBook = async (req, res) => {
  const { title, author, publisher, publicationYear, category, shelfLocation, description } = req.body;
  const book = await prisma.book.update({
    where: { id: Number(req.params.id) },
    data: {
      title,
      author,
      publisher,
      publicationYear: publicationYear ? Number(publicationYear) : undefined,
      category,
      shelfLocation,
      description,
    },
    include: { copies: true },
  });
  res.json(book);
};

export const deleteBook = async (req, res) => {
  await prisma.book.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: "Book and copies removed from catalog" });
};

// ==================== BOOK LOANS ====================
export const listLoans = async (req, res) => {
  const { status, userId } = req.query;
  const where = {};

  if (status) where.status = status;
  if (userId) where.userId = Number(userId);

  // If student, only view their own loans
  if (req.user.role === "STUDENT") {
    where.userId = req.user.id;
  }

  const loans = await prisma.bookLoan.findMany({
    where,
    include: {
      book: true,
      copy: true,
      user: { select: { id: true, name: true, email: true, role: true } },
      fines: true,
    },
    orderBy: { borrowDate: "desc" },
  });

  res.json(loans);
};

export const borrowBook = async (req, res) => {
  const { bookId, userId, days = 14 } = req.body;

  const targetBook = await prisma.book.findUnique({
    where: { id: Number(bookId) },
    include: { copies: { where: { status: "AVAILABLE" } } },
  });

  if (!targetBook) return res.status(404).json({ message: "Book not found" });

  if (targetBook.availableCopies <= 0 || targetBook.copies.length === 0) {
    return res.status(400).json({ message: "No available physical copies for this book currently" });
  }

  const availableCopy = targetBook.copies[0];
  const borrowDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + Number(days));

  const result = await prisma.$transaction(async (tx) => {
    // Update copy status
    await tx.bookCopy.update({
      where: { id: availableCopy.id },
      data: { status: "BORROWED" },
    });

    // Decrement available copies count
    await tx.book.update({
      where: { id: targetBook.id },
      data: { availableCopies: { decrement: 1 } },
    });

    return tx.bookLoan.create({
      data: {
        bookId: targetBook.id,
        bookCopyId: availableCopy.id,
        userId: Number(userId),
        borrowDate,
        dueDate,
        status: "BORROWED",
      },
      include: {
        book: true,
        copy: true,
        user: { select: { name: true, email: true } },
      },
    });
  });

  await createAuditLog({
    userId: req.user.id,
    action: "BORROW_BOOK",
    entity: "BookLoan",
    entityId: String(result.id),
    details: { bookTitle: targetBook.title, borrowerId: userId, dueDate },
    req,
  });

  res.status(201).json(result);
};

export const returnBook = async (req, res) => {
  const loanId = Number(req.params.id);

  const loan = await prisma.bookLoan.findUnique({
    where: { id: loanId },
    include: { book: true, copy: true },
  });

  if (!loan) return res.status(404).json({ message: "Loan record not found" });
  if (loan.status === "RETURNED") return res.status(400).json({ message: "Book has already been returned" });

  const returnDate = new Date();
  let fineAmount = 0;

  // Calculate overdue fines: $1.00 per day after due date
  if (returnDate > loan.dueDate) {
    const diffTime = Math.abs(returnDate.getTime() - loan.dueDate.getTime());
    const overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    fineAmount = overdueDays * 1.0;
  }

  const result = await prisma.$transaction(async (tx) => {
    if (loan.bookCopyId) {
      await tx.bookCopy.update({
        where: { id: loan.bookCopyId },
        data: { status: "AVAILABLE" },
      });
    }

    await tx.book.update({
      where: { id: loan.bookId },
      data: { availableCopies: { increment: 1 } },
    });

    const updatedLoan = await tx.bookLoan.update({
      where: { id: loanId },
      data: {
        returnDate,
        status: "RETURNED",
        fineAmount,
      },
      include: { book: true, user: { select: { name: true } } },
    });

    if (fineAmount > 0) {
      await tx.fine.create({
        data: {
          loanId: updatedLoan.id,
          amount: fineAmount,
          isPaid: false,
          remarks: `Overdue fine calculated upon return on ${returnDate.toLocaleDateString()}`,
        },
      });
    }

    return updatedLoan;
  });

  await createAuditLog({
    userId: req.user.id,
    action: "RETURN_BOOK",
    entity: "BookLoan",
    entityId: String(loanId),
    details: { bookTitle: loan.book.title, fineAmount },
    req,
  });

  res.json({ message: "Book returned successfully", loan: result, fineAmount });
};
