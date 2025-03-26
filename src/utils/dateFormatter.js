


// export function formatDate(dateString, format_key="dd-MMM-YYYY") {
//     const options = { 
//       year: 'numeric', 
//       month: 'short', 
//       day: '2-digit' 
//     }
//     return new Date(dateString).toLocaleDateString('en-US', options)
// }
export function formatDate(dateString, formatKey = process.env.VUE_APP_DATE_FORMAT || "dd-MMM-YYYY") {
  const date = new Date(dateString);
  if (isNaN(date)) {
    return "Invalid Date";
  }

  // Extract components and ensure two digits for day and month if needed.
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // JavaScript month is 0-indexed.
  const year = date.getFullYear();
  const monthShort = date.toLocaleString('en-US', { month: 'short' });

  // Mapping of format keys to their formatted output.
  const formats = {
    "dd/MM/yyyy": `${day}/${month}/${year}`,
    "mm/dd/yyyy": `${month}/${day}/${year}`,
    "dd-MMM-YYYY": `${day}-${monthShort}-${year}`,
  };

  // Return the formatted date, falling back to "dd-MMM-YYYY" if key not found.
  return formats[formatKey] || formats["dd-MMM-YYYY"];
}
  

// Optional: Add different format variants
export const dateFormats = {
  iso: (dateString) => new Date(dateString).toISOString().split('T')[0],
  long: (dateString) => new Date(dateString).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

  
export function formatNumber (value, decimals = 0)  {
  return Number(value).toFixed(decimals)
}
  
// export const formatNumber = (value, decimals = 0) => {
//   return Number(value).toFixed(decimals)
// }