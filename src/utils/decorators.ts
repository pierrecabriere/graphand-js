const extendableMember = (getDefaultValue?, assignRecursive?: (a: any, b: any) => any) => {
  return <T>(target: T, key: keyof T) => {
    Object.defineProperty(target, key, {
      get() {
        const _key = `#${key}`;
        const proto = super.__proto__ || {};
        this[_key] = this[_key] === proto[_key] ? getDefaultValue?.apply(this) : this[_key] || getDefaultValue?.apply(this);

        if (assignRecursive && key in proto) {
          return assignRecursive(this[_key], proto[key]);
        }

        return this[_key];
      },
      set(value) {
        const _key = `#${key}`;
        this[_key] = value;
      },
    });
  };
};

export default extendableMember;
