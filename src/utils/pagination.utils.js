export const getPagination = (query) => {
    const page  = Math.max(1, parseInt(query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const offset = (page - 1) * limit;
    return { page, limit, offset };
};

export const paginationMeta = (count, page, limit) => ({
    total: count,
    page,
    limit,
    pages: Math.ceil(count / limit)
});
