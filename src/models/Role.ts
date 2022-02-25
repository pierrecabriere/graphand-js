import GraphandFieldBoolean from "../lib/fields/GraphandFieldBoolean";
import GraphandFieldNumber from "../lib/fields/GraphandFieldNumber";
import GraphandFieldRelation from "../lib/fields/GraphandFieldRelation";
import GraphandFieldText from "../lib/fields/GraphandFieldText";
import GraphandModel from "../lib/GraphandModel";

class Role extends GraphandModel {
  protected static _customFields = {};

  static apiIdentifier = "roles";
  static baseUrl = "/roles";
  static scope = "Role";
  static schema = {
    name: new GraphandFieldText({ name: "Nom" }),
    description: new GraphandFieldText({ name: "Description" }),
    admin: new GraphandFieldBoolean({ name: "Administrateur" }),
    level: new GraphandFieldNumber({
      name: "Niveau",
      options: {
        helper:
          "Les utilisateurs ne pourront pas créer ou modifier des utilisateurs dont le niveau de rôle est inférieur au leur. Le rôle administrateur est de niveau 0",
      },
    }),
    inherits: new GraphandFieldRelation({
      name: "Rôles parents",
      ref: "Role",
      multiple: true,
    }),
    modules: new GraphandFieldRelation({
      name: "Applications",
      ref: "Module",
      multiple: true,
    }),
    sidebarModules: new GraphandFieldRelation({
      name: "Applications de la sidebar",
      ref: "Module",
      multiple: true,
    }),
    menuModules: new GraphandFieldRelation({
      name: "Applications du menu",
      ref: "Module",
      multiple: true,
    }),
  };
}

export default Role;
