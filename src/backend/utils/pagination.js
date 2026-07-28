'use strict';

const paginate = (page = 1, limit = 20) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;
  return { offset, limit: limitNum, page: pageNum };
};

const buildPaginationResponse = (data, total, page, limit) => {
  const pages = Math.ceil(total / limit) || 1;
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1,
    },
  };
};

module.exports = { paginate, buildPaginationResponse };
