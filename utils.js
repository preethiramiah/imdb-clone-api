const isValidDate = date => (!date && date !== 0) || !isNaN(Date.parse(date));

const isValidURL = url => {
  if (!url && url !== 0) return true;
  try {
    new URL(string);
    return true;
  } catch (err) {
    return false;
  }
}

export { isValidDate, isValidURL };