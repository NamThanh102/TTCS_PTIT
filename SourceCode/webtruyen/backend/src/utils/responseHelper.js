const successResponse = (res, statusCode, message, data = null) => {
  const response = {
    success: true,
    statusCode,
    message
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

const paginatedResponse = (res, statusCode, message, data, pagination) => {
  return res.status(statusCode).json({
    success: true,
    statusCode,
    message,
    data,
    pagination
  });
};

module.exports = {
  successResponse,
  paginatedResponse
};
