/**
 * Comprehensive validation utilities for Create Hike form
 */

/**
 * Validates a date string to ensure it's not in the past
 */
function validateFutureDate(dateString) {
  if (!dateString) return 'Date is required';
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) {
    return 'Date cannot be in the past';
  }
  return null;
}

/**
 * Validates a positive number
 */
function validatePositiveNumber(value, fieldName, isRequired = false) {
  if (isRequired && (!value || value === '')) {
    return `${fieldName} is required`;
  }
  if (value && value !== '') {
    const num = Number(value);
    if (isNaN(num) || num < 0) {
      return `${fieldName} must be a positive number`;
    }
  }
  return null;
}

/**
 * Validates file size (in bytes) and type
 */
function validateImageFile(file, maxSizeMB = 5) {
  if (!file) return null; // Cover image is optional
  
  const maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  
  if (!allowedTypes.includes(file.type)) {
    return `Image must be one of: JPG, PNG, WebP, or GIF`;
  }
  
  if (file.size > maxSize) {
    return `Image size must be less than ${maxSizeMB}MB`;
  }
  
  return null;
}

/**
 * Validates the complete hike form data
 * @param {Object} formData - The form data object containing basic, trail, route, cover
 * @returns {Object} - Object with isValid boolean and errors object
 */
export function validateHikeForm(formData) {
  const { basic = {}, trail = {}, route = {}, cover = {} } = formData;
  const errors = {};

  // Basic Information Validation
  const basicErrors = {};
  
  if (!basic.name || basic.name.trim() === '') {
    basicErrors.name = 'Hike name is required';
  } else if (basic.name.trim().length < 3) {
    basicErrors.name = 'Hike name must be at least 3 characters';
  } else if (basic.name.trim().length > 100) {
    basicErrors.name = 'Hike name must be less than 100 characters';
  }
  
  const dateError = validateFutureDate(basic.date);
  if (dateError) basicErrors.date = dateError;
  
  if (!basic.meetingTime || basic.meetingTime.trim() === '') {
    basicErrors.meetingTime = 'Meeting time is required';
  }
  
  if (!basic.meetingPlace || basic.meetingPlace.trim() === '') {
    basicErrors.meetingPlace = 'Meeting place is required';
  } else if (basic.meetingPlace.trim().length < 5) {
    basicErrors.meetingPlace = 'Meeting place must be at least 5 characters';
  } else if (basic.meetingPlace.trim().length > 500) {
    basicErrors.meetingPlace = 'Meeting place must be less than 500 characters';
  }
  
  if (!basic.difficulty || basic.difficulty === '') {
    basicErrors.difficulty = 'Difficulty level is required';
  } else if (!['EASY', 'MODERATE', 'HARD'].includes(basic.difficulty)) {
    basicErrors.difficulty = 'Please select a valid difficulty level';
  }
  
  // Capacity validation (optional, can be 0, but must be valid if provided)
  if (basic.capacity !== undefined && basic.capacity !== null && basic.capacity !== '') {
    const capacity = Number(basic.capacity);
    if (isNaN(capacity) || capacity < 0) {
      basicErrors.capacity = 'Capacity must be 0 or greater';
    } else if (capacity > 500) {
      basicErrors.capacity = 'Capacity must be less than 500';
    }
  }
  
  // Price validation: must be integer, no decimals, no leading zeros, max 1000
  if (basic.price && basic.price !== '') {
    const priceStr = String(basic.price).trim();
    // Check for leading zeros (but allow single "0")
    if (priceStr.length > 1 && priceStr[0] === '0') {
      basicErrors.price = 'Price cannot have leading zeros';
    } else {
      const priceNum = Number(basic.price);
      if (isNaN(priceNum) || priceNum < 0) {
        basicErrors.price = 'Price must be a positive number';
      } else if (!Number.isInteger(priceNum)) {
        basicErrors.price = 'Price must be a whole number (no decimals)';
      } else if (priceNum > 1000) {
        basicErrors.price = 'Price must be less than or equal to $1000';
      }
    }
  }
  
  if (basic.location && basic.location.trim().length > 200) {
    basicErrors.location = 'Location must be less than 200 characters';
  }
  
  if (Object.keys(basicErrors).length > 0) {
    errors.basic = basicErrors;
  }

  // Trail Details Validation
  const trailErrors = {};
  
  if (trail.distance && trail.distance.trim() !== '') {
    // Distance can have units (e.g., "8.5 km"), but should start with a number
    const distanceMatch = trail.distance.trim().match(/^(\d+\.?\d*)\s*(km|m|miles|mi)?$/i);
    if (!distanceMatch) {
      trailErrors.distance = 'Distance format invalid (e.g., "8.5 km" or "8500 m")';
    }
  }
  
  // Duration validation: should be in format like "4-5 hours", "3 hours", "2-3 hrs", etc.
  if (trail.duration && trail.duration.trim() !== '') {
    const duration = trail.duration.trim();
    if (duration.length > 50) {
      trailErrors.duration = 'Duration must be less than 50 characters';
    } else {
      // Valid formats: "4 hours", "4-5 hours", "2-3 hrs", "1.5 hours", "30 minutes", etc.
      // Allow numbers, hyphens, spaces, and common time units
      const durationPattern = /^(\d+\.?\d*)\s*-\s*(\d+\.?\d*)?\s*(hours?|hrs?|minutes?|mins?|h|m)$/i;
      const simplePattern = /^(\d+\.?\d*)\s*(hours?|hrs?|minutes?|mins?|h|m)$/i;
      if (!durationPattern.test(duration) && !simplePattern.test(duration)) {
        trailErrors.duration = 'Duration format invalid. Examples: "4-5 hours", "3 hours", "2 hrs", "30 minutes"';
      }
    }
  }
  
  if (trail.elevationGain && trail.elevationGain.trim() !== '') {
    // Elevation can have units (e.g., "1200 m"), but should start with a number
    const elevationMatch = trail.elevationGain.trim().match(/^(\d+\.?\d*)\s*(m|meters|ft|feet)?$/i);
    if (!elevationMatch) {
      trailErrors.elevationGain = 'Elevation gain format invalid (e.g., "1200 m" or "4000 ft")';
    }
  }
  
  if (trail.description && trail.description.trim().length > 5000) {
    trailErrors.description = 'Description must be less than 5000 characters';
  }
  
  if (Object.keys(trailErrors).length > 0) {
    errors.trail = trailErrors;
  }

  // Map Route Validation
  const hasRoutePoints = route.points?.length > 0;
  const hasLocation = route.location?.lat && route.location?.lng;
  if (!hasRoutePoints || !hasLocation) {
    errors.route = {
    points: !hasRoutePoints ? 'Please add at least one point on the map' : undefined,
    location: !hasLocation ? 'Please click to set hike location' : undefined
    };
 }

  // Cover Image Validation
  const coverErrors = {};
  const coverError = validateImageFile(cover.coverFile);
  if (coverError) {
    coverErrors.coverFile = coverError;
  }
  
  if (Object.keys(coverErrors).length > 0) {
    errors.cover = coverErrors;
  }

  // What to Bring - no strict validation, just length check if provided
  // This is handled in basic.whatToBring, but it's optional

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validates a single field (for real-time validation)
 */
export function validateField(section, fieldName, value, allFormData = {}) {
  const { basic = {}, trail = {}, route = {}, cover = {} } = allFormData;
  
  switch (section) {
    case 'basic':
      switch (fieldName) {
        case 'name':
          if (!value || value.trim() === '') return 'Hike name is required';
          if (value.trim().length < 3) return 'Hike name must be at least 3 characters';
          if (value.trim().length > 100) return 'Hike name must be less than 100 characters';
          return null;
        
        case 'date':
          return validateFutureDate(value);
        
        case 'meetingTime':
          if (!value || value.trim() === '') return 'Meeting time is required';
          return null;
        
        case 'meetingPlace':
          if (!value || value.trim() === '') return 'Meeting place is required';
          if (value.trim().length < 5) return 'Meeting place must be at least 5 characters';
          if (value.trim().length > 500) return 'Meeting place must be less than 500 characters';
          return null;
        
        case 'difficulty':
          if (!value || value === '') return 'Difficulty level is required';
          if (!['EASY', 'MODERATE', 'HARD'].includes(value)) {
            return 'Please select a valid difficulty level';
          }
          return null;
        
        case 'capacity':
          if (value !== undefined && value !== null && value !== '') {
            const capNum = Number(value);
            if (isNaN(capNum) || capNum < 0) {
              return 'Capacity must be 0 or greater';
            }
            if (capNum > 500) {
              return 'Capacity must be less than 500';
            }
          }
          return null;
        
        case 'price':
          if (value && value !== '') {
            const priceStr = String(value).trim();
            if (priceStr.length > 1 && priceStr[0] === '0') {
              return 'Price cannot have leading zeros';
            }
            const priceNum = Number(value);
            if (isNaN(priceNum) || priceNum < 0) {
              return 'Price must be a positive number';
            }
            if (!Number.isInteger(priceNum)) {
              return 'Price must be a whole number (no decimals)';
            }
            if (priceNum > 1000) {
              return 'Price must be less than or equal to $1000';
            }
          }
          return null;
        
        case 'location':
          if (value && value.trim().length > 200) {
            return 'Location must be less than 200 characters';
          }
          return null;
        
        default:
          return null;
      }
    
    case 'trail':
      switch (fieldName) {
        case 'distance':
          if (value && value.trim() !== '') {
            const match = value.trim().match(/^(\d+\.?\d*)\s*(km|m|miles|mi)?$/i);
            if (!match) return 'Distance format invalid (e.g., "8.5 km" or "8500 m")';
          }
          return null;
        
        case 'duration':
          if (value && value.trim() !== '') {
            const duration = value.trim();
            if (duration.length > 50) {
              return 'Duration must be less than 50 characters';
            }
            // Valid formats: "4 hours", "4-5 hours", "2-3 hrs", "1.5 hours", "30 minutes", etc.
            const durationPattern = /^(\d+\.?\d*)\s*-\s*(\d+\.?\d*)?\s*(hours?|hrs?|minutes?|mins?|h|m)$/i;
            const simplePattern = /^(\d+\.?\d*)\s*(hours?|hrs?|minutes?|mins?|h|m)$/i;
            if (!durationPattern.test(duration) && !simplePattern.test(duration)) {
              return 'Duration format invalid. Examples: "4-5 hours", "3 hours", "2 hrs", "30 minutes"';
            }
          }
          return null;
        
        case 'elevationGain':
          if (value && value.trim() !== '') {
            const match = value.trim().match(/^(\d+\.?\d*)\s*(m|meters|ft|feet)?$/i);
            if (!match) return 'Elevation gain format invalid (e.g., "1200 m" or "4000 ft")';
          }
          return null;
        
        case 'description':
          if (value && value.trim().length > 5000) {
            return 'Description must be less than 5000 characters';
          }
          return null;
        
        default:
          return null;
      }
    
    case 'cover':
      if (fieldName === 'coverFile') {
        return validateImageFile(value);
      }
      return null;
    
    default:
      return null;
  }
}

/**
 * Gets a user-friendly error message summarizing all validation errors
 * @param {Object} validationResult - The result from validateHikeForm
 * @returns {string|null} - Combined error message or null if valid
 */
export function getValidationErrorMessage(validationResult) {
  if (validationResult.isValid) {
    return null;
  }

  const { errors } = validationResult;
  const errorMessages = [];

  if (errors.basic) {
    const basicErrors = Object.values(errors.basic);
    if (basicErrors.length > 0) {
      errorMessages.push(`Basic Information: ${basicErrors.join(', ')}`);
    }
  }

  if (errors.trail) {
    const trailErrors = Object.values(errors.trail);
    if (trailErrors.length > 0) {
      errorMessages.push(`Trail Details: ${trailErrors.join(', ')}`);
    }
  }

  if (errors.route) {
    const routeErrors = Object.values(errors.route);
    if (routeErrors.length > 0) {
      errorMessages.push(`Map Route: ${routeErrors.join(', ')}`);
    }
  }

  if (errors.cover) {
    const coverErrors = Object.values(errors.cover);
    if (coverErrors.length > 0) {
      errorMessages.push(`Cover Image: ${coverErrors.join(', ')}`);
    }
  }

  return errorMessages.join('. ');
}
