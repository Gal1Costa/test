/* eslint-disable */
/**
 * Optional maps adapter: geocode, reverseGeocode stubs.
 */
async function geocode(address) {
     void address; 
     return { lat: 0, lng: 0 }; 
    }
async function reverseGeocode(lat, lng) {
     void lat;
     void lng; 
     return { address: 'stub' }; 
    }

module.exports = { geocode, reverseGeocode };
