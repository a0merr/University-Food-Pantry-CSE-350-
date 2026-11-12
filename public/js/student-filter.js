// FR2/FR3: pure inventory browsing and filtering helpers.
export function availableItems(items) {
  return items.filter(item => item.active === 1 && Number(item.available) > 0);
}

export function categoriesFor(items) {
  return [...new Set(availableItems(items).map(item => String(item.category ?? '').trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
}

export function filterItems(items, query = '', category = '') {
  const search = String(query).trim().toLocaleLowerCase();
  const selectedCategory = String(category).trim().toLocaleLowerCase();
  return availableItems(items).filter(item => {
    const name = String(item.name ?? '').toLocaleLowerCase();
    const itemCategory = String(item.category ?? '').toLocaleLowerCase();
    return (!search || name.includes(search) || itemCategory.includes(search)) &&
      (!selectedCategory || itemCategory === selectedCategory);
  });
}
