export const sortNumericAlpha = (products) => {
  return [...products].sort((a, b) => {
    const nameA = a.name || '';
    const nameB = b.name || '';

    const aIsNumeric = /^\d/.test(nameA);
    const bIsNumeric = /^\d/.test(nameB);

    if (aIsNumeric && !bIsNumeric) return -1;
    if (!aIsNumeric && bIsNumeric) return 1;

    if (aIsNumeric && bIsNumeric) {
      const aNum = parseInt(nameA.match(/^\d+/)?.[0] || '0', 10);
      const bNum = parseInt(nameB.match(/^\d+/)?.[0] || '0', 10);
      if (aNum !== bNum) return aNum - bNum;
      return nameA.localeCompare(nameB);
    }

    return nameA.localeCompare(nameB);
  });
};
