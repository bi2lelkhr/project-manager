// export const baseUrl = "https://AppInventory.naftal.dz/api/"
export const baseUrl = "http://localhost:3001/api/"


export function parseAndFormatDate(dateString: string | undefined): string {
    // Parse the date string into a Date object
    if(dateString == undefined){
      return "";
    }
      const date = new Date(dateString);
    
      // Ensure the date is valid
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date string");
      }
    
      // Options for formatting the date
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true, // 12-hour format with AM/PM
      };
    
      // Format the date using Intl.DateTimeFormat
      return new Intl.DateTimeFormat('en-US', options).format(date);

    
  }
  export function parseAndFormatShortDate(dateString: string | undefined | null): string {
    // Return empty string if undefined
    if (dateString === undefined  || dateString === null) {
        return "";
    }

    // Parse the date string into a Date object
    const date = new Date(dateString);
    
    // Ensure the date is valid
    if (isNaN(date.getTime())) {
        throw new Error("Invalid date string");
    }
    
    // Options for formatting the date - only day and short month
    const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'short', // 'short' gives us Feb, Mar, etc.
    };
    
    // Format the date and remove any comma that might appear
    const formattedDate = new Intl.DateTimeFormat('en-US', options)
        .format(date)
        .replace(',', ''); // Removes comma between day and month if present
    
    return formattedDate;
}