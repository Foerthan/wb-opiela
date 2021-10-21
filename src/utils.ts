import { IRate, IShippingCategory, NotNull } from "interfaces";
/* We're using a custom sorter for our zones. This is because we have
two types of zone naming - numerical and alphabetical. Regardless, the
data itself is stored in strings. While it's not wholely applicable to
this problem as the data in the dataset does not include more than 9 zones,
a simple string sort (either at the DB level or in our code) would be ordered
improperly when there is a 10th or higher zone. e.g. you would get
["1", "10", "2", ...] */

/* Orderings for the tabs - see my notes in the readme under
matching sample output. */
const localeOrdering = ["domestic", "international"];
const speedOrdering = ["standard", "economy", "expedited", "next day"];

export function SortZones(a: string, b: string): number {
  if (!isNaN(Number(a)) && !isNaN(Number(b))) return Number(a) - Number(b);

  if (a > b) return 1;
  if (a < b) return -1;
  return 0;
}

/* Used for making the sheet names pretty. Initcap implementation shamelessly
  taken from stack overflow:  https://stackoverflow.com/questions/2332811/capitalize-words-in-string */
export function InitCap(input: string): string {
  return input.replace(/\b\w/g, (l) => l.toUpperCase());
}

/* All fields of a row are needed to build the requested output, so we will
  fail validation here if any fields are null. This custom type guard lets us 
  know that none of the values in the object are nulls. */
export function ValidateRow(input: IRate): input is NotNull<IRate> {
  return Object.values(input).filter((value) => value !== null).length > 0;
}

/* Custom category sorting to, again, match the sample output. */
export function SortCategories(a: IShippingCategory, b: IShippingCategory) {
  if (a.locale !== b.locale)
    return localeOrdering.indexOf(a.locale) - localeOrdering.indexOf(b.locale);
  return speedOrdering.indexOf(a.speed) - speedOrdering.indexOf(b.speed);
}
