/**
 * Logic for estimating delivery dates in India.
 * 
 * Rules:
 * - Metro Cities: 3-4 business days
 * - Rest of India: 5-7 business days
 * - Default: 4-7 business days
 */

const METRO_PINCODES_PREFIXES = [
    '11', // Delhi
    '40', // Mumbai
    '70', // Kolkata
    '60', // Chennai
    '56', // Bangalore
    '50', // Hyderabad
    '38', // Ahmedabad
    '41', // Pune
];

export const getEstimatedDelivery = (pincode) => {
    const today = new Date();
    let minDays = 4;
    let maxDays = 7;

    if (pincode && pincode.length >= 2) {
        const prefix = pincode.substring(0, 2);
        
        // Vijayawada & surrounding AP region (Pincodes starting with 52)
        if (prefix === '52') {
            minDays = 3;
            maxDays = 5;
        } 
        // Metro Cities
        else if (METRO_PINCODES_PREFIXES.includes(prefix)) {
            minDays = 3;
            maxDays = 4;
        } 
        // Rest of India
        else {
            minDays = 6;
            maxDays = 7;
        }
    }

    const minDate = new Date(today);
    minDate.setDate(today.getDate() + minDays);
    
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + maxDays);

    const options = { month: 'short', day: 'numeric' };
    
    return {
        range: `${minDays}-${maxDays} business days`,
        dateRange: `${minDate.toLocaleDateString('en-IN', options)} - ${maxDate.toLocaleDateString('en-IN', options)}`,
        isMetro: minDays === 3
    };
};
