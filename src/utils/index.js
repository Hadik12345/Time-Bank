// Real utility function
export const createPageUrl = (path) => {
    const params = path.split('?');
    const pageName = params[0];
    const query = params.length > 1 ? `?${params[1]}` : '';
    return `/${pageName.toLowerCase()}${query}`;
}