export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Invalid input",
      errors: result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  req.body = result.data;
  next();
};

export const validateIdParam = (req, res, next, value) => {
  if (!Number.isInteger(Number(value))) {
    return res.status(400).json({ message: "Invalid id" });
  }
  next();
};