import { IRate, IShippingCategory, IWeightTier } from "interfaces";
import mysql, { RowDataPacket } from "mysql2/promise";
import XLSX from "xlsx";
import path from "path";
import { ValidateRow, SortCategories, InitCap, SortZones } from "./utils";
import dotenv from "dotenv";
dotenv.config();

/* I wanted to break up the code into smaller, task-oriented blocks,
but to do so without top-level await is most easily accomplished through
a IIFE. */
(async () => {
  try {
    const data = await GetDataset();
    const workbook = BuildWorkbook(data);
    XLSX.writeFile(workbook, path.join(__dirname, "../", "output/report.xlsx"));
  } catch (e) {
    console.log(`Report could not be generated. Details: ${e}.`);
  }
})();

async function GetDataset(): Promise<Map<string, IShippingCategory>> {
  /* Basic connection and query to retrieve the data from the database. To explain the
    order by clause... Sets and Maps in JS are ordered (and iterated) by in
    insertion order. While this isn't necessarily needed due to the provided
    sql dump being ordered already, this means we do not have to sort the
    tier maps later in the code. */

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
  });

  /* This is an unsafe cast, but I couldn't find the documents on how to
  properly type the results object here.*/
  await connection.connect();
  const [results] = (await connection.query<RowDataPacket[]>(
    "SELECT * FROM rates WHERE client_id = 1240 ORDER BY start_weight"
  )) as [IRate[], unknown[]];
  const mappedDataset = new Map<string, IShippingCategory>();
  await connection.end();

  for (const row of results) {
    /* The sql table specification allows for needed columns to be
      null. Accordingly, we need to validate the data. I have chosen to silently
      continue in null cases since, if the db specification was set up to allow
      those values to be null, then presumably there is a reason... But they are
      either useless for this report, or I don't understand how they would be
      represented here.
      */
    if (!ValidateRow(row)) continue;

    /* Since we are using maps for faster lookup, we'll create some
      consistent key names. */
    const categoryKey = `${row.locale}-${row.shipping_speed}`;
    const weightTierKey = `${row.start_weight}-${row.end_weight}`;

    /* We don't want to complicate our logic by having many cascading
      if / else branches. So, if the category isn't already in our map,
      we will make a new one, add it to the map, and then continue the
      rest of our process in the same manner regardless. We remove "intl"
      from speed to keep the naming consistent with the sample output.*/
    let existingCategory = mappedDataset.get(categoryKey);
    if (!existingCategory) {
      existingCategory = {
        speed: row.shipping_speed
          .toLowerCase()
          .replace("intl", "")
          .replace("nextday", "next day"),
        locale: row.locale.toLowerCase(),
        weightTiers: new Map<string, IWeightTier>(),
        zones: new Set<string>(),
      };
      mappedDataset.set(categoryKey, existingCategory);
    }

    existingCategory.zones.add(row.zone);

    /* We'll follow the same process as above for weight tiers. */
    let existingWeightTier = existingCategory.weightTiers.get(weightTierKey);
    if (!existingWeightTier) {
      existingWeightTier = {
        startWeight: row.start_weight,
        endWeight: row.end_weight,
        zoneRates: new Map<string, string>(),
      };
      existingCategory.weightTiers.set(weightTierKey, existingWeightTier);
    }

    /* I'm assuming this should fail if we have duplicated rates in the system,
    as that would indicate data issues that need to be looked into.*/
    if (existingWeightTier.zoneRates.has(row.zone))
      throw new Error(
        "Duplicate shipping rate data exists in the dataset. Validate data and rerun."
      );

    existingWeightTier.zoneRates.set(row.zone, row.rate);
  }

  return mappedDataset;
}

function BuildWorkbook(data: Map<string, IShippingCategory>): XLSX.WorkBook {
  const excelWorkbook = XLSX.utils.book_new();
  const categories = Array.from(data.values()).sort(SortCategories);

  for (const category of categories) {
    const worksheet = BuildWorksheet(category);
    XLSX.utils.book_append_sheet(
      excelWorkbook,
      worksheet,
      InitCap(`${category.locale} ${category.speed} Rates`)
    );
  }

  return excelWorkbook;
}

function BuildWorksheet(data: IShippingCategory): XLSX.WorkSheet {
  /* Converting the zone set to an array once here prevents
     us from converting this for every zone tier. Reason for sorting
     detailed in the utils file. */
  const worksheetContent: string[][] = [];
  const zonesInCategory = Array.from(data.zones.values()).sort(SortZones);
  worksheetContent.push(
    ["Start Weight", "End Weight"].concat(
      zonesInCategory.map((zone) => `Zone ${zone}`)
    )
  );

  for (const [, weightTier] of data.weightTiers) {
    worksheetContent.push(
      [weightTier.startWeight, weightTier.endWeight].concat(
        zonesInCategory.map((zone) => weightTier.zoneRates.get(zone) ?? "N/A")
      )
    );
  }

  const sheet = XLSX.utils.aoa_to_sheet(worksheetContent);
  /* This is for setting the width of the columns. */
  sheet["!cols"] = [{ width: 15 }, { width: 15 }].concat(
    zonesInCategory.map(() => ({ width: 30 }))
  );
  return sheet;
}