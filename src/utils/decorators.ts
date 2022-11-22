import DataFieldTypes from "../enums/data-field-types";

export const ownProperty = (getDefaultValue?, assignRecursive?: (a: any, b: any) => any) => {
  return <T>(target: T, key: keyof T) => {
    const _key = `#${key}`;

    Object.defineProperty(target, key, {
      get() {
        if (!this.hasOwnProperty(_key)) {
          this[_key] = getDefaultValue?.apply(this) || null;
        }

        try {
          if (assignRecursive && this !== this.__proto__ && this.__proto__[key] !== undefined) {
            return assignRecursive(this[_key], this.__proto__[key]);
          }
        } catch (e) {
          console.warn(`Unable to process recursive @ownProperty ${key}`);
        }

        return this[_key];
      },
      set(value) {
        this[_key] = value;
      },
    });
  };
};

export const schemaField = (type: string | DataFieldTypes, options?: any) => {
  return <T>(target: T, key: keyof T) => {};
};
