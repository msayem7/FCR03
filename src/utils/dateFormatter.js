export function formatDate(dateString) {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: '2-digit' 
    }
    return new Date(dateString).toLocaleDateString('en-US', options)
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