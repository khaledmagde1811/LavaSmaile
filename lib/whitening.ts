export function isTeethWhiteningService(service: {
  name: string;
  category?: string | null;
}) {
  const searchableName = service.name.toLocaleLowerCase();
  const searchableCategory = service.category?.toLocaleLowerCase() ?? "";
  return [searchableName, searchableCategory].some(
    (value) =>
      value.includes("تبييض") ||
      value.includes("whitening") ||
      value.includes("bleaching")
  );
}

export function isCurrentOffer(
  offer: { startDate: string | null; endDate: string | null },
  now = new Date()
) {
  return (
    (!offer.startDate || new Date(offer.startDate) <= now) &&
    (!offer.endDate || new Date(offer.endDate) >= now)
  );
}
