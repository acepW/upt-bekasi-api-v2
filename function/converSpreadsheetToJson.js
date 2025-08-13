const convertSpreadsheetToJson = {
  convertSpreadsheetToJSON(data, indexStartData, mapping, mergedFields = []) {
    // Ambil data mulai dari baris yang ditentukan
    const dataRows = data
      .slice(indexStartData)
      .filter(
        (row) =>
          row &&
          row.length > 0 &&
          row.some((cell) => cell !== null && cell !== undefined && cell !== "")
      );

    // Object untuk menyimpan nilai terakhir dari field yang di-merge
    const lastMergedValues = {};

    // Inisialisasi lastMergedValues
    mergedFields.forEach((field) => {
      lastMergedValues[field] = null;
    });

    const result = dataRows.map((row) => {
      const obj = {};

      mapping.forEach((map) => {
        if (map.type === "group") {
          // Field grup
          const groupObj = {};
          for (const [subField, columnIndex] of Object.entries(map.fields)) {
            // Validasi index kolom untuk grup
            if (columnIndex >= 0 && columnIndex < row.length) {
              const cellValue = row[columnIndex];
              groupObj[subField] =
                cellValue !== null &&
                cellValue !== undefined &&
                cellValue !== ""
                  ? cellValue
                  : "-";
            } else {
              groupObj[subField] = "-"; // Index tidak valid atau tidak ada
            }
          }
          obj[map.field] = groupObj;
        } else {
          // Field tunggal
          // Validasi index kolom untuk field tunggal
          if (map.column >= 0 && map.column < row.length) {
            const cellValue = row[map.column];

            // Handle khusus untuk field yang di-merge
            if (mergedFields.includes(map.field)) {
              if (
                cellValue !== null &&
                cellValue !== undefined &&
                cellValue !== ""
              ) {
                // Jika ada nilai, simpan sebagai lastMergedValues dan gunakan
                lastMergedValues[map.field] = cellValue;
                obj[map.field] = cellValue;
              } else {
                // Jika kosong, gunakan lastMergedValues
                obj[map.field] = lastMergedValues[map.field] || "-";
              }
            } else {
              // Untuk field lainnya, proses seperti biasa
              obj[map.field] =
                cellValue !== null &&
                cellValue !== undefined &&
                cellValue !== ""
                  ? cellValue
                  : "-";
            }
          } else {
            obj[map.field] = "-"; // Index tidak valid atau tidak ada
          }
        }
      });

      return obj;
    });

    return {
      metadata: {
        title: data[0]?.[0] || "",
        instruction: data[1]?.[0] || "",
        totalRecords: result.length,
        totalFields: mapping.length,
        generatedAt: new Date().toISOString(),
      },
      data: result,
    };
  },
};

module.exports = convertSpreadsheetToJson;
