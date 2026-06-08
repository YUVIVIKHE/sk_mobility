export const parseVehicleDescription = (description = '') => {
  if (!description) {
    return { description: '', modelYear: '', fuelType: '', transmission: '', engineCc: '', seatingCapacity: '' };
  }

  const lines = description.split('\n');
  const mainDesc = lines[0] || '';
  const specLine = lines.slice(1).find((line) => line.includes('|')) || '';

  const getSpec = (label) => {
    const match = specLine.match(new RegExp(`${label}:\\s*([^|]+)`));
    if (!match) return '';
    return match[1].trim().replace(/\s*cc$/i, '');
  };

  return {
    description: mainDesc,
    modelYear: getSpec('Year'),
    fuelType: getSpec('Fuel'),
    transmission: getSpec('Transmission'),
    engineCc: getSpec('Engine'),
    seatingCapacity: getSpec('Seating'),
  };
};

export const buildVehiclePayload = (form) => ({
  categoryId: Number(form.categoryId),
  name: form.name.trim(),
  brand: form.brand.trim() || 'SK Mobility',
  description: form.description.trim() || undefined,
  basePrice: Number(form.basePrice),
  modelYear: form.modelYear || undefined,
  fuelType: form.fuelType || undefined,
  transmission: form.transmission || undefined,
  engineCc: form.engineCc ? Number(form.engineCc) : undefined,
  seatingCapacity: form.seatingCapacity ? Number(form.seatingCapacity) : undefined,
});
