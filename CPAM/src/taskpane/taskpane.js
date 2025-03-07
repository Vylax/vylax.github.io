/*
 * Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */

/* global console, document, Excel, Office */

Office.onReady((info) => {
    if (info.host === Office.HostType.Excel) {
        // Wire up the Validate button when the taskpane loads
        document.getElementById("validateButton").onclick = validateSheet;
    }
});

/**
 * Runs the column validation
 */
async function validateSheet() {
    await Excel.run(async (context) => {
        const sheet = context.workbook.worksheets.getActiveWorksheet();
        const range = sheet.getUsedRange();
        range.load("values, address");

        await context.sync();

        // Regex rules per column
        const codeRegex = /^\d{9}$/;    // 'Code' - Exactly 9 digits (may start with 0)
        const postalCodeRegex = /^\d{4,5}$/; // 'Code postal' - 4 or 5 digits (may start with 0)

        const headerRow = range.values[0];  // Get the first row (header)
        let errorCount = 0;

        // Find the column indexes for 'Code' and 'Code postal'
        const codeColIndex = headerRow.indexOf('Code');
        const postalCodeColIndex = headerRow.indexOf('Code postal');

        if (codeColIndex === -1 || postalCodeColIndex === -1) {
            console.error("Required columns ('Code' or 'Code postal') not found.");
            return;
        }

        // Loop through cells (starting from row 2, to avoid the header row)
        for (let rowIndex = 1; rowIndex < range.values.length; rowIndex++) {
            const row = range.values[rowIndex];
            let isValid = true;

            // Validate 'Code' column (9 digits)
            const codeValue = row[codeColIndex];
            if (!codeRegex.test(codeValue)) {
                sheet.getRange(`A${rowIndex + 1}`).format.fill.color = "red";  // Highlight invalid cell in 'Code'
                errorCount++;
            } else {
                sheet.getRange(`A${rowIndex + 1}`).format.fill.clear();
            }

            // Validate 'Code postal' column (4 or 5 digits)
            const postalCodeValue = row[postalCodeColIndex];
            if (!postalCodeRegex.test(postalCodeValue)) {
                sheet.getRange(`B${rowIndex + 1}`).format.fill.color = "red";  // Highlight invalid cell in 'Code postal'
                errorCount++;
            } else {
                sheet.getRange(`B${rowIndex + 1}`).format.fill.clear();
            }
        }

        await context.sync();

        // Update status message
        const statusMessage = document.getElementById("statusMessage");
        if (errorCount > 0) {
            statusMessage.textContent = `${errorCount} invalid cells found. Highlighted in red.`;
            statusMessage.style.color = "red";
        } else {
            statusMessage.textContent = "All data is valid!";
            statusMessage.style.color = "green";
        }
    }).catch((error) => {
        console.error(error);
        document.getElementById("statusMessage").textContent = `Error: ${error.message}`;
        document.getElementById("statusMessage").style.color = "red";
    });
}
