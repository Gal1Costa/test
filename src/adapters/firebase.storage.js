/* eslint-disable no-unused-vars */
/**
 * Firebase Storage adapter (stubs).
 * TODO: Integrate firebase-admin storage().
 */

/**
 * Upload a file to Firebase Storage.
 * @param {string} key - File path in the bucket (e.g. 'avatars/user123.png')
 * @param {Buffer} buffer - File data
 * @param {string} contentType - MIME type, e.g. 'image/png'
 * @returns {Promise<{ key: string, url: string | null }>}
 */
async function uploadObject(key, buffer, contentType) {
  void key; void buffer; void contentType;
  return { key, url: null }; // TODO: return signed URL
}

/**
 * Delete a file from Firebase Storage.
 * @param {string} key - File path to delete
 * @returns {Promise<boolean>}
 */
async function deleteObject(key) {
  void key;
  return true; // TODO: implement delete
}

/**
 * Get a signed URL to download a file.
 * @param {string} key - File path in the bucket
 * @returns {Promise<string | null>}
 */
async function getSignedUrl(key) {
  void key;
  return null; // TODO: implement signed URL retrieval
}

module.exports = { uploadObject, deleteObject, getSignedUrl };
