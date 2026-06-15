function mapMysqlDriverError(err) {
  if (!err || err.statusCode || typeof err.code !== "string" || !err.code.startsWith("ER_")) {
    return null;
  }
  if (err.code === "ER_DUP_ENTRY") {
    return { statusCode: 409, message: "This record conflicts with an existing value." };
  }
  return {
    statusCode: 400,
    message: "Could not save data. Please verify your input and try again.",
  };
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const isMulterError = err && err.name === "MulterError";
  const mysqlMapped = mapMysqlDriverError(err);

  let statusCode =
    err.statusCode ||
    mysqlMapped?.statusCode ||
    (isMulterError ? 400 : 500);

  const messageFromMulter =
    err.code === "LIMIT_FILE_SIZE"
      ? "Each image must be 5MB or smaller."
      : err.code === "LIMIT_FILE_COUNT"
      ? "You can upload at most 10 images."
      : err.message;

  let message;
  if (statusCode === 500) {
    message = "Something went wrong on the server.";
  } else if (mysqlMapped) {
    message = mysqlMapped.message;
  } else if (isMulterError) {
    message = messageFromMulter;
  } else {
    message = err.message;
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" ? { error: err.message } : {}),
  });
}

module.exports = {
  errorHandler,
};
