"use strict";
const fs = require("fs");
const path = require("path");
const jsdoc2md = require("jsdoc-to-markdown");

/* input and output paths */
const inputFile = "./dist/**/*.js";
const outputDir = "./doc";

/* get template data */
const templateData = jsdoc2md.getTemplateDataSync({ files: inputFile });

function renderMain() {
  const template = `{{>module-index~}}{{>global-index~}}`;
  // console.log(`rendering ${className}, template: ${template}`);
  const output = jsdoc2md.renderSync({ data: templateData, template: template, separators: true });
  fs.writeFileSync(path.resolve(outputDir, `main.md`), output);
}

function renderClasses() {
  /* reduce templateData to an array of class names */
  const classNames = templateData.reduce((classNames, identifier) => {
    if (identifier.kind === "class") classNames.push(identifier.name);
    return classNames;
  }, []);

  /* create a documentation file for each class */
  for (const className of classNames) {
    const template = `{{#class name="${className}"}}{{>docs}}{{/class}}`;
    // console.log(`rendering ${className}, template: ${template}`);
    const output = jsdoc2md.renderSync({ data: templateData, template: template, separators: true });
    fs.writeFileSync(path.resolve(outputDir, `${className}.md`), output);
  }
}

renderMain();
renderClasses();
