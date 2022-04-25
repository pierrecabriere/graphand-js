function isId(input: string): boolean {
  return typeof input === "string" && /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i.test(input);
}

export default isId;
