type TimeOption = {
  value: string;
  label: string;
};

function toLabel(hour24: number, minute: number): string {
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const minuteLabel = String(minute).padStart(2, "0");
  return `${hour12}:${minuteLabel} ${period}`;
}

export const stayTimeOptions: TimeOption[] = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2);
  const minute = index % 2 === 0 ? 0 : 30;
  const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  return {
    value,
    label: toLabel(hour, minute),
  };
});
