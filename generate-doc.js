"use strict";

const fs = require("fs");
const path = require("path");
const jsdoc2md = require("jsdoc-to-markdown");

const inputFile = "./dist-docs/**/*.js";
const outputDir = "./docs";
const templateData = jsdoc2md.getTemplateDataSync({ files: inputFile });
const classNames = [...new Set(templateData.filter((i) => i.kind === "class").map((i) => i.name))];
const typedefNames = [...new Set(templateData.filter((i) => i.kind === "typedef").map((i) => i.name))];

function decodeLinks(md) {
  let regex, regexString;

  // decode class links
  for (const _className of classNames) {
    regexString = `\\(\\#(${_className}(\\+[a-zA-Z]+?)?)\\)`;
    regex = new RegExp(regexString, "g");
    md = md.replace(regex, `(${_className}.md#$1)`);

    regexString = `\"\\#(${_className}(\\+[a-zA-Z]+?)?)\"`;
    regex = new RegExp(regexString, "g");
    md = md.replace(regex, `"${_className}.md#$1"`);
  }

  // decode typedef links
  for (const _typedefName of typedefNames) {
    regexString = `\\(\\#${_typedefName}\\)`;
    regex = new RegExp(regexString, "g");
    md = md.replace(regex, `(typedef.md#${_typedefName})`);

    regexString = `\"\\#${_typedefName}\"`;
    regex = new RegExp(regexString, "g");
    md = md.replace(regex, `"typedef.md#${_typedefName}"`);
  }

  return md;
}

function decodeClass(md) {
  let regex, regexString;

  regexString = `GraphandModel.md#GraphandModel\\+`;
  regex = new RegExp(regexString, "g");
  md = md.replace(regex, `#GraphandModel+`);

  return md;
}

function renderMain() {
  const template = `{{>module-index~}}{{>global-index~}}`;
  let output = jsdoc2md.renderSync({ data: templateData, template, separators: true });
  output = decodeLinks(output);
  fs.writeFileSync(path.resolve(outputDir, `README.md`), output);
}

function renderClasses() {
  for (const className of classNames) {
    const template = `{{#class name="${className}"}}{{>docs}}{{/class}}`;
    let output = jsdoc2md.renderSync({ data: templateData, template, separators: true });
    output = decodeLinks(output);
    output = decodeClass(output);
    fs.writeFileSync(path.resolve(outputDir, `${className}.md`), output);
  }
}

function renderTypedefs() {
  const data = templateData.filter((i) => i.kind === "typedef");
  const template = `{{>main}}`;
  let output = jsdoc2md.renderSync({ data, template, separators: true });
  output = decodeLinks(output);
  fs.writeFileSync(path.resolve(outputDir, `typedef.md`), output);
}

renderMain();
renderClasses();
renderTypedefs();
