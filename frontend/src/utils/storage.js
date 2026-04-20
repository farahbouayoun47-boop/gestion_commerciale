export const setStorageItem = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error('LocalStorage set failed:', error);
  }
};

export const getStorageItem = (key) => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error('LocalStorage get failed:', error);
    return null;
  }
};

export const removeStorageItem = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('LocalStorage remove failed:', error);
  }
};
