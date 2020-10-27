export const propTypes = (prop, options) => {
  let validProp = false;

  if (Array.isArray(options)) {
    options.forEach((option) => (option === prop ? (validProp = true) : null));
    if (!validProp)
      throw new Error(
        `"${prop}" is not a valid PropType. Expected one of ${options.map(
          (option) => `"${option}"`
        )}`
      );
  } else if (options === "bool") {
    if (typeof prop !== "boolean")
      throw new Error(`"${prop}" is not of type boolean`);
  } else if (options === "string") {
    if (typeof prop !== "string")
      throw new Error(`${prop} is not of type string`);
  } else if (options === "number") {
    if (typeof prop !== "number")
      throw new Error(`${prop} is not of type number`);
  }
};
